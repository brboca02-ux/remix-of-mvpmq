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
  
  // GUARD: If the line has 10+ comma-separated fields, it's NOT Google Maps.
  // Google Maps exports have ~6-7 fields max. Receita Federal / CNPJ exports have 15-25+ fields.
  const fieldCount = sampleLine.split(",").length;
  if (fieldCount >= 10) return false;
  
  // GUARD: If any field looks like a CNPJ (14 digits), it's a Receita Federal export
  const fields = sampleLine.split(",");
  const hasCnpjField = fields.some(f => {
    const digits = f.trim().replace(/\D/g, "");
    return digits.length === 14;
  });
  if (hasCnpjField) return false;
  
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
    const headerKeywords = ["nome", "name", "telefone", "phone", "email", "cnpj", "empresa", "razao", "fantasia", "cidade", "uf", "atividade", "municipio", "bairro", "cep", "porte", "capital"];
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
      
      let leadData: Partial<StandardLead> | null;
      
      if (hasHeaders && headers) {
        leadData = mapWithHeaders(cols, headers);
      } else {
        // Positional: Detect field types by content pattern
        leadData = { raw: { all_fields: cols } };
        
        for (const col of cols) {
          if (!col) continue;
          
          // CNPJ (14 digits or formatted XX.XXX.XXX/XXXX-XX)
          const cleanCol = col.replace(/\D/g, '');
          if (!leadData.cnpj && cleanCol.length === 14 && /^\d{14}$/.test(cleanCol)) {
            (leadData as any).cnpj = cleanCol;
            continue;
          }
          
          // Phone (10-11 digits, or formatted with parens/dashes)
          if (!leadData.telefone && cleanCol.length >= 10 && cleanCol.length <= 11 && /^\d+$/.test(cleanCol)) {
            leadData.telefone = cleanCol;
            continue;
          }
          // Phone with formatting
          if (!leadData.telefone && /^\(?\d{2,3}\)?\s*\d{4,5}[-\s]?\d{4}$/.test(col)) {
            leadData.telefone = col.replace(/\D/g, '');
            continue;
          }
          
          // CEP (8 digits or XXXXX-XXX)
          if (!leadData.cep && (cleanCol.length === 8 && /^\d{8}$/.test(cleanCol)) || /^\d{5}-?\d{3}$/.test(col)) {
            leadData.cep = cleanCol.length === 8 ? cleanCol : col.replace(/\D/g, '');
            continue;
          }
          
          // UF (exactly 2 uppercase letters)
          if (!leadData.uf && /^[A-Z]{2}$/.test(col)) {
            leadData.uf = col;
            continue;
          }
          
          // Email
          if (!leadData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(col)) {
            leadData.email = col;
            continue;
          }
          
          // Website
          if (!leadData.site && /^(https?:\/\/|www\.)/i.test(col)) {
            leadData.site = col;
            continue;
          }
          
          // Capital social (number with dots/commas as thousands separator)
          if (!leadData.capital_social && /^\d{1,3}(\.\d{3})*(,\d{2})?$/.test(col) && col.length > 4) {
            leadData.capital_social = parseFloat(col.replace(/\./g, '').replace(',', '.'));
            continue;
          }
        }
        
        // Nome: first text column that's not a detected field
        if (!leadData.nome) {
          for (const col of cols) {
            if (!col || col.length < 2) continue;
            const cleanCol = col.replace(/\D/g, '');
            // Skip if it's a number-only field (CNPJ, phone, CEP, capital)
            if (cleanCol.length === 14 || (cleanCol.length >= 10 && cleanCol.length <= 11) || cleanCol.length === 8) continue;
            if (/^[A-Z]{2}$/.test(col)) continue;
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(col)) continue;
            if (/^(https?:\/\/|www\.)/i.test(col)) continue;
            if (/^\d{1,3}(\.\d{3})*(,\d{2})?$/.test(col) && col.length > 4) continue;
            // This is likely the name
            leadData.nome = col;
            break;
          }
        }
        
        // Ultimate fallback: use first column with 3+ chars as nome
        if (!leadData.nome && cols[0] && cols[0].length >= 3) {
          leadData.nome = cols[0];
        }
        
        // Cidade: text field that looks like a city name (capitalized, 3-30 chars, not the nome)
        if (!leadData.cidade) {
          for (const col of cols) {
            if (!col || col === leadData.nome || col.length < 3 || col.length > 40) continue;
            const cleanCol = col.replace(/\D/g, '');
            if (cleanCol.length === 14 || (cleanCol.length >= 10 && cleanCol.length <= 11) || cleanCol.length === 8) continue;
            if (/^[A-Z]{2}$/.test(col)) continue;
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(col)) continue;
            if (/^(https?:\/\/|www\.)/i.test(col)) continue;
            // City names are typically capitalized words
            if (/^[A-ZÀ-Ú][a-záéíóúãõâêîôûç\s]+$/.test(col) || /^[A-ZÀ-Ú\s]+$/.test(col)) {
              leadData.cidade = col;
              break;
            }
          }
        }
        
        // Atividade: longer text field that's not nome or cidade
        if (!leadData.atividade) {
          for (const col of cols) {
            if (!col || col === leadData.nome || col === leadData.cidade) continue;
            if (col.length > 15 && !/^\d/.test(col) && !/^[A-Z]{2}$/.test(col)) {
              const cleanCol = col.replace(/\D/g, '');
              if (cleanCol.length === 14 || (cleanCol.length >= 10 && cleanCol.length <= 11)) continue;
              if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(col)) continue;
              if (/^(https?:\/\/|www\.)/i.test(col)) continue;
              leadData.atividade = col;
              break;
            }
          }
        }
      }
      
      if (leadData && (leadData.nome || leadData.razao_social || leadData.fantasia) && (leadData.nome || leadData.razao_social || leadData.fantasia)!.length > 1) {
        // Fallback: usar razao_social ou fantasia como nome se nome não foi encontrado
        const effectiveNome = leadData.nome || leadData.razao_social || leadData.fantasia || "";
        const finalLead: StandardLead = {
          nome: effectiveNome,
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
  const isReceitaFederal = detectReceitaFederalFormat(lines);
  const isGoogleMapsFormat = !isReceitaFederal && detectGoogleMapsFormat(firstLine);
  const hasHeaders = !isGoogleMapsFormat && !isReceitaFederal && detectHasHeaders(firstLine, secondLine);
  
  let columnPattern: "google-maps" | "standard" | "custom" = "standard";
  if (isGoogleMapsFormat) {
    columnPattern = "google-maps";
    warnings.push("Formato Google Maps detectado. Usando parser inteligente.");
  } else if (isReceitaFederal) {
    columnPattern = "custom";
    warnings.push("Formato Receita Federal (CNPJ) detectado. Usando parser especializado.");
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
      
      if (leadData && (leadData.nome || leadData.razao_social || leadData.fantasia)) {
        // Fallback: usar razao_social ou fantasia como nome
        const effectiveNomeCsv = leadData.nome || leadData.razao_social || leadData.fantasia || "";
        
        // Enhance with address info
        if (leadData.raw && typeof leadData.raw === 'object' && 'endereco_completo' in leadData.raw) {
          const addressInfo = extractAddressInfo(String(leadData.raw.endereco_completo));
          if (addressInfo.cidade && !leadData.cidade) {
            leadData.cidade = addressInfo.cidade;
          }
        }
        
        // Set defaults
        const finalLead: any = {
          nome: effectiveNomeCsv,
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
    "nome fantasia": "fantasia",
    "nome_fantasia": "fantasia",
    "nome empresarial": "nome",
    razao_social: "razao_social",
    "razão social": "razao_social",
    "razao social": "razao_social",
    "razao": "razao_social",
    fantasia: "fantasia",
    cnpj: "cnpj",
    telefone: "telefone",
    phone: "telefone",
    tel: "telefone",
    whatsapp: "telefone",
    celular: "telefone",
    numero: "telefone",
    número: "telefone",
    "ddd+telefone": "telefone",
    "telefone 1": "telefone",
    "telefone1": "telefone",
    "contato telefônico": "telefone",
    "contato": "telefone",
    fone: "telefone",
    "contato celular": "telefone",
    "tel_contato": "telefone",
    "telefone fixo": "telefone",
    email: "email",
    "e-mail": "email",
    cidade: "cidade",
    city: "cidade",
    municipio: "cidade",
    município: "cidade",
    uf: "uf",
    estado: "uf",
    bairro: "bairro",
    cep: "cep",
    site: "site",
    website: "site",
    url: "site",
    porte: "porte",
    "porte da empresa": "porte",
    "porte empresa": "porte",
    status: "status",
    "situacao cadastral": "status",
    "situação cadastral": "status",
    situacao: "status",
    atividade: "atividade",
    "atividade principal": "atividade",
    "atividade_principal": "atividade",
    "cnae principal": "atividade",
    "cnae_principal": "atividade",
    "descricao cnae": "atividade",
    "descrição cnae": "atividade",
    cnae: "atividade",
    categoria: "atividade",
    tipo: "atividade",
    segmento: "atividade",
    ramo: "atividade",
    "capital social": "capital_social",
    capital_social: "capital_social",
    capital: "capital_social",
    logradouro: "bairro",
    endereco: "bairro",
    endereço: "bairro",
  };
  
  headers.forEach((header, idx) => {
    const normalized = header
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[_\-\s]+/g, " ")
      .trim();
    
    const value = cols[idx]?.trim();
    if (!value) return;
    
    // Exact match first
    let field = HEADER_MAP[normalized];
    
    // Partial match if no exact match
    if (!field) {
      for (const [key, mappedField] of Object.entries(HEADER_MAP)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          field = mappedField;
          break;
        }
      }
    }
    
    if (field) {
      (lead as Record<string, unknown>)[field] = value;
    } else {
      // Preserve unmapped fields in raw
      if (lead.raw && typeof lead.raw === 'object') {
        (lead.raw as Record<string, unknown>)[header] = value;
      }
    }
  });
  
  // Fallback: se não tem "nome" explícito, usar razao_social ou fantasia
  if (!lead.nome) {
    lead.nome = lead.razao_social || lead.fantasia || undefined;
  }
  
  // Se ainda não tem nome mas tem CNPJ, usa "Empresa [CNPJ]"
  if (!lead.nome && lead.cnpj) {
    lead.nome = `Empresa ${lead.cnpj}`;
  }

  return lead.nome ? lead : null;
}

/**
 * Detect if a comma-delimited line is Receita Federal / CNPJ format
 * Format: FANTASIA,TELEFONE,RAZAO_SOCIAL,CNPJ,CAPITAL,TIPO,PORTE,ATIVIDADE,STATUS,...,LOGRADOURO,NUMERO,COMPLEMENTO,CIDADE,BAIRRO,UF,CEP,...
 */
function detectReceitaFederalFormat(lines: string[]): boolean {
  // Check first few non-empty lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const fields = lines[i].split(",");
    if (fields.length < 10) return false;
    
    // Check if field 3 (index 3) looks like a CNPJ (14 digits)
    const possibleCnpj = (fields[3] || "").trim().replace(/\D/g, "");
    if (possibleCnpj.length === 14) return true;
    
    // Check if field 5 (index 5) is MATRIZ or FILIAL
    const tipoField = (fields[5] || "").trim().toUpperCase();
    if (tipoField === "MATRIZ" || tipoField === "FILIAL") return true;
  }
  return false;
}

/**
 * Parse a Receita Federal / CNPJ format line
 * The format has variable positions because some fields (like fantasia) can be empty,
 * causing shifts. We detect fields by content pattern instead of fixed position.
 * 
 * Known patterns:
 * - CNPJ: exactly 14 digits
 * - Phone: (XX) XXXX-XXXX pattern
 * - UF: exactly 2 uppercase letters
 * - TIPO: "MATRIZ" or "FILIAL"
 * - STATUS: "ATIVA", "BAIXADA", "INAPTA", "SUSPENSA"
 * - PORTE: "01", "03", "05" or "ME", "EPP", "DEMAIS"
 * - CAPITAL: numeric value (often large number)
 * - ATIVIDADE: starts with digits followed by description (CNAE format: "XXXXXXX - Descrição")
 */
function parseReceitaFederalLine(cols: string[]): Partial<StandardLead> | null {
  if (cols.length < 8) return null;
  
  let cnpj = "";
  let telefone = "";
  let atividade = "";
  let porte = "";
  let status = "";
  let capital = 0;
  let uf = "";
  let cidade = "";
  let bairro = "";
  let logradouro = "";
  let numero = "";
  let complemento = "";
  let cep = "";
  let tipo = ""; // MATRIZ/FILIAL
  let fantasia = "";
  let razaoSocial = "";
  
  // No formato da imagem/descrição:
  // FANTASIA, TELEFONE, RAZAO_SOCIAL, CNPJ, CAPITAL, TIPO, PORTE, ATIVIDADE, STATUS, ..., CIDADE, BAIRRO, UF, CEP
  // O campo fantasia frequentemente vem vazio (linha começa com ,)
  
  // CNPJ em campo 3 (index 3) - padrão forte
  const possibleCnpj = (cols[3] || "").trim().replace(/\D/g, "");
  if (possibleCnpj.length === 14) cnpj = possibleCnpj;

  // Se o campo fantasia (index 0) estiver preenchido, usamos ele
  if (cols[0] && cols[0].trim().length >= 2) {
    fantasia = cols[0].trim();
  }

  // Razão Social (index 2)
  if (cols[2] && cols[2].trim().length >= 2) {
    razaoSocial = cols[2].trim();
  }

  // Telefone (index 1)
  if (cols[1] && cols[1].trim()) {
    telefone = cols[1].trim();
  }

  // Capital (index 4)
  if (cols[4] && /^\d+$/.test(cols[4].trim())) {
    capital = parseInt(cols[4].trim(), 10);
  }

  // Tipo: MATRIZ/FILIAL (index 5)
  if (cols[5] && /MATRIZ|FILIAL/i.test(cols[5])) {
    tipo = cols[5].trim().toUpperCase();
  }

  // Porte (index 6): 01=Micro, 03=Pequena, 05=Demais
  if (cols[6]) {
    const p = cols[6].trim();
    if (p === "01") porte = "Micro";
    else if (p === "03") porte = "Pequena";
    else if (p === "05") porte = "Grande";
    else porte = p;
  }

  // Atividade (index 7): XXXXXXX - Descrição
  if (cols[7]) {
    atividade = cols[7].trim();
  }

  // Status (index 8): ATIVA, BAIXADA, INAPTA
  if (cols[8]) {
    status = cols[8].trim().toUpperCase();
  }

  // Busca reversa para endereço no final da linha: ..., CIDADE, BAIRRO, UF, CEP
  // CEP costuma ser 8 dígitos
  for (let i = cols.length - 1; i >= 8; i--) {
    const col = (cols[i] || "").trim();
    const clean = col.replace(/\D/g, "");
    if (clean.length === 8 && !cep) {
      cep = clean;
      uf = (cols[i-1] || "").trim().toUpperCase();
      bairro = (cols[i-2] || "").trim();
      cidade = (cols[i-3] || "").trim();
      break;
    }
  }

  // Se não encontrou pelo CEP, tenta pela UF (2 letras)
  if (!uf) {
    for (let i = cols.length - 1; i >= 8; i--) {
      const col = (cols[i] || "").trim();
      if (col.length === 2 && /^[A-Z]{2}$/.test(col)) {
        uf = col;
        bairro = (cols[i-1] || "").trim();
        cidade = (cols[i-2] || "").trim();
        const next = (cols[i+1] || "").trim().replace(/\D/g, "");
        if (next.length === 8) cep = next;
        break;
      }
    }
  }
  
  return {
    nome: fantasia || razaoSocial || cnpj || "Empresa Importada",
    fantasia: fantasia || undefined,
    razao_social: razaoSocial || undefined,
    cnpj: cnpj || undefined,
    telefone: telefone || undefined,
    atividade: atividade || undefined,
    porte: porte || undefined,
    status: status || undefined,
    cidade: cidade || undefined,
    uf: uf || undefined,
    cep: cep || undefined,
    capital_social: capital || undefined,
    raw: {
      tipo,
      bairro,
      original_line_length: cols.length
    }
  };
}
  // - razao_social (always present, usually longer)
  let fantasia = "";
  let razaoSocial = "";
  
  // Find the index of the CNPJ field in the original cols array
  let cnpjIdx = -1;
  if (cnpj) {
    for (let i = 0; i < cols.length; i++) {
      if ((cols[i] || "").trim().replace(/\D/g, "") === cnpj) {
        cnpjIdx = i;
        break;
      }
    }
  }
  
  if (textFields.length >= 1) {
    // Text fields before CNPJ are nome/fantasia/razao_social
    const beforeCnpj = cnpjIdx >= 0 
      ? textFields.filter(f => f.idx < cnpjIdx) 
      : textFields.slice(0, 2);
    
    if (beforeCnpj.length >= 2) {
      fantasia = beforeCnpj[0].value;
      razaoSocial = beforeCnpj[1].value;
    } else if (beforeCnpj.length === 1) {
      // Only one text field before CNPJ - it's the razao_social
      razaoSocial = beforeCnpj[0].value;
    } else {
      // No text fields before CNPJ (shouldn't happen, but fallback)
      razaoSocial = textFields[0].value;
    }
  }
  
  const nome = fantasia || razaoSocial || cnpj || "Empresa Importada";
  
  return {
    nome,
    fantasia: fantasia || undefined,
    razao_social: razaoSocial || undefined,
    telefone: telefone || undefined,
    cnpj: cnpj.length === 14 ? cnpj : undefined,
    capital_social: capital,
    porte: porte || undefined,
    atividade: atividade || undefined,
    status: status === "ATIVA" ? "Novo" : status || undefined,
    cidade: cidade || undefined,
    bairro: bairro || undefined,
    uf: uf || undefined,
    cep: cep && cep.length === 8 ? cep : undefined,
    raw: { logradouro, numero, complemento, tipo, source_format: "receita-federal" },
  };

/**
 * Map columns by position (fallback when no headers)
 */
function mapByPosition(cols: string[]): Partial<StandardLead> | null {
  if (cols.length === 0) return null;
  
  // If 10+ fields, try Receita Federal format (handles empty first field)
  if (cols.length >= 10) {
    const rfResult = parseReceitaFederalLine(cols);
    if (rfResult) return rfResult;
  }
  
  // For short lines, require first column to have content
  if (!cols[0]) return null;
  
  // Best effort positional mapping for short lines
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
