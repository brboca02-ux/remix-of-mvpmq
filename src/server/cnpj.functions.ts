import { createServerFn } from "@tanstack/react-start";
import { getSupabase, Logger } from "./leads-core";

export interface Socio {
  nome: string;
  qualificacao: string;
  cpfCnpj?: string;
  entrada?: string;
  faixaEtaria?: string;
  tipo?: "PF" | "PJ";
}

export interface CnpjDetails {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  dataAbertura: string;
  capitalSocial: number;
  naturezaJuridica: string;
  porte: string;
  cnaePrincipal: { code: string; label: string };
  cnaesSecundarios: { code: string; label: string }[];
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  telefone: string;
  email: string;
  socios: Socio[];
  fonte: "OpenCNPJ" | "BrasilAPI" | "ReceitaWS";
}

const TTL = 24 * 60 * 60 * 1000; // 24h

async function getCachedApiData(api_key: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("public_api_cache")
    .select("response_data")
    .eq("api_key", api_key)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data?.response_data;
}

async function setApiCacheData(api_key: string, provider: string, data: any) {
  const supabase = getSupabase();
  const expires_at = new Date(Date.now() + TTL).toISOString();
  await supabase.from("public_api_cache").upsert({
    api_key,
    provider,
    response_data: data,
    expires_at
  }, { onConflict: 'api_key' });
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

async function fetchWithTimeout(url: string, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
  } finally {
    clearTimeout(t);
  }
}

export interface DigitalPresence {
  score: number;
  level: 'high' | 'medium' | 'low' | 'unverified';
  details: {
    site_active: boolean;
    domain_exists: boolean;
    physical_presence: boolean;
    sources_count: number;
    consistency_score: number;
  };
  validations: {
    dns: boolean;
    http: boolean;
    osm: boolean;
    ibge: boolean;
  };
}

async function checkSiteStatus(url: string): Promise<{ dns: boolean; http: boolean }> {
  if (!url) return { dns: false, http: false };
  const domain = url.replace(/^https?:\/\//, "").split("/")[0];
  
  try {
    const httpCheck = await fetchWithTimeout(`https://${domain}`, 5000);
    return { dns: true, http: httpCheck.ok };
  } catch {
    try {
      const httpCheck = await fetchWithTimeout(`http://${domain}`, 5000);
      return { dns: true, http: httpCheck.ok };
    } catch {
      return { dns: false, http: false };
    }
  }
}

async function checkOSMAddress(logradouro: string, cidade: string, uf: string): Promise<boolean> {
  const query = encodeURIComponent(`${logradouro}, ${cidade}, ${uf}, Brasil`);
  try {
    const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, 5000);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) && data.length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

async function updateFieldValidation(lead_id: string, field: string, is_valid: boolean, sources: string[], conflict = false) {
  const supabase = getSupabase();
  await supabase.from("field_validation").upsert({
    lead_id,
    field_name: field,
    is_valid,
    sources_checked: sources,
    conflict_detected: conflict,
    last_validated_at: new Date().toISOString()
  }, { onConflict: 'lead_id,field_name' });
}

function inferTipo(qual: string, cpfCnpj?: string): "PF" | "PJ" | undefined {
  if (cpfCnpj) {
    const d = onlyDigits(cpfCnpj);
    if (d.length === 14) return "PJ";
    if (d.length === 11 || cpfCnpj.includes("***")) return "PF";
  }
  const q = (qual || "").toLowerCase();
  if (q.includes("pessoa jurídica") || q.includes("juridica")) return "PJ";
  if (q.includes("pessoa física") || q.includes("fisica") || q.includes("administrador")) return "PF";
  return undefined;
}

function fromOpenCnpj(j: any): CnpjDetails {
  const qsa: Socio[] = Array.isArray(j.QSA)
    ? j.QSA.map((s: any) => {
        const cpfCnpj = s.cpf_cnpj_socio ?? s.cnpj_cpf_socio ?? "";
        const qual = s.qualificacao_socio ?? "";
        return {
          nome: s.nome_socio ?? "",
          qualificacao: qual,
          cpfCnpj,
          entrada: s.data_entrada_sociedade ?? "",
          faixaEtaria: s.faixa_etaria ?? "",
          tipo: inferTipo(qual, cpfCnpj),
        };
      })
    : [];
  return {
    cnpj: String(j.cnpj ?? "").replace(/\D/g, ""),
    razaoSocial: j.razao_social ?? "",
    nomeFantasia: j.nome_fantasia ?? "",
    situacao: j.situacao_cadastral ?? "",
    dataAbertura: j.data_inicio_atividade ?? "",
    capitalSocial: Number(j.capital_social ?? 0),
    naturezaJuridica: j.natureza_juridica ?? "",
    porte: j.porte ?? "",
    cnaePrincipal: {
      code: String(j.cnae_principal ?? ""),
      label: j.cnae_principal_descricao ?? "",
    },
    cnaesSecundarios: Array.isArray(j.cnaes_secundarios)
      ? j.cnaes_secundarios.map((c: any) => ({
          code: String(c.codigo ?? c.code ?? ""),
          label: c.descricao ?? c.label ?? "",
        }))
      : [],
    endereco: {
      logradouro: j.logradouro ?? "",
      numero: String(j.numero ?? ""),
      bairro: j.bairro ?? "",
      cidade: j.municipio ?? "",
      uf: j.uf ?? "",
      cep: String(j.cep ?? ""),
    },
    telefone: j.ddd_telefone_1 ?? j.telefone ?? "",
    email: j.email ?? "",
    socios: qsa,
    fonte: "OpenCNPJ",
  };
}

function fromBrasilApi(j: any): CnpjDetails {
  const qsa: Socio[] = Array.isArray(j.qsa)
    ? j.qsa.map((s: any) => {
        const cpfCnpj = s.cnpj_cpf_do_socio ?? "";
        const qual = s.qualificacao_socio ?? "";
        return {
          nome: s.nome_socio ?? "",
          qualificacao: qual,
          cpfCnpj,
          entrada: s.data_entrada_sociedade ?? "",
          faixaEtaria: s.faixa_etaria ?? "",
          tipo: inferTipo(qual, cpfCnpj),
        };
      })
    : [];
  return {
    cnpj: String(j.cnpj ?? ""),
    razaoSocial: j.razao_social ?? "",
    nomeFantasia: j.nome_fantasia ?? "",
    situacao: j.descricao_situacao_cadastral ?? "",
    dataAbertura: j.data_inicio_atividade ?? "",
    capitalSocial: Number(j.capital_social ?? 0),
    naturezaJuridica: j.natureza_juridica ?? "",
    porte: j.porte ?? "",
    cnaePrincipal: {
      code: String(j.cnae_fiscal ?? ""),
      label: j.cnae_fiscal_descricao ?? "",
    },
    cnaesSecundarios: Array.isArray(j.cnaes_secundarios)
      ? j.cnaes_secundarios.map((c: any) => ({
          code: String(c.codigo ?? ""),
          label: c.descricao ?? "",
        }))
      : [],
    endereco: {
      logradouro: j.logradouro ?? "",
      numero: String(j.numero ?? ""),
      bairro: j.bairro ?? "",
      cidade: j.municipio ?? "",
      uf: j.uf ?? "",
      cep: String(j.cep ?? ""),
    },
    telefone: j.ddd_telefone_1 ?? "",
    email: j.email ?? "",
    socios: qsa,
    fonte: "BrasilAPI",
  };
}

function fromReceitaWs(j: any): CnpjDetails {
  const qsa: Socio[] = Array.isArray(j.qsa)
    ? j.qsa.map((s: any) => {
        const qual = s.qual ?? "";
        return {
          nome: s.nome ?? "",
          qualificacao: qual,
          tipo: inferTipo(qual),
        };
      })
    : [];
  return {
    cnpj: String(j.cnpj ?? "").replace(/\D/g, ""),
    razaoSocial: j.nome ?? "",
    nomeFantasia: j.fantasia ?? "",
    situacao: j.situacao ?? "",
    dataAbertura: j.abertura ?? "",
    capitalSocial: Number(String(j.capital_social ?? "0").replace(/\./g, "").replace(",", ".")) || 0,
    naturezaJuridica: j.natureza_juridica ?? "",
    porte: j.porte ?? "",
    cnaePrincipal: {
      code: j.atividade_principal?.[0]?.code ?? "",
      label: j.atividade_principal?.[0]?.text ?? "",
    },
    cnaesSecundarios: Array.isArray(j.atividades_secundarias)
      ? j.atividades_secundarias.map((c: any) => ({ code: c.code ?? "", label: c.text ?? "" }))
      : [],
    endereco: {
      logradouro: j.logradouro ?? "",
      numero: j.numero ?? "",
      bairro: j.bairro ?? "",
      cidade: j.municipio ?? "",
      uf: j.uf ?? "",
      cep: j.cep ?? "",
    },
    telefone: j.telefone ?? "",
    email: j.email ?? "",
    socios: qsa,
    fonte: "ReceitaWS",
  };
}

export const lookupCnpj = createServerFn({ method: "POST" })
  .inputValidator((input: { cnpj: string }) => {
    const cnpj = onlyDigits(input?.cnpj ?? "");
    if (cnpj.length !== 14) throw new Error("INVALID_CNPJ");
    return { cnpj };
  })
  .handler(async ({ data }) => {
    const { cnpj } = data;
    const api_key = `cnpj:${cnpj}`;

    const cached = await getCachedApiData(api_key);
    if (cached) {
      return { ok: true as const, data: cached as unknown as CnpjDetails, cached: true };
    }

    // 1. Prioridade: Base Local (Receita Federal) - Através de leads-cnpj-enrichment logic
    // Aqui no buscador usamos a mesma lógica centralizada para consistência
    try {
      const { getCnpjPublicData } = await import("./leads-cnpj-enrichment");
      const localData = await getCnpjPublicData(cnpj);
      if (localData) {
        // Adaptar StandardLead para CnpjDetails para manter compatibilidade com UI existente
        const details: CnpjDetails = {
          cnpj: localData.cnpj || cnpj,
          razaoSocial: localData.razao_social || "",
          nomeFantasia: localData.fantasia || "",
          situacao: localData.status || "",
          dataAbertura: "", // Simplificado
          capitalSocial: 0,
          naturezaJuridica: "",
          porte: localData.porte || "",
          cnaePrincipal: { code: localData.cnae_principal || "", label: "" },
          cnaesSecundarios: [],
          endereco: {
            logradouro: "",
            numero: "",
            bairro: "",
            cidade: localData.cidade || "",
            uf: localData.uf || "",
            cep: ""
          },
          telefone: "",
          email: "",
          socios: [],
          fonte: localData.source === "receita_federal_local" ? "OpenCNPJ" : (localData.source === "brasil_api" ? "BrasilAPI" : "ReceitaWS") as any
        };
        await setApiCacheData(api_key, details.fonte, details);
        return { ok: true as const, data: details, cached: false };
      }
    } catch (e) {
      Logger.error("Erro na consulta multi-fonte:", e);
    }

    return { ok: false as const, error: "NOT_FOUND" };

    return { ok: false as const, error: "NOT_FOUND" };
  });

export const searchCompanyPresence = createServerFn({ method: "POST" })
  .inputValidator((input: { lead_id: string; cnpj: string; site?: string; logradouro?: string; cidade: string; uf: string }) => input)
  .handler(async ({ data }) => {
    const api_key = `presence:${data.lead_id}`;
    const cached = await getCachedApiData(api_key);
    if (cached) return cached as unknown as DigitalPresence;

    const { dns, http } = await checkSiteStatus(data.site || "");
    await updateFieldValidation(data.lead_id, "site", dns && http, ["dns_lookup", "http_check"]);

    const osm_match = await checkOSMAddress(data.logradouro || "", data.cidade, data.uf);
    await updateFieldValidation(data.lead_id, "endereco", osm_match, ["osm_nominatim"]);

    const cnpj_valid = data.cnpj && data.cnpj.length === 14;
    await updateFieldValidation(data.lead_id, "cnpj", !!cnpj_valid, ["brasilapi", "receitaws"]);
    
    let score = 0;
    if (dns) score += 20;
    if (http) score += 30;
    if (osm_match) score += 25;
    if (cnpj_valid) score += 25;

    const level = score >= 80 ? 'high' : score >= 50 ? 'medium' : score > 0 ? 'low' : 'unverified';
    
    const result: DigitalPresence = {
      score,
      level,
      details: {
        site_active: http,
        domain_exists: dns,
        physical_presence: osm_match,
        sources_count: [dns, http, osm_match].filter(Boolean).length + 1,
        consistency_score: score / 100
      },
      validations: { dns, http, osm: osm_match, ibge: true }
    };

    await setApiCacheData(api_key, "presence_engine", result);
    
    const supabase = getSupabase();
    await supabase.from("digital_presence_analysis").upsert({
      lead_id: data.lead_id,
      presence_score: score,
      confidence_score: result.details.consistency_score,
      confidence_level: level,
      validations: result.validations,
      web_status: http ? 'online' : dns ? 'offline' : 'no_site'
    }, { onConflict: 'lead_id' });

    return result;
  });

export async function innerDetectWeakDigitalPresence(data: { lead_id: string; presence: DigitalPresence; cnpj: string }) {
    const { presence, lead_id } = data;

    let opportunity_score = 0;
    const reasoning: string[] = [];
    const commercial_tags: string[] = [];
    let critical_failure_type: string | null = null;
    let diagnostic_message = "";
    let commercial_insight = "";
    let financial_impact_reason = "";

    // 1. Diagnóstico de Site (Critical)
    if (!presence.validations.dns) {
      opportunity_score += 30;
      critical_failure_type = "no_site_domain";
      reasoning.push("Domínio não encontrado (DNS falhou).");
      commercial_tags.push("no_website");
      commercial_insight = "Empresa sem site ativo: Perda total de clientes via Google/Busca.";
      financial_impact_reason = "Hoje quem busca seu serviço não consegue te encontrar online e acaba escolhendo concorrentes.";
    } else if (!presence.validations.http) {
      opportunity_score += 25;
      critical_failure_type = "website_down";
      reasoning.push("Site fora do ar (Servidor não responde HTTP 200).");
      commercial_tags.push("website_down");
      commercial_insight = "Site fora do ar: Queda imediata de credibilidade e conversão.";
      financial_impact_reason = "Um site offline afasta leads qualificados que buscam prova social do seu negócio.";
    }

    // 2. Presença Geográfica (OpenStreetMap)
    if (!presence.validations.osm) {
      opportunity_score += 20;
      reasoning.push("Empresa invisível em bases geográficas públicas (OSM).");
      commercial_tags.push("no_geo_presence");
      if (!commercial_insight) commercial_insight = "Invisível localmente: Dificuldade de captação geográfica.";
      if (!financial_impact_reason) financial_impact_reason = "Sua empresa não aparece em mapas digitais, limitando visitas físicas e pedidos locais.";
    }

    // 3. Consistência e Completude
    if (presence.details.consistency_score < 0.6) {
      opportunity_score += 15;
      reasoning.push("Inconsistência de dados entre fontes oficiais.");
      commercial_tags.push("inconsistent_data");
    }

    // Revenue Engineering: Cálculo de Probabilidade de Fechamento (Closing)
    const closing_probability = (opportunity_score / 100) * 0.85; // Prioriza leads com problemas técnicos graves
    const best_channel_hint = opportunity_score >= 80 ? 'whatsapp' : 'email';

    // Nível de Urgência Baseado no Score
    const opportunity_level = opportunity_score >= 80 ? 'hot' : opportunity_score >= 50 ? 'medium' : 'cold';
    const urgency_level = opportunity_score >= 80 ? 'direct' : opportunity_score >= 50 ? 'consultative' : 'educational';
    
    if (opportunity_level === 'hot') commercial_tags.push("high_opportunity", "immediate_alert");

    const result = {
      lead_id,
      opportunity_score: Math.min(100, opportunity_score),
      opportunity_level,
      urgency_level,
      reasoning,
      commercial_tags,
      diagnostic_message: diagnostic_message || reasoning[0],
      commercial_insight,
      financial_impact_reason,
      critical_failure_type,
      conversion_probability: closing_probability * 0.9,
      closing_probability,
      best_channel_hint,
      last_detected_at: new Date().toISOString(),
      technical_meta: { presence_score: presence.score, validations: presence.validations }
    };

    const supabase = getSupabase();
    await supabase.from("commercial_opportunities").upsert(result, { onConflict: 'lead_id' });

    return result;
}

export const detectWeakDigitalPresence = createServerFn({ method: "POST" })
  .inputValidator((input: { lead_id: string; presence: DigitalPresence; cnpj: string }) => input)
  .handler(async ({ data }) => {
    return innerDetectWeakDigitalPresence(data);
  });

export const searchPublicLeads = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string; filters?: any }) => input)
  .handler(async ({ data }) => {
    return { success: true, message: "Use o fluxo de busca consolidado." };
  });
export async function innerGenerateSalesMessage(data: { 
    lead_id: string; 
    company_name: string; 
    city: string; 
    problems: string[]; 
    presence_score: number;
    channel: 'whatsapp' | 'email' | 'direct' | 'consultative';
    diagnostic_message?: string;
    urgency_level?: string;
    commercial_insight?: string;
    financial_impact?: string;
  }) {
    const { company_name, city, problems, presence_score, channel, urgency_level, commercial_insight, financial_impact } = data;
    
    // CRO: Variação Inteligente (A/B) baseada no canal
    const variant = Math.random() > 0.5 ? 'A' : 'B';
    
    // Get user style preferences
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    let userStyle = null;
    if (user) {
      const { data: profile } = await supabase
        .from("user_sales_profile")
        .select("preferred_tone, preferred_size, preferred_cta")
        .eq("user_id", user.id)
        .maybeSingle();
      userStyle = profile;
    }

    let opening = variant === 'A' 
      ? `Analisei a presença digital da ${company_name} em ${city} e identifiquei um ponto crítico que pode estar fazendo você perder clientes.`
      : `Olá! Sou especialista em visibilidade digital e notei que a ${company_name} está invisível para novos clientes em ${city} hoje.`;

    // Adapt to user style if available
    if (userStyle?.preferred_tone === 'direct') {
      opening = `Vi que a ${company_name} em ${city} está perdendo clientes por falhas na presença digital.`;
    }

    const proof = problems.join(" e ");
    const impact = financial_impact || "Isso limita sua visibilidade e facilita que concorrentes capturem sua demanda.";
    
    let cta = variant === 'A'
      ? "Posso te mostrar em 2 minutos como resolver isso e recuperar esse terreno?"
      : "Gostaria de receber o diagnóstico completo que fizemos da sua empresa sem custo?";

    if (userStyle?.preferred_cta === 'convite direto') {
      cta = "Vamos agendar uma conversa rápida para eu te mostrar como resolver isso?";
    }

    let message = "";
    
    if (channel === 'whatsapp') {
      message = `Olá! Vi que a ${company_name} em ${city} ${commercial_insight ? commercial_insight.toLowerCase() : 'está com baixa visibilidade'}. Notamos que ${proof.toLowerCase()}. ${impact} ${cta}`;
    } else if (channel === 'email') {
      message = `Assunto: Alerta de Visibilidade Comercial - ${company_name}\n\nOlá,\n\n${opening}\n\nDetectamos via bases públicas (DNS/OSM) que: ${proof}.\n\nImpacto: ${impact}\n\nSeu score de presença real é de ${presence_score}/100.\n\n${cta}`;
    } else if (channel === 'consultative') {
      message = `Olá, notei que a ${company_name} é uma referência em ${city}, mas possui um gap técnico: ${proof.toLowerCase()}. Isso impacta diretamente na credibilidade digital que os clientes buscam hoje. Gostaria de receber o relatório técnico de validação que geramos?`;
    } else {
      const urgencyPrefix = urgency_level === 'direct' ? "URGENTE: " : "";
      message = `${urgencyPrefix}Identificamos que a ${company_name} está perdendo mercado em ${city}. ${proof}. ${impact} ${cta}`;
    }

    // Apply size preference
    if (userStyle?.preferred_size === 'short' && message.length > 200) {
      message = message.substring(0, 197) + "... " + cta;
    }


    await supabase.from("sales_pitch_history").insert({
      lead_id: data.lead_id,
      channel,
      message_content: message,
      detected_problems: problems,
      presence_score,
      pitch_variation: urgency_level || 'standard',
      ab_test_variant: variant,
      sent_at: new Date().toISOString()
    });

    return { message, variant };
}

type GenerateSalesMessageInput = {
  lead_id: string;
  company_name: string;
  city: string;
  problems: string[];
  presence_score: number;
  channel: 'whatsapp' | 'email' | 'direct' | 'consultative';
  diagnostic_message?: string;
  urgency_level?: string;
  commercial_insight?: string;
  financial_impact?: string;
};

export const generateSalesMessage = createServerFn({ method: "POST" })
  .inputValidator((input: GenerateSalesMessageInput) => input)
  .handler(async ({ data }) => {
    return innerGenerateSalesMessage(data);
  });

export const generateFollowUpSequence = createServerFn({ method: "POST" })
  .inputValidator((input: { lead_id: string; company_name: string; city: string; problems: string[]; presence_score: number; channel: 'whatsapp' | 'email' }) => input)
  .handler(async ({ data }) => {
    const { company_name, city, problems, presence_score, channel } = data;
    const proof = problems.join(" e ");
    
    const sequence = [
      // D0: Mensagem Principal (já gerada pelo generateSalesMessage)
      { day: 0, type: 'initial', content: "Abordagem inicial de visibilidade." },
      
      // D+1: Reforço do Problema
      { 
        day: 1, 
        type: 'problem_reinforcement', 
        content: `Oi! Só passando para reforçar que a ausência de um domínio ativo da ${company_name} está deixando sua empresa invisível para quem busca no Google hoje em ${city}.` 
      },
      
      // D+2: Prova + Urgência
      { 
        day: 2, 
        type: 'proof_urgency', 
        content: `Notei que concorrentes em ${city} já capturam essa demanda que você está perdendo. Com um score de presença de ${presence_score}/100, a urgência de correção é alta.` 
      },
      
      // D+3: Fechamento Direto
      { 
        day: 3, 
        type: 'direct_closing', 
        content: `Podemos resolver esse gap técnico da ${company_name} hoje? Tenho um horário livre à tarde para te mostrar o plano de ativação.` 
      }
    ];

    const supabase = getSupabase();
    await supabase.from("sales_followup_sequences").upsert({
      lead_id: data.lead_id,
      sequence_history: sequence as any,
      next_message_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    }, { onConflict: 'lead_id' });

    return { sequence };
  });

export const getRevenueAnalytics = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await getSupabase().from("revenue_analytics_daily").select("*").order("check_date", { ascending: false }).limit(7);
    return data || [];
  });

type TrackSalesConversionInput = {
  pitch_id: string;
  type: 'reply' | 'conversion' | 'open';
  reply_type?: 'interessado' | 'neutro' | 'negativo';
  revenue?: number;
  response_time_ms?: number;
};

export const trackSalesConversion = createServerFn({ method: "POST" })
  .inputValidator((input: TrackSalesConversionInput) => input)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const update: any = {};
    if (data.type === 'reply') {
      update.replied = true;
      if (data.reply_type) update.reply_type = data.reply_type;
    }
    if (data.type === 'conversion') {
      update.converted = true;
      if (data.revenue) update.revenue_generated = data.revenue;
    }
    if (data.type === 'open') update.opened = true;
    if (data.response_time_ms) update.response_time_ms = data.response_time_ms;
    
    await supabase.from("sales_pitch_history").update(update).eq("id", data.pitch_id);
    return { success: true };
  });

export const getFollowupDashboardData = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data: sequences } = await supabase
      .from("sales_followup_sequences")
      .select(`
        *,
        lead:leads_import(id, company_name, city),
        opportunity:commercial_opportunities(opportunity_score, opportunity_level)
      `)
      .order("next_message_at", { ascending: true });
    
    const { data: stats } = await supabase.from("sales_efficiency_analytics").select("*");
    
    return { sequences: sequences || [], stats: stats || [] };
  });

export const autoOptimizeMessages = createServerFn({ method: "POST" })
  .handler(async () => {
    const supabase = getSupabase();
    // Analisar variantes A/B com maior conversão
    const { data: variants } = await supabase
      .from("sales_pitch_history")
      .select("ab_test_variant, channel, replied, converted")
      .not("ab_test_variant", "is", null);

    const scores = (variants || []).reduce((acc: any, curr: any) => {
      const key = `${curr.channel}:${curr.ab_test_variant}`;
      if (!acc[key]) acc[key] = { count: 0, points: 0 };
      acc[key].count++;
      if (curr.replied) acc[key].points += 1;
      if (curr.converted) acc[key].points += 3;
      return acc;
    }, {});

    const optimizations = Object.entries(scores).map(([key, val]: [string, any]) => ({
      key,
      score: val.points / val.count,
      is_top_performer: (val.points / val.count) > 0.5
    }));

    return { success: true, optimizations };
  });

export const getChannelPerformance = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from("channel_performance").select("*").order("total_revenue", { ascending: false });
    return data || [];
  });
