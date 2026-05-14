/**
 * Script para inserir leads diretamente no Supabase
 * Formato: NOME_FANTASIA,TELEFONE,RAZAO_SOCIAL,CNPJ,CAPITAL,TIPO,PORTE,ATIVIDADE,STATUS,...
 * 
 * Uso: npx tsx scripts/insert-leads-direct.ts caminho/para/arquivo.txt
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://jjhqgsaxngxrghwqgukd.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

if (!SUPABASE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ParsedLead {
  nome: string;
  telefone: string | null;
  razao_social: string | null;
  cnpj: string | null;
  capital_social: number;
  porte: string | null;
  atividade: string | null;
  status: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  bairro: string | null;
  uf: string | null;
  cep: string | null;
  identity_hash: string;
  nicho: string;
  source: string;
  confidence_score: number;
}

function parseLine(line: string): ParsedLead | null {
  // Split by comma but respect quoted fields
  const parts: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  parts.push(cur.trim());

  if (parts.length < 8) return null;

  // Content-based field detection (handles variable positions when fantasia is empty)
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
  
  const textFields: Array<{ idx: number; value: string }> = [];
  
  for (let i = 0; i < parts.length; i++) {
    const col = parts[i] || "";
    if (!col) continue;
    
    const digits = col.replace(/\D/g, "");
    
    // CNPJ: exactly 14 digits
    if (!cnpj && digits.length === 14 && /^\d{14}$/.test(digits)) {
      cnpj = digits;
      continue;
    }
    
    // Phone
    if (!telefone && /^\(?\d{2,3}\)?\s*\d{4,5}[-\s]?\d{4}$/.test(col)) {
      telefone = col;
      continue;
    }
    
    // UF: 2 uppercase letters in second half of line
    if (!uf && /^[A-Z]{2}$/.test(col) && i > parts.length / 2) {
      uf = col;
      // Format: CIDADE,BAIRRO,UF,CEP
      bairro = (parts[i - 1] || "").trim();
      cidade = (parts[i - 2] || "").trim();
      complemento = (parts[i - 3] || "").trim();
      numero = (parts[i - 4] || "").trim();
      logradouro = (parts[i - 5] || "").trim();
      const possibleCep = (parts[i + 1] || "").replace(/\D/g, "");
      if (possibleCep.length === 8) cep = possibleCep;
      continue;
    }
    
    // TIPO: MATRIZ/FILIAL - skip
    if (col === "MATRIZ" || col === "FILIAL") continue;
    
    // STATUS
    if (!status && /^(ATIVA|BAIXADA|INAPTA|SUSPENSA|NULA)$/i.test(col)) {
      status = col;
      continue;
    }
    
    // PORTE
    if (!porte && /^(0[1-9]|ME|EPP|DEMAIS)$/i.test(col)) {
      porte = col;
      continue;
    }
    
    // ATIVIDADE (CNAE format)
    if (!atividade && /^\d{5,7}\s*-\s*.+/.test(col)) {
      atividade = col;
      continue;
    }
    
    // CAPITAL (pure number, 4-12 digits)
    if (!capital && /^\d+$/.test(col) && col.length >= 4 && col.length <= 12) {
      capital = parseInt(col, 10);
      continue;
    }
    
    // Date - skip
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(col)) continue;
    
    // Text fields
    if (col.length >= 3 && !/^\d+$/.test(col)) {
      textFields.push({ idx: i, value: col });
    }
  }
  
  // Determine nome/razao_social from text fields before CNPJ
  let fantasia = "";
  let razaoSocial = "";
  
  let cnpjIdx = -1;
  if (cnpj) {
    for (let i = 0; i < parts.length; i++) {
      if ((parts[i] || "").replace(/\D/g, "") === cnpj) { cnpjIdx = i; break; }
    }
  }
  
  const beforeCnpj = cnpjIdx >= 0 
    ? textFields.filter(f => f.idx < cnpjIdx) 
    : textFields.slice(0, 2);
  
  if (beforeCnpj.length >= 2) {
    fantasia = beforeCnpj[0].value;
    razaoSocial = beforeCnpj[1].value;
  } else if (beforeCnpj.length === 1) {
    razaoSocial = beforeCnpj[0].value;
  }

  const nome = fantasia || razaoSocial || "";
  if (!nome || nome.length < 2) return null;

  // Identity hash
  let identity_hash: string;
  if (cnpj && cnpj.length === 14) {
    identity_hash = `cnpj:${cnpj}`;
  } else if (telefone && telefone.replace(/\D/g, "").length >= 10) {
    identity_hash = `tel:${telefone.replace(/\D/g, "")}`;
  } else {
    identity_hash = `name_city:${nome.toLowerCase()}|${cidade.toLowerCase()}`.replace(/[^a-z0-9|]/g, '');
  }

  return {
    nome,
    telefone: telefone || null,
    razao_social: razaoSocial || null,
    cnpj: cnpj && cnpj.length === 14 ? cnpj : null,
    capital_social: capital,
    porte: porte || null,
    atividade: atividade || null,
    status: status === "ATIVA" ? "Novo" : status || null,
    logradouro: logradouro || null,
    numero: numero || null,
    complemento: complemento || null,
    cidade: cidade || null,
    bairro: bairro || null,
    uf: uf || null,
    cep: cep && cep.length === 8 ? cep : null,
    identity_hash,
    nicho: "estetica",
    source: "csv_import_direct",
    confidence_score: 0.6,
  };
}

async function main() {
  const filePath = process.argv[2] || "e2e/fixtures/01042026.txt";
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  
  console.log(`📄 Arquivo: ${filePath}`);
  console.log(`📊 Total de linhas: ${lines.length}`);

  const leads: ParsedLead[] = [];
  const errors: Array<{ line: number; reason: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (parsed) {
      leads.push(parsed);
    } else {
      errors.push({ line: i + 1, reason: "Não foi possível extrair dados" });
    }
  }

  console.log(`✅ Leads parseados: ${leads.length}`);
  console.log(`❌ Erros: ${errors.length}`);

  if (leads.length === 0) {
    console.error("Nenhum lead para inserir.");
    process.exit(1);
  }

  // Inserir em batches de 100
  const BATCH_SIZE = 100;
  let inserted = 0;
  let duplicates = 0;
  let failed = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    
    const rows = batch.map(l => ({
      nome: l.nome,
      fantasia: l.nome !== l.razao_social ? l.nome : null,
      razao_social: l.razao_social,
      telefone: l.telefone,
      cnpj: l.cnpj,
      capital_social: l.capital_social,
      porte: l.porte,
      atividade: l.atividade,
      status: l.status,
      cidade: l.cidade,
      bairro: l.bairro,
      uf: l.uf,
      cep: l.cep,
      nicho: l.nicho,
      source: l.source,
      confidence_score: l.confidence_score,
      identity_hash: l.identity_hash,
    }));

    const { data, error } = await supabase
      .from('leads_import')
      .upsert(rows, { onConflict: 'identity_hash', ignoreDuplicates: false })
      .select('id, created_at');

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} falhou:`, error.message);
      failed += batch.length;
    } else {
      const newCount = (data || []).filter(r => {
        const created = new Date(r.created_at).getTime();
        return created > Date.now() - 10000; // Criado nos últimos 10s = novo
      }).length;
      inserted += newCount;
      duplicates += batch.length - newCount;
    }

    const progress = Math.round(((i + batch.length) / leads.length) * 100);
    process.stdout.write(`\r⏳ Progresso: ${progress}% (${i + batch.length}/${leads.length})`);
  }

  console.log(`\n\n🎉 RESULTADO:`);
  console.log(`   ✅ Inseridos: ${inserted}`);
  console.log(`   🔄 Atualizados/Duplicados: ${duplicates}`);
  console.log(`   ❌ Falhas: ${failed}`);
  console.log(`   📊 Total processado: ${leads.length}`);
}

main().catch(console.error);
