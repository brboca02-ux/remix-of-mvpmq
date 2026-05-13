/**
 * Smart CSV Parser
 * 
 * Handles problematic CSV formats commonly found in Google Maps exports:
 * - CSVs without headers
 * - Rating values with commas (e.g., "5,0 (651)")
 * - Addresses with unescaped commas
 * - Variable number of columns
 * - Mixed encodings
 * 
 * @module lib/csv-smart-parser
 */

import type { StandardLead } from "@/lib/leads-shared";

// ============================================================================
// Types
// ============================================================================

export interface SmartParseResult {
  /** Successfully parsed leads */
  leads: StandardLead[];
  /** Detected format */
  format: {
    hasHeaders: boolean;
    delimiter: "," | ";" | "\t";
    columnPattern: "google-maps" | "standard" | "custom";
    encoding: "utf-8" | "latin-1";
  };
  /** Parsing warnings */
  warnings: string[];
  /** Rows that couldn't be parsed */
  errors: Array<{
    line: number;
    content: string;
    reason: string;
  }>;
  /** Raw headers if detected */
  headers?: string[];
  /** Total rows processed */
  totalRows: number;
}

// ============================================================================
// Column Patterns
// ============================================================================

/**
 * Google Maps export pattern:
 * Nome, Telefone, Rating (com virgula), Reviews, Categoria, Algo, Endereço
 * Example: "Empresa Nome,(47) 3202-6309,5,0 (651),Centro saúde,,Rua X, 123"
 */
const GOOGLE_MAPS_PATTERN = {
  description: "Google Maps / Places export",
  columns: ["nome", "telefone", "rating_with_reviews", "categoria", "skip", "endereco"],
};

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect if the first line is a header or data
 */
function detectHasHeaders(firstLine: string, secondLine?: string): boolean {
  // Headers typically don't contain phone patterns, ratings, or addresses
  const hasPhonePattern = /\(\d{2,3}\)\s*\d{3,5}/.test(firstLine);
  const hasRatingPattern = /\d[,.]\d\s*\(\d+\)/.test(firstLine);
  const hasAddressPattern = /\b(rua|av|avenida|travessa|tv|r\.|alameda)\b/i.test(firstLine);
  
  // If first line has these patterns, it's likely data
  if (hasPhonePattern || hasRatingPattern || hasAddressPattern) {
    return false;
  }
  
  // Check if first line looks like headers (short words, common header names)
  const headerKeywords = [
    "nome", "name", "telefone", "phone", "email", "cnpj", 
    "empresa", "razao", "endereco", "cidade", "rating", "categoria"
  ];
  const firstLineLower = firstLine.toLowerCase();
  const hasHeaderKeywords = headerKeywords.some(kw => firstLineLower.includes(kw));
  
  return hasHeaderKeywords;
}

/**
 * Detect if this is a Google Maps style export
 */
function detectGoogleMapsFormat(sampleLine: string): boolean {
  // Pattern: "Name,(phone),rating,reviews,category,,address"
  // Key indicators:
  // 1. Phone in parentheses: (XX) XXXXX-XXXX
  // 2. Rating with comma decimal: X,X (XXX)
  // 3. Multiple commas including empty field
  const hasPhoneInParens = /\(\d{2,3}\)\s*[\d-\s]+/.test(sampleLine);
  const hasRatingWithComma = /\d,\d\s*\(\d+\)/.test(sampleLine);
  const hasEmptyFields = /,,/.test(sampleLine);
  
  return hasPhoneInParens && (hasRatingWithComma || hasEmptyFields);
}

// ============================================================================
// Smart Parser
// ============================================================================

/**
 * Parse a Google Maps style line
 * Handles complex cases like:
 * "Name, (47) 3202-6309, 5,0 (651), Category,, Address with, commas"
 */
function parseGoogleMapsLine(line: string): Partial<StandardLead> | null {
  // Strategy: Extract phone and rating first (they have known patterns),
  // then split remaining parts
  
  // 1. Extract phone if present
  const phoneMatch = line.match(/\(\d{2,3}\)\s*[\d\s-]+/);
  const phone = phoneMatch ? phoneMatch[0].trim() : "";
  
  // 2. Extract rating (X,X (XXX) pattern)
  const ratingMatch = line.match(/(\d),(\d)\s*\((\d+)\)/);
  const rating = ratingMatch ? parseFloat(`${ratingMatch[1]}.${ratingMatch[2]}`) : null;
  const reviewsCount = ratingMatch ? parseInt(ratingMatch[3], 10) : null;
  
  // 3. Replace rating and phone with placeholders to simplify parsing
  let normalizedLine = line;
  const ratingPlaceholder = "___RATING___";
  const phonePlaceholder = "___PHONE___";
  
  if (ratingMatch) {
    normalizedLine = normalizedLine.replace(ratingMatch[0], ratingPlaceholder);
  }
  if (phone) {
    normalizedLine = normalizedLine.replace(phone, phonePlaceholder);
  }
  
  // 4. Now split by comma (rating commas are gone)
  const parts = normalizedLine.split(",").map(p => p.trim());
  
  // Restore placeholders
  const cleanParts = parts.map(p => {
    if (p === ratingPlaceholder) return `${rating} (${reviewsCount})`;
    if (p === phonePlaceholder) return phone;
    return p;
  });
  
  // 5. Extract fields by position - NOW WE KNOW THE STRUCTURE!
  // Position 0: Nome
  // Position 1: Telefone (ou vazio)
  // Position 2: Rating
  // Position 3: Categoria
  // Position 4: (opcional - outro campo ou vazio)
  // Position 5+: Endereço (pode ter vírgulas)
  
  const nome = cleanParts[0]?.trim();
  if (!nome || nome.length < 2) return null;
  
  // Position 1: phone (may be empty)
  // Position 2: rating
  // Position 3: category
  let categoria = cleanParts[3]?.trim() || "";
  
  // Validate if position 3 looks like a category (not address, not number)
  const categoryKeywords = [
    "centro", "saúde", "beleza", "esteticista", "salão", "salao",
    "spa", "loja", "clínica", "clinica", "escola", "serviço", "servico",
    "banho", "depilação", "depilacao", "consultório", "consultorio",
    "academia", "massoterapeuta", "terapeuta", "massagem", "policlínica",
    "policlinica", "lava-rápido", "lava-rapido", "pintura", "dermatologia",
    "emagrecimento", "harmonização", "harmonizacao", "cosmético", "cosmetico",
    "cabeleireiro", "animal", "rejuvenescimento"
  ];
  
  const isLikelyCategory = (text: string): boolean => {
    const lower = text.toLowerCase();
    // Category doesn't start with R., Av., etc
    if (/^(r\.|rua|av\.|avenida|travessa|tv\.|alameda|al\.)/i.test(text)) return false;
    // Category doesn't start with number
    if (/^\d/.test(text)) return false;
    // Category is usually 2-40 chars
    if (text.length > 50 || text.length < 3) return false;
    // Check keywords
    return categoryKeywords.some(kw => lower.includes(kw));
  };
  
  // If position 3 doesn't look like category, scan other positions
  if (categoria && !isLikelyCategory(categoria)) {
    categoria = "";
    for (let i = 2; i < Math.min(cleanParts.length, 6); i++) {
      const part = cleanParts[i];
      if (part && isLikelyCategory(part)) {
        categoria = part;
        break;
      }
    }
  }
  
  // Endereço: tudo depois da categoria
  let endereco = "";
  if (categoria) {
    const categoryIndex = cleanParts.indexOf(categoria);
    if (categoryIndex !== -1 && categoryIndex + 1 < cleanParts.length) {
      endereco = cleanParts
        .slice(categoryIndex + 1)
        .filter(p => p.length > 0)
        .join(", ")
        .trim();
    }
  }
  
  // Fallback: address is last non-empty parts that look like address
  if (!endereco) {
    const addressParts: string[] = [];
    for (let i = cleanParts.length - 1; i >= 0; i--) {
      const part = cleanParts[i];
      if (!part) continue;
      if (/^(r\.|rua|av\.|avenida|travessa|tv\.|alameda|al\.|edifício|edificio)/i.test(part) ||
          /^\d+\s/.test(part)) {
        addressParts.unshift(part);
      } else if (addressParts.length > 0) {
        // Once we found address parts, include preceding parts that might be part of it
        addressParts.unshift(part);
      }
    }
    endereco = addressParts.join(", ").trim();
  }
  
  return {
    nome,
    telefone: phone || undefined,
    atividade: categoria || undefined,
    raw: {
      endereco_completo: endereco,
      rating,
      reviews: reviewsCount,
      source_format: "google-maps",
    },
  };
}

/**
 * Parse standard CSV line (with proper escaping)
 */
function parseStandardLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result.map(c => c.replace(/^"|"$/g, ""));
}

/**
 * Extract city/address info from endereço string
 */
function extractAddressInfo(endereco: string): {
  logradouro: string;
  cidade?: string;
  bairro?: string;
} {
  if (!endereco) return { logradouro: "" };
  
  // Tentar extrair cidade conhecida
  const knownCities = [
    "joinville", "florianópolis", "florianopolis", "blumenau", 
    "são paulo", "sao paulo", "rio de janeiro", "curitiba"
  ];
  
  const lowerAddress = endereco.toLowerCase();
  let cidade: string | undefined;
  
  for (const city of knownCities) {
    if (lowerAddress.includes(city)) {
      cidade = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }
  
  return {
    logradouro: endereco,
    cidade,
  };
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Smart CSV parser that auto-detects format and handles edge cases
 */
export function smartParseCsv(text: string, nicho: string = "geral"): SmartParseResult {
  // If the nicho is "solar" and the text looks like "estetica", let's fix the default
  const lowerText = text.toLowerCase().substring(0, 1000);
  let effectiveNicho = nicho;
  if (nicho === "solar" && (lowerText.includes("estetica") || lowerText.includes("clinica") || lowerText.includes("salao"))) {
    effectiveNicho = "estetica";
  }

  const warnings: string[] = [];
  const errors: Array<{ line: number; content: string; reason: string }> = [];
  const leads: StandardLead[] = [];
  
  // Clean text
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1); // Remove BOM
  }
  
  const lines = cleanText.split(/\r?\n|\r/).filter(l => l.trim().length > 0);
  
  if (lines.length === 0) {
    return {
      leads: [],
      format: {
        hasHeaders: false,
        delimiter: ",",
        columnPattern: "standard",
        encoding: "utf-8",
      },
      warnings: ["Arquivo vazio"],
      errors: [],
      totalRows: 0,
    };
  }

  // ============================================================================
  // DETECT DELIMITER: pipe, semicolon, tab, or comma
  // ============================================================================
  const firstFewLines = lines.slice(0, 5).join('\n');
  const pipeCount = (firstFewLines.match(/\|/g) || []).length;
  const semiCount = (firstFewLines.match(/;/g) || []).length;
  const tabCount = (firstFewLines.match(/\t/g) || []).length;
  const commaCount = (firstFewLines.match(/,/g) || []).length;
  
  // If pipe is the dominant separator, use pipe-based parsing
  // NOTA: Se pipe aparece pelo menos 3x nas primeiras linhas, é pipe-delimited
  // (mesmo que tenha vírgulas em campos de endereço)
  const avgPipesPerLine = pipeCount / Math.min(5, lines.length);
  const isPipeDelimited = avgPipesPerLine >= 3 || (pipeCount > commaCount && pipeCount > semiCount);
  const isSemiDelimited = !isPipeDelimited && semiCount > commaCount && semiCount > pipeCount && semiCount > tabCount;
  const isTabDelimited = !isPipeDelimited && !isSemiDelimited && tabCount > commaCount && tabCount > pipeCount && tabCount > semiCount;
  
  let detectedDelimiter = ",";
  if (isPipeDelimited) detectedDelimiter = "|";
  else if (isSemiDelimited) detectedDelimiter = ";";
  else if (isTabDelimited) detectedDelimiter = "\t";

  // If pipe/semicolon/tab delimited, use simple split parser (much more reliable)
  if (detectedDelimiter !== ",") {
    warnings.push(`Delimitador detectado: "${detectedDelimiter === "|" ? "pipe (|)" : detectedDelimiter === ";" ? "ponto e vírgula (;)" : "tab"}"`);
    
    // Detect headers
    const firstLine = lines[0];
    const headerKeywords = ["nome", "name", "telefone", "phone", "email", "cnpj", "empresa", "razao", "fantasia", "cidade", "uf"];
    const firstLineLower = firstLine.toLowerCase();
    const hasHeaders = headerKeywords.some(kw => firstLineLower.includes(kw));
    
    const startIdx = hasHeaders ? 1 : 0;
    const headers = hasHeaders ? firstLine.split(detectedDelimiter).map(h => h.trim()) : undefined;
    
    if (hasHeaders && headers) {
      warnings.push(`Cabeçalhos: ${headers.slice(0, 5).join(", ")}${headers.length > 5 ? "..." : ""}`);
    }
    
    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(detectedDelimiter).map(c => c.trim());
      if (cols.length === 0 || !cols[0]) continue;
      
      let leadData: Partial<StandardLead>;
      
      if (hasHeaders && headers) {
        leadData = mapWithHeaders(cols, headers);
      } else {
        // Positional: first col = nome, try to detect others
        leadData = {
          nome: cols[0],
          telefone: cols.find(c => /^\d{10,11}$/.test(c.replace(/\D/g, ''))) || cols[1] || undefined,
          raw: { all_fields: cols },
        };
        
        // Try to find CNPJ (14 digits)
        const cnpjCol = cols.find(c => c.replace(/\D/g, '').length === 14);
        if (cnpjCol) (leadData as any).cnpj = cnpjCol.replace(/\D/g, '');
        
        // Try to find city (common patterns)
        const cityCol = cols.find(c => /^[A-Z][a-záéíóúãõ\s]+$/.test(c) && c.length > 3 && c.length < 30);
        if (cityCol) leadData.cidade = cityCol;
        
        // Try to find UF (2 uppercase letters)
        const ufCol = cols.find(c => /^[A-Z]{2}$/.test(c));
        if (ufCol) leadData.uf = ufCol;
        
        // Try to find atividade/categoria (longer text fields)
        const atividadeCol = cols.find(c => c.length > 15 && !/^\d/.test(c) && c !== cols[0]);
        if (atividadeCol) leadData.atividade = atividadeCol;
      }
      
      if (leadData && leadData.nome && leadData.nome.length > 1) {
        const finalLead: StandardLead = {
          nome: leadData.nome,
          telefone: leadData.telefone || null,
          email: leadData.email || null,
          cnpj: (leadData as any).cnpj || null,
          razao_social: leadData.razao_social || null,
          fantasia: leadData.fantasia || null,
          cidade: leadData.cidade || null,
          uf: leadData.uf || null,
          bairro: leadData.bairro || null,
          cep: leadData.cep || null,
          site: leadData.site || null,
          porte: leadData.porte || null,
          status: leadData.status || null,
          atividade: leadData.atividade || null,
          capital_social: leadData.capital_social || 0,
          nicho: effectiveNicho,
          source: "csv_import",
          confidence_score: 0.6,
          raw: leadData.raw || {},
        };
        leads.push(finalLead);
      } else {
        errors.push({ line: i + 1, content: lines[i].substring(0, 80), reason: "Nome não encontrado" });
      }
    }
    
    return {
      leads,
      format: { hasHeaders: !!headers, delimiter: detectedDelimiter as any, columnPattern: "standard", encoding: "utf-8" },
      warnings,
      errors,
      headers,
      totalRows: lines.length - (headers ? 1 : 0),
    };
  }
  
  // ============================================================================
  // COMMA-DELIMITED: Original logic (Google Maps format detection)
  // ============================================================================
  
  // Detect format
  const firstLine = lines[0];
  const secondLine = lines[1];
  const isGoogleMapsFormat = detectGoogleMapsFormat(firstLine);
  const hasHeaders = !isGoogleMapsFormat && detectHasHeaders(firstLine, secondLine);
  
  let columnPattern: "google-maps" | "standard" | "custom" = "standard";
  if (isGoogleMapsFormat) {
    columnPattern = "google-maps";
    warnings.push("Formato Google Maps detectado. Usando parser inteligente.");
  }
  
  // Process lines
  const startIndex = hasHeaders ? 1 : 0;
  const headers = hasHeaders ? parseStandardLine(firstLine, ",") : undefined;
  
  if (hasHeaders) {
    warnings.push(`Cabeçalhos detectados: ${headers?.slice(0, 5).join(", ")}${(headers?.length ?? 0) > 5 ? "..." : ""}`);
  } else {
    warnings.push("CSV sem cabeçalhos detectado. Usando parser por posição.");
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      let leadData: Partial<StandardLead> | null = null;
      
      if (isGoogleMapsFormat) {
        leadData = parseGoogleMapsLine(line);
        
        // Fallback: se o parser Google Maps falhou, tentar extrair pelo menos o nome
        if (!leadData) {
          const parts = line.split(",").map(p => p.trim());
          const nome = parts[0];
          if (nome && nome.length > 2) {
            // Extrair telefone se presente em qualquer posição
            const phoneInLine = line.match(/\(\d{2,3}\)\s*[\d\s-]+/);
            leadData = {
              nome,
              telefone: phoneInLine ? phoneInLine[0].trim() : undefined,
              atividade: undefined,
              raw: { original_line: line, parse_method: 'fallback' },
            };
          }
        }
      } else if (hasHeaders && headers) {
        // Parse with headers (standard CSV)
        const cols = parseStandardLine(line, ",");
        leadData = mapWithHeaders(cols, headers);
      } else {
        // Parse without headers (best effort)
        const cols = parseStandardLine(line, ",");
        leadData = mapByPosition(cols);
      }
      
      if (leadData && leadData.nome) {
        // Enhance with address info
        if (leadData.raw && typeof leadData.raw === 'object' && 'endereco_completo' in leadData.raw) {
          const addressInfo = extractAddressInfo(String(leadData.raw.endereco_completo));
          if (addressInfo.cidade && !leadData.cidade) {
            leadData.cidade = addressInfo.cidade;
          }
        }
        
        // Set defaults
        const finalLead: any = {
          nome: leadData.nome,
          telefone: leadData.telefone,
          email: leadData.email,
          cnpj: leadData.cnpj,
          razao_social: leadData.razao_social,
          fantasia: leadData.fantasia,
          cidade: leadData.cidade || "Joinville", 
          uf: leadData.uf || "SC",
          bairro: leadData.bairro,
          cep: leadData.cep,
          site: leadData.site,
          porte: leadData.porte,
          status: leadData.status,
          atividade: leadData.atividade,
          capital_social: leadData.capital_social,
          nicho: effectiveNicho,
          source: "csv_import",
          confidence_score: 0.7,
          raw: leadData.raw || {},
        };
        
        leads.push(finalLead);
      } else {
        errors.push({
          line: i + 1,
          content: line.substring(0, 100),
          reason: "Não foi possível extrair nome da empresa",
        });
      }
    } catch (err) {
      errors.push({
        line: i + 1,
        content: line.substring(0, 100),
        reason: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }
  
  if (errors.length > 0) {
    warnings.push(`${errors.length} linha(s) não puderam ser processadas`);
  }
  
  return {
    leads,
    format: {
      hasHeaders,
      delimiter: ",",
      columnPattern,
      encoding: "utf-8",
    },
    warnings,
    errors,
    headers,
    totalRows: lines.length - startIndex,
  };
}

/**
 * Map columns to lead fields using headers
 */
function mapWithHeaders(cols: string[], headers: string[]): Partial<StandardLead> | null {
  const lead: Partial<StandardLead> = { raw: {} };
  
  const HEADER_MAP: Record<string, keyof StandardLead> = {
    nome: "nome",
    name: "nome",
    empresa: "nome",
    razao_social: "razao_social",
    "razão social": "razao_social",
    fantasia: "fantasia",
    cnpj: "cnpj",
    telefone: "telefone",
    phone: "telefone",
    tel: "telefone",
    whatsapp: "telefone",
    celular: "telefone",
    numero: "telefone",
    número: "telefone",
    email: "email",
    "e-mail": "email",
    cidade: "cidade",
    city: "cidade",
    uf: "uf",
    estado: "uf",
    bairro: "bairro",
    cep: "cep",
    site: "site",
    website: "site",
    porte: "porte",
    status: "status",
    atividade: "atividade",
    categoria: "atividade",
    tipo: "atividade",
  };
  
  headers.forEach((header, idx) => {
    const normalized = header
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    
    const value = cols[idx]?.trim();
    if (!value) return;
    
    const field = HEADER_MAP[normalized];
    if (field) {
      (lead as Record<string, unknown>)[field] = value;
    } else {
      // Preserve unmapped fields in raw
      if (lead.raw && typeof lead.raw === 'object') {
        (lead.raw as Record<string, unknown>)[header] = value;
      }
    }
  });
  
  return lead.nome ? lead : null;
}

/**
 * Map columns by position (fallback when no headers)
 */
function mapByPosition(cols: string[]): Partial<StandardLead> | null {
  if (cols.length === 0 || !cols[0]) return null;
  
  // Best effort positional mapping
  const [nome, telefone, ...rest] = cols;
  
  return {
    nome: nome.trim(),
    telefone: telefone?.trim(),
    raw: {
      extras: rest.join(" | "),
    },
  };
}

/**
 * Validate parse result has usable leads
 */
export function validateSmartParseResult(result: SmartParseResult): {
  valid: boolean;
  message: string;
} {
  if (result.leads.length === 0) {
    return {
      valid: false,
      message: "Nenhum lead válido foi encontrado no arquivo",
    };
  }
  
  const successRate = result.leads.length / result.totalRows;
  if (successRate < 0.5) {
    return {
      valid: false,
      message: `Taxa de sucesso muito baixa (${Math.round(successRate * 100)}%). Verifique o formato do arquivo.`,
    };
  }
  
  return {
    valid: true,
    message: `${result.leads.length} de ${result.totalRows} linhas importadas com sucesso`,
  };
}
