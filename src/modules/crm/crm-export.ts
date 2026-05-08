import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProspectLead } from '../prospecting/types';
import { AuditLog } from '@/hooks/useAuditStore';
import { CalendarEvent } from './calendar-store';
import { FollowupTask } from './followup-rules';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  return /[",\n;]/.test(str) ? `"${str}"` : str;
}

function toCsv(rows: (string | number | undefined | null)[][]): string {
  return rows.map((row) => row.map(escapeCsv).join(';')).join('\n');
}

const ts = () => format(new Date(), 'yyyy-MM-dd_HH-mm');

// ===== CSV Exports =====

export function exportLeadsCsv(leads: ProspectLead[]) {
  const header = [
    'ID', 'Empresa', 'Nicho', 'Cidade', 'Bairro', 'Status',
    'Score', 'Nível Oportunidade', 'Email', 'WhatsApp',
    'Instagram', 'LinkedIn', 'Website', 'Origem',
    'Criado em', 'Atualizado em',
  ];
  const rows = leads.map((l) => [
    l.id,
    l.companyName,
    l.niche,
    l.city,
    l.neighborhood,
    l.status,
    l.opportunityScore,
    l.opportunityLevel,
    l.email,
    l.whatsapp,
    l.instagramHandle,
    l.linkedinUrl,
    l.websiteUrl,
    l.source,
    l.createdAt ? format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm') : '',
    l.updatedAt ? format(new Date(l.updatedAt), 'dd/MM/yyyy HH:mm') : '',
  ]);
  const csv = '\uFEFF' + toCsv([header, ...rows]);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `leads_${ts()}.csv`);
}

export function exportInteractionsCsv(
  logs: AuditLog[],
  events: CalendarEvent[],
  tasks: FollowupTask[]
) {
  const header = ['Data/Hora', 'Tipo', 'Lead', 'Ação/Canal', 'Detalhes', 'Origem'];
  const rows: (string | number | undefined)[][] = [];

  for (const log of logs) {
    const summary = log.changes
      .map((c) => `${c.field}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}`)
      .join(' | ');
    rows.push([
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm'),
      'Auditoria',
      log.leadName || log.leadId,
      log.action,
      summary.slice(0, 500),
      log.source,
    ]);
  }
  for (const ev of events) {
    rows.push([
      format(new Date(ev.startTime), 'dd/MM/yyyy HH:mm'),
      'Agenda',
      ev.leadName || '-',
      ev.type,
      `${ev.title}${ev.description ? ' — ' + ev.description : ''}${ev.completed ? ' [concluído]' : ''}`,
      'manual',
    ]);
  }
  for (const t of tasks) {
    rows.push([
      format(new Date(t.triggeredAt), 'dd/MM/yyyy HH:mm'),
      'Follow-up',
      t.leadName,
      t.channel,
      `${t.ruleName} (${t.idleDays}d) — ${t.taskTemplate} [${t.status}]`,
      'system',
    ]);
  }

  rows.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  const csv = '\uFEFF' + toCsv([header, ...rows]);
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    `interacoes_${ts()}.csv`
  );
}

// ===== PDF Exports =====

function pdfHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, 14, 21);
  doc.setTextColor(0, 0, 0);
}

function pdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      14, h - 8
    );
    doc.text(`Página ${i} de ${pageCount}`, w - 14, h - 8, { align: 'right' });
  }
}

export function exportLeadsPdf(leads: ProspectLead[]) {
  const doc = new jsPDF({ orientation: 'landscape' });
  pdfHeader(
    doc,
    'Relatório de Leads — CRM',
    `${leads.length} lead(s) • ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
  );

  autoTable(doc, {
    startY: 34,
    head: [['Empresa', 'Nicho', 'Cidade', 'Status', 'Score', 'WhatsApp', 'Email', 'Atualizado']],
    body: leads.map((l) => [
      l.companyName || '-',
      l.niche || '-',
      l.city || '-',
      l.status,
      `${l.opportunityScore}%`,
      l.whatsapp || '-',
      l.email || '-',
      l.updatedAt ? format(new Date(l.updatedAt), 'dd/MM/yy HH:mm') : '-',
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  pdfFooter(doc);
  doc.save(`leads_${ts()}.pdf`);
}

export function exportInteractionsPdf(
  leads: ProspectLead[],
  logs: AuditLog[],
  events: CalendarEvent[],
  tasks: FollowupTask[]
) {
  const doc = new jsPDF({ orientation: 'portrait' });
  pdfHeader(
    doc,
    'Histórico de Interações — CRM',
    `${leads.length} leads • ${logs.length} eventos de auditoria • ${events.length} compromissos • ${tasks.length} tarefas`
  );

  // Resumo
  autoTable(doc, {
    startY: 34,
    head: [['Métrica', 'Total']],
    body: [
      ['Leads ativos', String(leads.length)],
      ['Leads fechados', String(leads.filter((l) => l.status === 'Lead Fechado').length)],
      ['Leads perdidos', String(leads.filter((l) => l.status === 'Perdido').length)],
      ['Eventos de auditoria', String(logs.length)],
      ['Compromissos agendados', String(events.length)],
      ['Tarefas de follow-up', String(tasks.length)],
      ['Follow-ups pendentes', String(tasks.filter((t) => t.status === 'pending').length)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    margin: { left: 14, right: 14 },
  });

  // Compromissos
  if (events.length > 0) {
    autoTable(doc, {
      head: [['Data', 'Tipo', 'Lead', 'Título', 'Status']],
      body: events
        .slice()
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 80)
        .map((e) => [
          format(new Date(e.startTime), 'dd/MM/yy HH:mm'),
          e.type,
          e.leadName || '-',
          e.title,
          e.completed ? 'Concluído' : 'Pendente',
        ]),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      didDrawPage: (d) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Compromissos & Reuniões', 14, d.cursor!.y - 4);
      },
      margin: { top: 38, left: 14, right: 14 },
    });
  }

  // Tarefas de follow-up
  if (tasks.length > 0) {
    autoTable(doc, {
      head: [['Disparado', 'Lead', 'Canal', 'Regra', 'Dias', 'Status']],
      body: tasks
        .slice()
        .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
        .slice(0, 80)
        .map((t) => [
          format(new Date(t.triggeredAt), 'dd/MM/yy HH:mm'),
          t.leadName,
          t.channel,
          t.ruleName,
          `${t.idleDays}d`,
          t.status,
        ]),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      didDrawPage: (d) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Tarefas de Follow-up Automático', 14, d.cursor!.y - 4);
      },
      margin: { top: 38, left: 14, right: 14 },
    });
  }

  // Auditoria
  if (logs.length > 0) {
    autoTable(doc, {
      head: [['Data', 'Lead', 'Ação', 'Origem', 'Mudanças']],
      body: logs.slice(0, 100).map((l) => {
        const summary = l.changes
          .map((c) => `${c.field}`)
          .slice(0, 6)
          .join(', ');
        return [
          format(new Date(l.timestamp), 'dd/MM/yy HH:mm'),
          (l.leadName || l.leadId).slice(0, 30),
          l.action,
          l.source,
          summary,
        ];
      }),
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      didDrawPage: (d) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Auditoria de Mudanças (últimos 100)', 14, d.cursor!.y - 4);
      },
      margin: { top: 38, left: 14, right: 14 },
    });
  }

  pdfFooter(doc);
  doc.save(`historico_interacoes_${ts()}.pdf`);
}
