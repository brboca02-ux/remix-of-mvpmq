import { useProspectingStore } from '@/modules/prospecting/prospecting-store';
import type { ProspectLead, LeadStatus } from '@/modules/prospecting/types';
import { computeLeadScore } from './crm-temperature';
import { applyStageChange, renewActionSla, type PipelineStage } from './crm-sla';

export interface IncomingLead {
  name: string;            // razão / nome fantasia / pessoa
  phone?: string;
  business_name?: string;  // nome da empresa
  city?: string;
  niche?: string;
  instagram?: string;
  source: 'buscador' | 'prospeccao' | 'manual' | 'import';
  source_detail?: string;  // ex: 'google_places', 'cnpj', 'csv_import'
  raw?: Record<string, any>;
}

export interface AddResult {
  created: number;
  skipped: number;
  duplicates: { name: string; reason: 'no_name' | 'duplicate' }[];
}

function normPhone(phone?: string): string {
  return (phone ?? '').replace(/\D/g, '');
}
function normKey(s?: string): string {
  return (s ?? '').trim().toLowerCase();
}

/** Adiciona leads ao CRM (store Zustand). Função única — sem login, sem backend. */
export function addLeadsToCRM(leads: IncomingLead[]): AddResult {
  const store = useProspectingStore.getState();
  const existing = store.leads;

  // Índices para detecção rigorosa de duplicatas
  const phoneIndex = new Set(
    existing.map((l) => normPhone(l.whatsapp)).filter((p) => p.length >= 10)
  );
  const businessIndex = new Set(
    existing
      .filter((l) => l.companyName)
      .map((l) => `${normKey(l.companyName)}|${normKey(l.city)}`)
  );
  const cnpjIndex = new Set(
    existing
      .map((l) => (l as any).raw?.cnpj || (l as any).cnpj)
      .filter(Boolean)
      .map((c: string) => c.replace(/\D/g, ''))
  );

  // Filtra o que já está no CRM de qualquer forma
  const trulyNewLeads = leads.filter(lead => {
    const phone = normPhone(lead.phone);
    const cnpj = (lead.raw?.cnpj as string || '').replace(/\D/g, '');
    const name = (lead.name ?? lead.business_name ?? '').trim();
    const businessKey = `${normKey(lead.business_name ?? name)}|${normKey(lead.city)}`;

    const isDuplicate = 
      (cnpj && cnpjIndex.has(cnpj)) || 
      (phone.length >= 10 && phoneIndex.has(phone)) ||
      businessIndex.has(businessKey);

    return !isDuplicate;
  });

  // Limite de 100 leads por dia (apenas para leads vindos do buscador)
  const today = new Date().toISOString().split('T')[0];
  const sentTodayCount = existing.filter(l => 
    l.createdAt && l.createdAt.startsWith(today) && l.source === 'buscador'
  ).length;

  if (sentTodayCount >= 100) {
    throw new Error("Limite diário de 100 leads atingido. Tente novamente amanhã.");
  }

  const remainingQuota = 100 - sentTodayCount;
  const leadsToProcess = trulyNewLeads.slice(0, remainingQuota);

  let created = 0;
  let skipped = 0;
  const duplicates: AddResult['duplicates'] = [];

  for (const lead of leadsToProcess) {
    const name = (lead.name ?? lead.business_name ?? '').trim();
    if (!name) {
      skipped++;
      duplicates.push({ name: lead.name || '(sem nome)', reason: 'no_name' });
      continue;
    }

    const phone = normPhone(lead.phone);
    const businessKey = `${normKey(lead.business_name ?? name)}|${normKey(lead.city)}`;
    const cnpj = (lead.raw?.cnpj as string || '').replace(/\D/g, '');

    // Bloqueio rigoroso (check extra para o lote atual)
    if ((cnpj && cnpjIndex.has(cnpj)) || (phone.length >= 10 && phoneIndex.has(phone)) || businessIndex.has(businessKey)) {
      skipped++;
      duplicates.push({ name, reason: 'duplicate' });
      continue;
    }

    const now = new Date().toISOString();
    const score = computeLeadScore({
      phone,
      instagram: lead.instagram,
      city: lead.city,
      name,
    });

    const newLead: ProspectLead = {
      id: crypto.randomUUID(),
      companyName: lead.business_name ?? name,
      niche: lead.niche ?? '',
      city: lead.city ?? '',
      whatsapp: lead.phone,
      instagramHandle: lead.instagram,
      source: lead.source,
      opportunityScore: score,
      opportunityLevel: score > 70 ? 'quente' : score >= 40 ? 'boa' : 'baixa',
      diagnosis: '',
      status: 'Novo' as LeadStatus,
      createdAt: now,
      updatedAt: now,
      leadScore: score,
      crmSource: lead.source,
      crmSourceDetail: lead.source_detail,
      whatsappSent: false,
      pipelineStage: 'novo',
    };

    Object.assign(newLead, applyStageChange(newLead, 'novo'));
    store.addLead(newLead, 'manual');

    // Atualiza índices locais
    if (cnpj) cnpjIndex.add(cnpj);
    if (phone.length >= 10) phoneIndex.add(phone);
    businessIndex.add(businessKey);
    created++;
  }

  const totalSkipped = skipped + (leads.length - trulyNewLeads.length) + (trulyNewLeads.length - leadsToProcess.length);
  return { created, skipped: totalSkipped, duplicates };
}

/** Muda estágio do pipeline e renova SLA. */
export function setPipelineStage(leadId: string, stage: PipelineStage): void {
  const store = useProspectingStore.getState();
  const lead = store.leads.find((l) => l.id === leadId);
  if (!lead) return;
  const patch = applyStageChange(lead, stage);
  if (stage === 'contato') (patch as any).whatsappSent = true;
  store.updateLead(leadId, patch, 'manual', `Estágio → ${stage}`);
}

/** Botão "Ação realizada": renova SLA mantendo o estágio. */
export function markActionDone(leadId: string): void {
  const store = useProspectingStore.getState();
  const lead = store.leads.find((l) => l.id === leadId);
  if (!lead) return;
  store.updateLead(leadId, renewActionSla(lead), 'manual', 'Ação realizada');
}