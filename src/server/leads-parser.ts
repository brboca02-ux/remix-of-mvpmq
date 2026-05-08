import { StandardLead, normalizeLead } from "./leads-core";

/**
 * Utilitários para parsing inteligente de CSV e mapeamento dinâmico de cabeçalhos.
 */

export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const counts = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  
  if (counts[";"] > counts[","] && counts[";"] > counts["\t"]) return ";";
  if (counts["\t"] > counts[","] && counts["\t"] > counts[";"]) return "\t";
  return ",";
}

export function splitCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === separator && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else cur += char;
  }
  result.push(cur.trim());
  return result;
}

const HEADER_MAP: Record<string, keyof StandardLead | "skip"> = {
  "nome": "nome",
  "name": "nome",
  "razao_social": "razao_social",
  "fantasia": "fantasia",
  "cnpj": "cnpj",
  "numero": "telefone",
  "telefone": "telefone",
  "phone": "telefone",
  "tel": "telefone",
  "whatsapp": "telefone",
  "nota": "confidence_score",
  "rating": "confidence_score",
  "tipo": "atividade",
  "categoria": "atividade",
  "preço": "capital_social",
  "price": "capital_social",
  "endereço": "raw",
  "endereco": "raw",
  "address": "raw",
  "cidade": "cidade",
  "city": "cidade",
  "uf": "uf",
  "estado": "uf",
  "state": "uf",
  "bairro": "bairro",
  "cep": "cep",
  "email": "email",
  "site": "site",
  "porte": "porte",
  "status": "status",
  "linkedin": "site", // Mapping to site temporarily as StandardLead doesn't have linkedin
  "cargo": "raw",
  "role": "raw",
};

export function mapHeaders(headers: string[]): (keyof StandardLead | null)[] {
  return headers.map(h => {
    const normalized = removeAccents(h.toLowerCase().trim());
    for (const [key, field] of Object.entries(HEADER_MAP)) {
      if (normalized.includes(key)) {
        return field === "skip" ? null : field as keyof StandardLead;
      }
    }
    return null;
  });
}

export function parseUniversalCsv(text: string, nicho = "geral"): StandardLead[] {
  const separator = detectSeparator(text);
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const rawHeaders = splitCsvLine(lines[0], separator);
  const headerMapping = mapHeaders(rawHeaders);
  
  const out: StandardLead[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], separator);
    const leadData: any = { nicho, source: "csv_import", raw: {} };
    
    headerMapping.forEach((field, idx) => {
      if (field && cols[idx]) {
        if (field === "raw") {
          leadData.raw[rawHeaders[idx]] = cols[idx];
        } else {
          leadData[field] = cols[idx];
        }
      }
    });

    if (leadData.nome || leadData.cnpj || leadData.telefone) {
      out.push(normalizeLead(leadData));
    }
  }
  return out;
}
