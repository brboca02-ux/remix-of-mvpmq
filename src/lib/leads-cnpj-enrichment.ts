import { getSupabase, type StandardLead, normalizeLead, Logger } from "./leads-core";

/**
 * 4. ENRIQUECIMENTO E MULTI-FONTE
 * Implementa estratégia híbrida: Local (Receita Federal) -> BrasilAPI -> ReceitaWS
 */

export async function getCnpjPublicData(cnpj: string): Promise<Partial<StandardLead> | null> {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  if (cleanCnpj.length !== 14) return null;

  const supabase = getSupabase();

  // 1. Verificar Cache/Base Local da Receita Federal
  const { data: localData } = await supabase
    .from("cnpj_base_receita")
    .select("*")
    .eq("cnpj", cleanCnpj)
    .single();

  if (localData) {
    Logger.info("CNPJ encontrado na base local (Receita Federal)", { cnpj: cleanCnpj });
    return {
      cnpj: cleanCnpj,
      nome: localData.razao_social || "",
      fantasia: localData.nome_fantasia,
      razao_social: localData.razao_social,
      cidade: localData.cidade,
      uf: localData.uf,
      cnae_principal: localData.cnae_principal,
      porte: localData.porte,
      status: localData.situacao_cadastral,
      source: "receita_federal_local"
    };
  }

  // 2. Fallback: BrasilAPI (Consulta Online)
  try {
    Logger.info("Consultando BrasilAPI...", { cnpj: cleanCnpj });
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    if (response.ok) {
      const data = await response.json();
      return {
        cnpj: cleanCnpj,
        nome: data.razao_social,
        razao_social: data.razao_social,
        fantasia: data.nome_fantasia,
        cidade: data.municipio,
        uf: data.uf,
        cnae_principal: String(data.cnae_fiscal),
        status: data.descricao_situacao_cadastral,
        socios: data.qsa || [],
        source: "brasil_api"
      };
    }
  } catch (err) {
    Logger.warn("BrasilAPI falhou ou rate limited", { cnpj: cleanCnpj });
  }

  // 3. Fallback: ReceitaWS (Limite 3/min free)
  try {
    Logger.info("Consultando ReceitaWS (fallback)...", { cnpj: cleanCnpj });
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status !== "ERROR") {
        return {
          cnpj: cleanCnpj,
          nome: data.nome,
          razao_social: data.nome,
          fantasia: data.fantasia,
          cidade: data.municipio,
          uf: data.uf,
          cnae_principal: data.atividade_principal?.[0]?.code,
          status: data.situacao,
          source: "receita_ws"
        };
      }
    }
  } catch (err) {
    Logger.error("ReceitaWS falhou", err as Error);
  }

  return null;
}

/**
 * Fluxo de processamento com validação multi-fonte e conflitos
 */
export async function processCnpjEnrichment(leadId: string, cnpj: string) {
  const supabase = getSupabase();
  const newData = await getCnpjPublicData(cnpj);
  
  if (!newData) return;

  // 1. Registrar em lead_data_sources (Rastreabilidade)
  await supabase.from("lead_data_sources").insert({
    lead_id: leadId,
    field_name: "all",
    source_name: newData.source || "external_api",
    confidence_score: newData.source === "receita_federal_local" ? 1.0 : 0.8,
    raw_response: newData as any
  });

  // 2. Verificar conflitos com dados existentes
  const { data: currentLead } = await supabase
    .from("leads_import")
    .select("*")
    .eq("id", leadId)
    .single();

  if (currentLead) {
    const fieldsToCompare: (keyof StandardLead)[] = ["razao_social", "cidade", "uf", "cnae_principal", "status"];
    const conflictsFound = [];

    for (const field of fieldsToCompare) {
      const currentValue = String(currentLead[field] || "").trim();
      const newValue = String(newData[field] || "").trim();

      // Normalização básica para comparação (case insensitive)
      if (currentValue && newValue && currentValue.toLowerCase() !== newValue.toLowerCase()) {
        conflictsFound.push({
          lead_id: leadId,
          field_name: field,
          value_a: currentValue,
          source_a: currentLead.source || "import_original",
          value_b: newValue,
          source_b: newData.source || "enrichment",
          resolved: false
        });
      }
    }

    if (conflictsFound.length > 0) {
      await supabase.from("data_conflicts").insert(conflictsFound);
      Logger.warn(`Detectados ${conflictsFound.length} conflitos para o lead ${leadId}`, { cnpj });
    }
  }

  // 3. Atualizar lead com novos dados
  // Regra: Dados da Receita Federal Local ou consenso tem prioridade.
  // Aqui apenas atualizamos, o confidence_score é calculado via trigger no DB.
  await supabase.from("leads_import").update({
    razao_social: newData.razao_social || currentLead?.razao_social,
    nome: newData.nome || currentLead?.nome,
    cidade: newData.cidade || currentLead?.cidade,
    uf: newData.uf || currentLead?.uf,
    cnae_principal: newData.cnae_principal || currentLead?.cnae_principal,
    status: newData.status || currentLead?.status,
    socios: newData.socios || currentLead?.socios || [],
    last_enriched_at: new Date().toISOString()
  }).eq("id", leadId);
}
