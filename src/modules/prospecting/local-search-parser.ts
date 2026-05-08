import { ProspectLead } from './types';
import { calculateOpportunityScore } from './opportunity-score';

/**
 * Valida se o número é um WhatsApp válido (Brasil) e formata
 */
export const validateAndFormatWhatsApp = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatos válidos: 10 dígitos (DDD + 8 números) ou 11 dígitos (DDD + 9 + 8 números)
  if (cleaned.length === 11 || cleaned.length === 10) {
    return cleaned;
  }
  
  return '';
};

export const normalizePhone = validateAndFormatWhatsApp;

/**
 * Parses raw local search data (TSV, CSV, or pasted table)
 */
export const parseLocalSearchInput = (
  input: string, 
  niche: string, 
  location: string
): Partial<ProspectLead>[] => {
  if (!input.trim()) return [];

  const lines = input.trim().split('\n');
  const leads: Partial<ProspectLead>[] = [];
  
  // Basic headers mapping (common in scraping tools / local search tools)
  // Expected columns: Nome, Número, Nota, Tipo, Preço, Endereço
  
  lines.forEach(line => {
    // Split by tab (Excel/Sheets paste) or comma
    const columns = line.includes('\t') ? line.split('\t') : line.split(',');
    
    if (columns.length < 2) return; // Skip empty/invalid lines

    const lead: Partial<ProspectLead> = {
      companyName: columns[0]?.trim() || 'Empresa sem nome',
      whatsapp: normalizePhone(columns[1]?.trim() || ''),
      rating: parseFloat(columns[2]?.trim() || '0') || undefined,
      niche: columns[3]?.trim() || niche || 'Nicho local',
      priceLevel: columns[4]?.trim() || undefined,
      address: columns[5]?.trim() || undefined,
      city: location || 'Não informada',
      source: 'busca_local',
      searchNiche: niche,
      searchLocation: location,
      status: 'Novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.push(lead);
  });

  return leads;
};
