import { ProspectLead } from './types';
import { calculateOpportunityScore } from './opportunity-score';

export const parseRawInput = (input: string): Partial<ProspectLead>[] => {
  const lines = input.split('\n').filter(line => line.trim().length > 0);
  const leads: Partial<ProspectLead>[] = [];

  for (const line of lines) {
    const lead: Partial<ProspectLead> = {
      source: 'Manual input',
      status: 'Novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Extract Instagram handle
    const igMatch = line.match(/@([a-zA-Z0-9._]+)/) || line.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
    if (igMatch) {
      lead.instagramHandle = igMatch[1];
      lead.instagramUrl = `https://instagram.com/${igMatch[1]}`;
    }

    // Extract WhatsApp (rough regex for Brazilian numbers)
    const phoneMatch = line.match(/(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/);
    if (phoneMatch) {
      lead.whatsapp = phoneMatch[0].replace(/\D/g, '');
    }

    // Extract Email
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      lead.email = emailMatch[0];
    }

    // Extract LinkedIn
    const linkedinMatch = line.match(/linkedin\.com\/(?:in|company)\/([a-zA-Z0-9._-]+)/);
    if (linkedinMatch) {
      lead.linkedinUrl = `https://linkedin.com/${linkedinMatch[0].includes('/company/') ? 'company' : 'in'}/${linkedinMatch[1]}`;
    }

    // Clean name (remove Email, IG, URL, Phone, LinkedIn)
    let name = line
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/@([a-zA-Z0-9._]+)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/g, '')
      .replace(/linkedin\.com\/\S+/g, '')
      .replace(/-|\|/g, ' ')
      .trim();
    
    // If name is too short or empty, use IG handle or generic
    lead.companyName = name || (lead.instagramHandle ? `@${lead.instagramHandle}` : "Empresa sem nome");

    leads.push(lead);
  }

  return leads;
};
