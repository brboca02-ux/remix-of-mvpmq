import type { ProspectLead } from '@/modules/prospecting/types';
import { generateMessages, type VariationLevel } from './whatsapp/message-engine';

export interface ExportLead {
  id: string;
  name: string;
  phone: string;     // normalizado: +55…
  business_name: string;
  city: string;
  niche: string;
  whatsappLink: string;
}

export interface ExportResult {
  leads: ExportLead[];
  messages: string[];
  csv: string;
  removedNoPhone: number;
  removedDuplicate: number;
}

function normalizeBrPhone(raw?: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

function csvEscape(v: string): string {
  if (/[",\n;]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function exportLeadsForWhatsapp(
  leads: ProspectLead[],
  variationLevel: VariationLevel = 'medium',
  seed?: number
): ExportResult {
  let removedNoPhone = 0;
  let removedDuplicate = 0;
  const seenPhones = new Set<string>();
  const cleaned: ExportLead[] = [];

  for (const lead of leads) {
    const phone = normalizeBrPhone(lead.whatsapp);
    if (!phone) {
      removedNoPhone++;
      continue;
    }
    if (seenPhones.has(phone)) {
      removedDuplicate++;
      continue;
    }
    seenPhones.add(phone);
    cleaned.push({
      id: lead.id,
      name: lead.companyName ?? '',
      phone,
      business_name: lead.companyName ?? '',
      city: lead.city ?? '',
      niche: lead.niche ?? '',
      whatsappLink: `https://wa.me/${phone.replace('+', '')}`,
    });
  }

  const messages = generateMessages(
    cleaned.map((l) => ({ name: l.name, niche: l.niche, city: l.city })),
    { variationLevel, seed }
  );

  const header = ['name', 'phone', 'business_name', 'city', 'niche', 'whatsapp_link', 'suggested_message'];
  const rows = cleaned.map((l, i) =>
    [l.name, l.phone, l.business_name, l.city, l.niche, l.whatsappLink, messages[i] ?? ''].map(csvEscape).join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  return { leads: cleaned, messages, csv, removedNoPhone, removedDuplicate };
}

export function downloadCsv(csv: string, filename = 'whatsapp-export.csv'): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}