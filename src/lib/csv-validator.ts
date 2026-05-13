/**
 * Validador robusto de CSV: encoding, delimiter e cabeçalho.
 * Retorna mensagens claras e acionáveis para o usuário.
 */

export type CsvValidationResult =
  | {
      valid: true;
      delimiter: "," | ";" | "\t";
      delimiterLabel: string;
      encoding: "UTF-8" | "UTF-8 (BOM)" | "Latin-1 (provável)";
      headers: string[];
      mappedHeaders: string[];
      unmappedHeaders: string[];
      rowCount: number;
      previewRows: string[][];
      warnings: string[];
    }
  | {
      valid: false;
      code:
        | "EMPTY_FILE"
        | "BINARY_OR_INVALID_ENCODING"
        | "NO_DELIMITER"
        | "INCONSISTENT_COLUMNS"
        | "MISSING_REQUIRED_HEADER"
        | "ONLY_HEADER"
        | "PARSE_ERROR";
      message: string;
      hint?: string;
    };

const REQUIRED_HEADER_ALIASES: Record<string, string[]> = {
  nome: ["nome", "name", "razao_social", "razao social", "fantasia", "empresa", "razão social"],
  contato: ["telefone", "phone", "tel", "numero", "número", "whatsapp", "celular", "email", "e-mail", "cnpj", "linkedin", "cargo", "role"],
};

function removeAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type EncodingLabel = "UTF-8" | "UTF-8 (BOM)" | "Latin-1 (provável)";

function detectEncoding(raw: ArrayBuffer): EncodingLabel {
  const bytes = new Uint8Array(raw);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "UTF-8 (BOM)";
  }
  let suspicious = 0;
  for (let i = 0; i < Math.min(bytes.length, 4096); i++) {
    const b = bytes[i];
    if (b >= 0x80 && b <= 0xbf) {
      if (i === 0 || (bytes[i - 1] < 0xc0 && bytes[i - 1] >= 0x80)) suspicious++;
    } else if (b >= 0xc0 && b <= 0xff) {
      const next = bytes[i + 1];
      if (!next || next < 0x80 || next > 0xbf) suspicious++;
    }
  }
  if (suspicious > 5) return "Latin-1 (provável)";
  return "UTF-8";
}


async function decodeFile(file: File): Promise<{ text: string; encoding: EncodingLabel }> {
  const buf = await file.arrayBuffer();
  const encoding = detectEncoding(buf);
  let text: string;
  try {
    if (encoding === "Latin-1 (provável)") {
      text = new TextDecoder("iso-8859-1").decode(buf);
    } else {
      text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    }
  } catch {
    text = new TextDecoder("iso-8859-1").decode(buf);
  }
  // Remove BOM se existir
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return { text, encoding };
}

function detectDelimiter(firstLine: string): "," | ";" | "\t" | null {
  const counts = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  const max = Math.max(counts[","], counts[";"], counts["\t"]);
  if (max === 0) return null;
  if (counts[";"] === max) return ";";
  if (counts["\t"] === max) return "\t";
  return ",";
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.map((c) => c.replace(/^"|"$/g, ""));
}

function isLikelyBinary(text: string): boolean {
  // Procura por bytes nulos ou caracteres de controle excessivos nos primeiros 2KB
  const sample = text.slice(0, 2048);
  let controlChars = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0) return true;
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) controlChars++;
  }
  return controlChars > sample.length * 0.05;
}

function validateHeaders(headers: string[]): {
  valid: boolean;
  mapped: string[];
  unmapped: string[];
  missingRequired: string[];
} {
  const normalized = headers.map((h) => removeAccents(h.toLowerCase().trim()));
  const mapped: string[] = [];
  const unmapped: string[] = [];

  headers.forEach((original, idx) => {
    const norm = normalized[idx];
    let matched = false;
    for (const aliases of Object.values(REQUIRED_HEADER_ALIASES)) {
      if (aliases.some((a) => norm.includes(a))) {
        matched = true;
        break;
      }
    }
    // Também aceita campos comuns
    const commonFields = ["cidade", "uf", "estado", "bairro", "cep", "site", "porte", "status", "atividade", "categoria", "tipo", "endereco", "address"];
    if (!matched && commonFields.some((c) => norm.includes(c))) matched = true;

    if (matched) mapped.push(original);
    else unmapped.push(original);
  });

  const missingRequired: string[] = [];
  for (const [key, aliases] of Object.entries(REQUIRED_HEADER_ALIASES)) {
    const found = normalized.some((n) => aliases.some((a) => n.includes(a)));
    if (!found) missingRequired.push(key);
  }

  // "nome" é obrigatório; "contato" é desejável mas não bloqueante
  const valid = !missingRequired.includes("nome");
  return { valid, mapped, unmapped, missingRequired };
}

export async function validateCsvFile(file: File): Promise<CsvValidationResult> {
  try {
    const { text, encoding } = await decodeFile(file);

    if (!text || !text.trim()) {
      return {
        valid: false,
        code: "EMPTY_FILE",
        message: "O arquivo está vazio.",
        hint: "Verifique se o CSV contém pelo menos uma linha de cabeçalho e uma linha de dados.",
      };
    }

    if (isLikelyBinary(text)) {
      return {
        valid: false,
        code: "BINARY_OR_INVALID_ENCODING",
        message: "O arquivo parece estar corrompido ou em formato binário (não é um CSV de texto).",
        hint: "Salve sua planilha como 'CSV UTF-8 (delimitado por vírgulas)' no Excel ou Google Sheets e tente novamente.",
      };
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      return { valid: false, code: "EMPTY_FILE", message: "Nenhuma linha válida encontrada no arquivo." };
    }

    if (lines.length === 1) {
      return {
        valid: false,
        code: "ONLY_HEADER",
        message: "O arquivo contém apenas o cabeçalho, sem linhas de dados.",
        hint: "Adicione pelo menos uma linha de dados abaixo do cabeçalho.",
      };
    }

    // ============================================================================
    // SMART DETECTION: Google Maps format (no headers, commas in data)
    // ============================================================================
    const firstLine = lines[0];
    
    // Check multiple lines for Google Maps pattern (first line might be atypical)
    const sampleLines = lines.slice(0, Math.min(5, lines.length));
    const hasPhonePattern = sampleLines.some(l => /\(\d{2,3}\)\s*[\d\s-]+/.test(l));
    const hasRatingPattern = sampleLines.some(l => /\d,\d\s*\(\d+\)/.test(l));
    const hasEmptyFieldPattern = sampleLines.some(l => /,,/.test(l));
    const hasAddressPattern = sampleLines.some(l => /\b(rua|r\.|av\.|avenida|tv\.)\b/i.test(l));
    
    // Google Maps format: has phone patterns AND (rating with comma OR empty fields + address)
    const isGoogleMapsFormat = hasPhonePattern && (hasRatingPattern || (hasEmptyFieldPattern && hasAddressPattern));
    
    // Also check: first line doesn't look like a header
    const firstLineLooksLikeHeader = /^(nome|name|empresa|razao|telefone|phone|email)/i.test(firstLine.trim());
    const isNoHeaderFormat = isGoogleMapsFormat && !firstLineLooksLikeHeader;

    if (isNoHeaderFormat) {
      // Google Maps format - no headers needed, first row is data
      const warnings: string[] = [
        "Formato Google Maps detectado - arquivo sem cabeçalhos. Usando parser inteligente.",
        "Campos identificados automaticamente por posição: Nome, Telefone, Rating, Categoria, Endereço.",
      ];

      const previewRows = lines.slice(0, 3).map((l) => [l]);

      return {
        valid: true,
        delimiter: ",",
        delimiterLabel: "vírgula (,) - formato Google Maps",
        encoding,
        headers: ["Nome", "Telefone", "Rating", "Categoria", "Endereço"],
        mappedHeaders: ["Nome", "Telefone", "Rating", "Categoria", "Endereço"],
        unmappedHeaders: [],
        rowCount: lines.length,
        previewRows,
        warnings,
      };
    }

    const delimiter = detectDelimiter(lines[0]);
    if (!delimiter) {
      return {
        valid: false,
        code: "NO_DELIMITER",
        message: "Não foi possível identificar o delimitador do arquivo (vírgula, ponto e vírgula ou tabulação).",
        hint: "Confirme que o arquivo possui colunas separadas por ',' ';' ou tab. Evite arquivos de texto livre.",
      };
    }

    const delimiterLabel = delimiter === "," ? "vírgula (,)" : delimiter === ";" ? "ponto e vírgula (;)" : "tabulação (\\t)";

    const headers = splitCsvLine(lines[0], delimiter).filter((h) => h.length > 0);
    if (headers.length < 2) {
      return {
        valid: false,
        code: "NO_DELIMITER",
        message: `Apenas ${headers.length} coluna detectada com o delimitador '${delimiterLabel}'.`,
        hint: "Verifique se o arquivo realmente tem múltiplas colunas separadas.",
      };
    }

    const headerCheck = validateHeaders(headers);
    if (!headerCheck.valid) {
      // Before failing, check if this looks like data (not headers)
      const firstLineLooksLikeData = sampleLines.some(l => 
        /\(\d/.test(l) || /\d,\d/.test(l) || /,,/.test(l) || 
        /\b(rua|r\.|av\.|avenida|tv\.)\b/i.test(l)
      );
      
      if (firstLineLooksLikeData) {
        // Treat as no-header CSV
        const warnings: string[] = [
          "CSV sem cabeçalhos detectado. Usando parser automático por posição.",
        ];

        const previewRows = lines.slice(0, 3).map((l) => splitCsvLine(l, delimiter));

        return {
          valid: true,
          delimiter,
          delimiterLabel,
          encoding,
          headers: headers.map((_, i) => `Campo ${i + 1}`),
          mappedHeaders: headers.map((_, i) => `Campo ${i + 1}`),
          unmappedHeaders: [],
          rowCount: lines.length,
          previewRows,
          warnings,
        };
      }
      
      return {
        valid: false,
        code: "MISSING_REQUIRED_HEADER",
        message: `O CSV não contém uma coluna de identificação reconhecida (Nome, Razão Social, Empresa).`,
        hint: `Cabeçalhos detectados: ${headers.slice(0, 6).join(", ")}${headers.length > 6 ? "…" : ""}. Renomeie uma coluna para "Nome" ou "Empresa".`,
      };
    }

    // Validar consistência de colunas nas primeiras linhas
    const warnings: string[] = [];
    const sampleSize = Math.min(10, lines.length - 1);
    let inconsistentCount = 0;
    for (let i = 1; i <= sampleSize; i++) {
      const cols = splitCsvLine(lines[i], delimiter);
      if (Math.abs(cols.length - headers.length) > 1) inconsistentCount++;
    }
    if (inconsistentCount > sampleSize * 0.5) {
      // Instead of failing, warn and proceed - smart parser can handle
      warnings.push(
        `${inconsistentCount} de ${sampleSize} linhas têm número de colunas diferente. Parser inteligente será usado.`
      );
    } else if (inconsistentCount > 0) {
      warnings.push(`${inconsistentCount} de ${sampleSize} linhas amostradas têm número de colunas diferente do cabeçalho.`);
    }

    if (encoding === "Latin-1 (provável)") {
      warnings.push("Encoding Latin-1 detectado e convertido. Para melhor compatibilidade, salve o arquivo em UTF-8.");
    }

    if (headerCheck.missingRequired.includes("contato")) {
      warnings.push("Nenhuma coluna de contato (telefone, e-mail, CNPJ) foi detectada. Os leads serão importados apenas com nome.");
    }

    if (headerCheck.unmapped.length > 0) {
      warnings.push(`${headerCheck.unmapped.length} coluna(s) não mapeada(s) serão preservadas como dados extras: ${headerCheck.unmapped.slice(0, 3).join(", ")}${headerCheck.unmapped.length > 3 ? "…" : ""}.`);
    }

    const previewRows = lines.slice(1, 4).map((l) => splitCsvLine(l, delimiter));

    return {
      valid: true,
      delimiter,
      delimiterLabel,
      encoding,
      headers,
      mappedHeaders: headerCheck.mapped,
      unmappedHeaders: headerCheck.unmapped,
      rowCount: lines.length - 1,
      previewRows,
      warnings,
    };
  } catch (e: unknown) {
    return {
      valid: false,
      code: "PARSE_ERROR",
      message: "Não foi possível ler o arquivo CSV.",
      hint: e instanceof Error ? e.message : "Verifique o formato e tente novamente.",
    };
  }
}
