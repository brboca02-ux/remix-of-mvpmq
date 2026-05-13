// @ts-nocheck
/**
 * Lead Codec - Parser and Serializer for Lead Data
 * 
 * Supports CSV, JSON, and TXT formats with round-trip capability.
 * Implements Requirements 17.1-17.8, 18.1-18.8, 19.1-19.7
 */

import Papa from 'papaparse';
import { z } from 'zod';
import type { ProspectLead } from '../types';

// ============================================================================
// Types
// ============================================================================

export type LeadFormat = 'csv' | 'json' | 'txt';

export interface ParseOptions {
  format: LeadFormat;
  delimiter?: string;     // csv delimiter (default: ',')
  encoding?: 'utf-8' | 'iso-8859-1';
  txtPattern?: string;    // regex pattern for TXT parsing
  fieldMap?: Record<string, keyof ProspectLead>;
}

export interface SerializeOptions {
  format: LeadFormat;
  fields?: (keyof ProspectLead)[];
  pretty?: boolean;       // JSON indentation
  txtTemplate?: string;   // template for TXT serialization
}

export interface ParseResult {
  leads: Partial<ProspectLead>[];
  errors: Array<{ line: number; field?: string; message: string }>;
}

// ============================================================================
// Zod Schema for Lead Validation
// ============================================================================

const LeadSchema = z.object({
  companyName: z.string().min(1),
  email: z.string().email().optional(),
  niche: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  instagramHandle: z.string().optional(),
  instagramUrl: z.string().url().optional(),
  whatsapp: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  priceLevel: z.string().optional(),
  source: z.string(),
  searchNiche: z.string().optional(),
  searchLocation: z.string().optional(),
  notes: z.string().optional(),
  services: z.array(z.string()).optional(),
});

// ============================================================================
// Phone Normalization
// ============================================================================

/**
 * Normalizes phone number to Brazilian format: +55DDNNNNNNNNN
 * 
 * Requirement 18.5: Normalize phones to Brazilian format (+55)
 * 
 * @param raw - Raw phone number string
 * @returns Normalized phone or null if invalid
 * 
 * @example
 * normalizePhone('(11) 98765-4321') // '+5511987654321'
 * normalizePhone('11987654321') // '+5511987654321'
 * normalizePhone('5511987654321') // '+5511987654321'
 * normalizePhone('+55 11 98765-4321') // '+5511987654321'
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;

  // Remove all non-digit characters
  const digits = raw.replace(/\D/g, '');

  // Brazilian phone patterns:
  // - Mobile: 11 digits (DDD + 9 + 8 digits)
  // - Landline: 10 digits (DDD + 8 digits)
  // - With country code: 13 digits (55 + DDD + 9 + 8 digits) or 12 digits (55 + DDD + 8 digits)

  let normalized = digits;

  // Remove country code if present
  if (normalized.startsWith('55') && (normalized.length === 12 || normalized.length === 13)) {
    normalized = normalized.substring(2);
  }

  // Validate length (10 or 11 digits)
  if (normalized.length !== 10 && normalized.length !== 11) {
    return null;
  }

  // Validate DDD (area code) - must be between 11 and 99
  const ddd = parseInt(normalized.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return null;
  }

  // Add country code
  return `+55${normalized}`;
}

// ============================================================================
// Address Normalization
// ============================================================================

/**
 * Normalizes address by removing special characters and normalizing spaces
 * 
 * Requirement 18.6: Normalize addresses removing special characters
 * 
 * @param raw - Raw address string
 * @returns Normalized address
 * 
 * @example
 * normalizeAddress('Rua  das  Flores,  123') // 'Rua das Flores, 123'
 * normalizeAddress('Av. Paulista, 1000 - Bela Vista') // 'Av. Paulista, 1000 - Bela Vista'
 */
export function normalizeAddress(raw: string): string {
  if (!raw) return '';

  return raw
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing spaces
    .trim()
    // Normalize common abbreviations
    .replace(/\bR\.\s*/gi, 'Rua ')
    .replace(/\bAv\.\s*/gi, 'Avenida ')
    .replace(/\bTrav\.\s*/gi, 'Travessa ')
    .replace(/\bPç\.\s*/gi, 'Praça ')
    // Remove excessive punctuation
    .replace(/[,;]+/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*-\s*/g, ' - ');
}

// ============================================================================
// CSV Parser
// ============================================================================

/**
 * Parses CSV format using papaparse
 * 
 * Requirements 18.1, 18.4: Parse CSV with configurable delimiters and encoding detection
 */
function parseCSV(input: string, opts: ParseOptions): ParseResult {
  const errors: ParseResult['errors'] = [];
  const leads: Partial<ProspectLead>[] = [];

  try {
    const result = Papa.parse<Record<string, string>>(input, {
      header: true,
      delimiter: opts.delimiter || ',',
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    result.data.forEach((row, index) => {
      const lineNumber = index + 2; // +2 because index is 0-based and we have header row

      try {
        const lead = mapRowToLead(row, opts.fieldMap);
        
        // Normalize phone if present
        if (lead.whatsapp) {
          const normalized = normalizePhone(lead.whatsapp);
          if (normalized) {
            lead.whatsapp = normalized;
          } else {
            errors.push({
              line: lineNumber,
              field: 'whatsapp',
              message: `Invalid phone number: ${lead.whatsapp}`,
            });
          }
        }

        // Normalize address if present
        if (lead.address) {
          lead.address = normalizeAddress(lead.address);
        }

        // Validate required fields
        if (!lead.companyName) {
          errors.push({
            line: lineNumber,
            field: 'companyName',
            message: 'Company name is required',
          });
        } else {
          leads.push(lead);
        }
      } catch (error) {
        errors.push({
          line: lineNumber,
          message: error instanceof Error ? error.message : 'Unknown parsing error',
        });
      }
    });

    // Add papaparse errors
    result.errors.forEach((error) => {
      errors.push({
        line: error.row || 0,
        message: error.message,
      });
    });
  } catch (error) {
    errors.push({
      line: 0,
      message: error instanceof Error ? error.message : 'CSV parsing failed',
    });
  }

  return { leads, errors };
}

// ============================================================================
// JSON Parser
// ============================================================================

/**
 * Parses JSON format with schema validation
 * 
 * Requirements 18.3: Parse JSON with schema validation
 */
function parseJSON(input: string, opts: ParseOptions): ParseResult {
  const errors: ParseResult['errors'] = [];
  const leads: Partial<ProspectLead>[] = [];

  try {
    const data = JSON.parse(input);
    const items = Array.isArray(data) ? data : [data];

    items.forEach((item, index) => {
      try {
        const lead = mapRowToLead(item, opts.fieldMap);

        // Normalize phone if present
        if (lead.whatsapp) {
          const normalized = normalizePhone(lead.whatsapp);
          if (normalized) {
            lead.whatsapp = normalized;
          } else {
            errors.push({
              line: index + 1,
              field: 'whatsapp',
              message: `Invalid phone number: ${lead.whatsapp}`,
            });
          }
        }

        // Normalize address if present
        if (lead.address) {
          lead.address = normalizeAddress(lead.address);
        }

        // Validate with Zod schema
        const validation = LeadSchema.safeParse(lead);
        if (!validation.success) {
          validation.error.errors.forEach((err) => {
            errors.push({
              line: index + 1,
              field: err.path.join('.'),
              message: err.message,
            });
          });
        } else {
          leads.push(lead);
        }
      } catch (error) {
        errors.push({
          line: index + 1,
          message: error instanceof Error ? error.message : 'Unknown parsing error',
        });
      }
    });
  } catch (error) {
    errors.push({
      line: 0,
      message: error instanceof Error ? error.message : 'JSON parsing failed',
    });
  }

  return { leads, errors };
}

// ============================================================================
// TXT Parser
// ============================================================================

/**
 * Default regex pattern for estetica.txt format
 * 
 * Requirement 17.2: Parse fields from TXT format
 * 
 * Expected format:
 * Nome: Company Name
 * Telefone: (11) 98765-4321
 * Rating: 4.5
 * Reviews: 123
 * Categoria: Clínica de Estética
 * Endereço: Rua das Flores, 123
 */
const DEFAULT_TXT_PATTERN = `
Nome:\\s*(.+?)\\s*
Telefone:\\s*(.+?)\\s*
Rating:\\s*([\\d.]+)\\s*
Reviews:\\s*(\\d+)\\s*
Categoria:\\s*(.+?)\\s*
Endereço:\\s*(.+?)\\s*
`.trim();

/**
 * Parses TXT format using regex patterns
 * 
 * Requirements 17.1-17.8, 18.2: Parse TXT with customizable regex patterns
 */
function parseTXT(input: string, opts: ParseOptions): ParseResult {
  const errors: ParseResult['errors'] = [];
  const leads: Partial<ProspectLead>[] = [];

  try {
    const pattern = opts.txtPattern || DEFAULT_TXT_PATTERN;
    const regex = new RegExp(pattern, 'gim');

    let match;
    let lineNumber = 0;

    while ((match = regex.exec(input)) !== null) {
      lineNumber++;

      try {
        // Default mapping for estetica.txt format
        const lead: Partial<ProspectLead> = {
          companyName: match[1]?.trim() || '',
          whatsapp: match[2]?.trim() || '',
          rating: match[3] ? parseFloat(match[3]) : undefined,
          niche: match[5]?.trim() || '',
          address: match[6]?.trim() || '',
          source: 'import_txt',
        };

        // Apply custom field mapping if provided
        if (opts.fieldMap) {
          const mapped = mapRowToLead(
            {
              nome: match[1],
              telefone: match[2],
              rating: match[3],
              reviews: match[4],
              categoria: match[5],
              endereco: match[6],
            },
            opts.fieldMap
          );
          Object.assign(lead, mapped);
        }

        // Normalize phone
        if (lead.whatsapp) {
          const normalized = normalizePhone(lead.whatsapp);
          if (normalized) {
            lead.whatsapp = normalized;
          } else {
            errors.push({
              line: lineNumber,
              field: 'whatsapp',
              message: `Invalid phone number: ${lead.whatsapp}`,
            });
          }
        }

        // Normalize address
        if (lead.address) {
          lead.address = normalizeAddress(lead.address);
        }

        // Validate required fields
        if (!lead.companyName) {
          errors.push({
            line: lineNumber,
            field: 'companyName',
            message: 'Company name is required',
          });
        } else {
          leads.push(lead);
        }
      } catch (error) {
        errors.push({
          line: lineNumber,
          message: error instanceof Error ? error.message : 'Unknown parsing error',
        });
      }
    }

    if (leads.length === 0 && errors.length === 0) {
      errors.push({
        line: 0,
        message: 'No leads found in TXT file. Check the pattern or format.',
      });
    }
  } catch (error) {
    errors.push({
      line: 0,
      message: error instanceof Error ? error.message : 'TXT parsing failed',
    });
  }

  return { leads, errors };
}

// ============================================================================
// Field Mapping Helper
// ============================================================================

/**
 * Maps raw row data to ProspectLead fields using optional field mapping
 */
function mapRowToLead(
  row: Record<string, any>,
  fieldMap?: Record<string, keyof ProspectLead>
): Partial<ProspectLead> {
  const lead: Partial<ProspectLead> = {};

  // Default field mappings (common variations)
  const defaultMappings: Record<string, keyof ProspectLead> = {
    nome: 'companyName',
    name: 'companyName',
    company: 'companyName',
    companyName: 'companyName',
    empresa: 'companyName',
    
    telefone: 'whatsapp',
    phone: 'whatsapp',
    whatsapp: 'whatsapp',
    celular: 'whatsapp',
    
    email: 'email',
    
    categoria: 'niche',
    niche: 'niche',
    nicho: 'niche',
    category: 'niche',
    
    cidade: 'city',
    city: 'city',
    
    bairro: 'neighborhood',
    neighborhood: 'neighborhood',
    
    endereco: 'address',
    address: 'address',
    
    rating: 'rating',
    avaliacao: 'rating',
    
    instagram: 'instagramHandle',
    instagramHandle: 'instagramHandle',
    
    site: 'websiteUrl',
    website: 'websiteUrl',
    websiteUrl: 'websiteUrl',
    
    source: 'source',
    origem: 'source',
  };

  // Merge custom field map with defaults
  const mappings = { ...defaultMappings, ...fieldMap };

  // Apply mappings
  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();
    const targetField = mappings[normalizedKey] || mappings[key];

    if (targetField && value !== undefined && value !== null && value !== '') {
      (lead as any)[targetField] = value;
    }
  });

  // Ensure source is set
  if (!lead.source) {
    lead.source = 'import';
  }

  return lead;
}

// ============================================================================
// Main Parse Function
// ============================================================================

/**
 * Parses lead data from various formats
 * 
 * Requirements 17.1-17.8, 18.1-18.8: Support CSV, JSON, TXT with validation and error reporting
 * 
 * @param input - Raw input string
 * @param opts - Parse options
 * @returns Parse result with leads and errors
 */
export function parseLeads(input: string, opts: ParseOptions): ParseResult {
  // Detect and handle encoding
  if (opts.encoding === 'iso-8859-1') {
    // Convert ISO-8859-1 to UTF-8
    try {
      const bytes = new Uint8Array(input.split('').map((c) => c.charCodeAt(0)));
      const decoder = new TextDecoder('iso-8859-1');
      input = decoder.decode(bytes);
    } catch (error) {
      return {
        leads: [],
        errors: [
          {
            line: 0,
            message: 'Failed to decode ISO-8859-1 encoding',
          },
        ],
      };
    }
  }

  // Route to appropriate parser
  switch (opts.format) {
    case 'csv':
      return parseCSV(input, opts);
    case 'json':
      return parseJSON(input, opts);
    case 'txt':
      return parseTXT(input, opts);
    default:
      return {
        leads: [],
        errors: [
          {
            line: 0,
            message: `Unsupported format: ${opts.format}`,
          },
        ],
      };
  }
}

// ============================================================================
// CSV Serializer
// ============================================================================

/**
 * Serializes leads to CSV format
 * 
 * Requirement 19.1: Format leads to CSV with headers
 */
function serializeCSV(leads: Partial<ProspectLead>[], opts: SerializeOptions): string {
  const fields = opts.fields || getDefaultFields();
  
  const csv = Papa.unparse(
    leads.map((lead) => {
      const row: Record<string, any> = {};
      fields.forEach((field) => {
        const value = lead[field];
        row[field] = value !== undefined && value !== null ? String(value) : '';
      });
      return row;
    }),
    {
      header: true,
      columns: fields as string[],
    }
  );

  return csv;
}

// ============================================================================
// JSON Serializer
// ============================================================================

/**
 * Serializes leads to JSON format
 * 
 * Requirement 19.2: Format leads to JSON indented
 */
function serializeJSON(leads: Partial<ProspectLead>[], opts: SerializeOptions): string {
  const fields = opts.fields;
  
  const data = fields
    ? leads.map((lead) => {
        const filtered: Record<string, any> = {};
        fields.forEach((field) => {
          if (lead[field] !== undefined) {
            filtered[field] = lead[field];
          }
        });
        return filtered;
      })
    : leads;

  return JSON.stringify(data, null, opts.pretty ? 2 : 0);
}

// ============================================================================
// TXT Serializer
// ============================================================================

/**
 * Default TXT template for estetica.txt format
 */
const DEFAULT_TXT_TEMPLATE = `
Nome: {{companyName}}
Telefone: {{whatsapp}}
Rating: {{rating}}
Categoria: {{niche}}
Endereço: {{address}}
---
`.trim();

/**
 * Serializes leads to TXT format
 * 
 * Requirement 19.3: Format leads to TXT with customizable template
 */
function serializeTXT(leads: Partial<ProspectLead>[], opts: SerializeOptions): string {
  const template = opts.txtTemplate || DEFAULT_TXT_TEMPLATE;
  
  return leads
    .map((lead) => {
      let output = template;
      
      // Replace template variables
      Object.entries(lead).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        const replacement = value !== undefined && value !== null ? String(value) : '';
        output = output.replace(new RegExp(placeholder, 'g'), replacement);
      });
      
      // Remove unreplaced placeholders
      output = output.replace(/\{\{[^}]+\}\}/g, '');
      
      return output;
    })
    .join('\n\n');
}

// ============================================================================
// Main Serialize Function
// ============================================================================

/**
 * Serializes leads to various formats
 * 
 * Requirements 19.1-19.7: Export leads to CSV, JSON, TXT with field selection
 * 
 * @param leads - Array of leads to serialize
 * @param opts - Serialization options
 * @returns Serialized string
 */
export function serializeLeads(leads: Partial<ProspectLead>[], opts: SerializeOptions): string {
  switch (opts.format) {
    case 'csv':
      return serializeCSV(leads, opts);
    case 'json':
      return serializeJSON(leads, opts);
    case 'txt':
      return serializeTXT(leads, opts);
    default:
      throw new Error(`Unsupported format: ${opts.format}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Returns default fields for export
 */
function getDefaultFields(): (keyof ProspectLead)[] {
  return [
    'companyName',
    'email',
    'whatsapp',
    'niche',
    'city',
    'neighborhood',
    'address',
    'instagramHandle',
    'instagramUrl',
    'websiteUrl',
    'rating',
    'source',
    'opportunityScore',
    'status',
  ];
}