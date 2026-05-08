import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateSecretToken,
  signPayload,
  maskMessagePreview,
  validateWebhookUrl,
} from "./make-integration.server";

const APP_BASE_URL = "https://market-whisperer-87.lovable.app";

export interface MakeLeadPayload {
  id: string;
  companyName: string;
  contactName?: string | null;
  niche?: string | null;
  city?: string | null;
  uf?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagramHandle?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  googleMapsUrl?: string | null;
  rating?: number | null;
  score?: number | null;
  status?: string | null;
}

export interface SendInput {
  lead: MakeLeadPayload;
  channels: ("whatsapp" | "email" | "instagram")[];
  variant: "A" | "B" | "C";
  message: string;
  emailSubject?: string;
  updateLeadStatus?: string | null;
}

// ─── Settings ────────────────────────────────────────────────────────

export const getMakeSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "make")
      .maybeSingle();

    if (error) {
      console.error("getMakeSettings error", error);
      return { settings: null, error: "Falha ao carregar configurações." };
    }
    return { settings: data, error: null };
  });

export const saveMakeSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      webhook_url: string;
      max_retries?: number;
      retry_interval_sec?: number;
      default_tone?: string;
      enabled?: boolean;
      regenerate_secret?: boolean;
    }) => input
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const validation = validateWebhookUrl(data.webhook_url);
    if (!validation.ok) {
      return { settings: null, error: validation.reason };
    }

    // Check existing
    const { data: existing } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "make")
      .maybeSingle();

    const secret_token =
      data.regenerate_secret || !existing?.secret_token
        ? generateSecretToken()
        : existing.secret_token;

    const payload = {
      user_id: userId,
      provider: "make",
      webhook_url: validation.url.toString(),
      secret_token,
      max_retries: Math.min(Math.max(data.max_retries ?? 3, 1), 10),
      retry_interval_sec: Math.min(Math.max(data.retry_interval_sec ?? 30, 5), 600),
      default_tone: (data.default_tone || "profissional").slice(0, 40),
      enabled: data.enabled ?? true,
    };

    const { data: saved, error } = await supabase
      .from("integration_settings")
      .upsert(payload, { onConflict: "user_id,provider" })
      .select()
      .single();

    if (error) {
      console.error("saveMakeSettings error", error);
      return { settings: null, error: "Falha ao salvar configurações." };
    }
    return { settings: saved, error: null };
  });

// ─── Test webhook ────────────────────────────────────────────────────

export const testMakeWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "make")
      .maybeSingle();

    if (!settings?.webhook_url || !settings.secret_token) {
      return {
        ok: false,
        status: 0,
        latency_ms: 0,
        error: "Configure a URL do webhook antes de testar.",
        response: null,
      };
    }

    const validation = validateWebhookUrl(settings.webhook_url);
    if (!validation.ok) {
      return { ok: false, status: 0, latency_ms: 0, error: validation.reason, response: null };
    }

    const requestId = crypto.randomUUID();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
      event: "lead.test",
      request_id: requestId,
      timestamp: new Date().toISOString(),
      message: "Teste de conexão do Lovable → Make",
      source: "marketscope-lovable",
    });
    const signature = signPayload(settings.secret_token, body);

    const start = Date.now();
    try {
      const res = await fetch(validation.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Lovable-Signature": `sha256=${signature}`,
          "X-Lovable-Timestamp": timestamp,
          "X-Lovable-Request-Id": requestId,
        },
        body,
        signal: AbortSignal.timeout(15000),
      });
      const latency = Date.now() - start;
      const text = await res.text().catch(() => "");
      return {
        ok: res.ok,
        status: res.status,
        latency_ms: latency,
        error: res.ok ? null : `HTTP ${res.status}`,
        response: text.slice(0, 500),
      };
    } catch (err: any) {
      const latency = Date.now() - start;
      return {
        ok: false,
        status: 0,
        latency_ms: latency,
        error: err?.message || "Falha de rede ao contatar o Make",
        response: null,
      };
    }
  });

// ─── Send to Make ────────────────────────────────────────────────────

export const sendLeadToMake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SendInput) => {
    if (!input?.lead?.id) throw new Error("Lead inválido");
    if (!input?.message?.trim()) throw new Error("Mensagem vazia");
    if (!Array.isArray(input.channels) || input.channels.length === 0)
      throw new Error("Selecione pelo menos um canal");
    if (input.message.length > 4000) throw new Error("Mensagem muito longa");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load settings
    const { data: settings } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "make")
      .maybeSingle();

    if (!settings?.webhook_url || !settings.secret_token || !settings.enabled) {
      return {
        ok: false,
        status: "failed" as const,
        error: "Configure a integração com o Make em Ajustes → Integrações.",
        log_id: null,
      };
    }

    const validation = validateWebhookUrl(settings.webhook_url);
    if (!validation.ok) {
      return { ok: false, status: "failed" as const, error: validation.reason, log_id: null };
    }

    const requestId = crypto.randomUUID();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Create initial log
    const { data: log, error: logErr } = await supabase
      .from("make_send_log")
      .insert({
        user_id: userId,
        lead_id: data.lead.id,
        request_id: requestId,
        channels: data.channels,
        variant: data.variant,
        message_preview: maskMessagePreview(data.message),
        status: "sending",
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logErr) {
      console.error("create log err", logErr);
      return { ok: false, status: "failed" as const, error: "Falha ao registrar envio.", log_id: null };
    }

    const messages: Record<string, any> = {};
    if (data.channels.includes("whatsapp")) messages.whatsapp = data.message;
    if (data.channels.includes("email"))
      messages.email = {
        subject: data.emailSubject || `Proposta para ${data.lead.companyName}`,
        body: data.message,
      };
    if (data.channels.includes("instagram")) messages.instagram = data.message;

    const payload = {
      event: "lead.send_message",
      request_id: requestId,
      timestamp: new Date().toISOString(),
      user_id: userId,
      channels: data.channels,
      variant: data.variant,
      messages,
      lead: data.lead,
      callback_url: `${APP_BASE_URL}/api/public/make-callback`,
      source: "marketscope-lovable",
    };

    const body = JSON.stringify(payload);
    const signature = signPayload(settings.secret_token, body);
    const start = Date.now();

    try {
      const res = await fetch(validation.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Lovable-Signature": `sha256=${signature}`,
          "X-Lovable-Timestamp": timestamp,
          "X-Lovable-Request-Id": requestId,
        },
        body,
        signal: AbortSignal.timeout(20000),
      });
      const latency = Date.now() - start;

      if (res.ok) {
        await supabase
          .from("make_send_log")
          .update({
            status: "delivered",
            http_status: res.status,
            response_time_ms: latency,
            delivered_at: new Date().toISOString(),
          })
          .eq("id", log.id);

        // Optionally update lead status
        if (data.updateLeadStatus) {
          await supabase
            .from("prospect_leads")
            .update({ status: data.updateLeadStatus })
            .eq("id", data.lead.id)
            .eq("user_id", userId);
        }

        return { ok: true, status: "delivered" as const, error: null, log_id: log.id };
      }

      // Failure → enqueue for retry
      const errorMsg = `HTTP ${res.status}`;
      await supabase
        .from("make_send_log")
        .update({
          status: "retrying",
          http_status: res.status,
          response_time_ms: latency,
          error_message: errorMsg,
        })
        .eq("id", log.id);

      const nextAt = new Date(Date.now() + (settings.retry_interval_sec || 30) * 1000);
      await supabase.from("make_send_queue").insert({
        log_id: log.id,
        user_id: userId,
        payload: payload as any,
        next_attempt_at: nextAt.toISOString(),
        attempts: 1,
        status: "pending",
        last_error: errorMsg,
      } as any);

      return {
        ok: false,
        status: "retrying" as const,
        error: `${errorMsg} — reenvio agendado em ${settings.retry_interval_sec || 30}s`,
        log_id: log.id,
      };
    } catch (err: any) {
      const errorMsg = err?.message || "Falha de rede";
      await supabase
        .from("make_send_log")
        .update({
          status: "retrying",
          response_time_ms: Date.now() - start,
          error_message: errorMsg,
        })
        .eq("id", log.id);

      const nextAt = new Date(Date.now() + (settings.retry_interval_sec || 30) * 1000);
      await supabase.from("make_send_queue").insert({
        log_id: log.id,
        user_id: userId,
        payload: payload as any,
        next_attempt_at: nextAt.toISOString(),
        attempts: 1,
        status: "pending",
        last_error: errorMsg,
      } as any);

      return {
        ok: false,
        status: "retrying" as const,
        error: `${errorMsg} — reenvio automático agendado`,
        log_id: log.id,
      };
    }
  });

// ─── Generate AI variants ────────────────────────────────────────────

export const generateMakeVariants = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      lead: MakeLeadPayload;
      tone?: string;
      channel?: "whatsapp" | "email" | "instagram";
      existingPitch?: string | null;
      type?: "first" | "followup1" | "followup2" | "last";
      objective?: "open_conversation" | "generate_curiosity" | "qualify_lead" | "book_meeting";
      behaviorContext?: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const lead = data.lead;
    const channel = data.channel || "whatsapp";
    const type = data.type || "first";
    const objective = data.objective || "open_conversation";
    const strategy = (data as any).strategy || "neutro";
    const intensity = (data as any).intensity || "leve";
    const behaviorContext = data.behaviorContext || "";

    if (!apiKey) {
      return {
        variantA: buildTemplate(lead, "formal", type),
        variantB: buildTemplate(lead, "informal", type),
        variantC: buildTemplate(lead, "consultivo", type),
        used_ai: false,
      };
    }

    const lengthHint =
      channel === "whatsapp" ? "máximo 4-6 linhas, direto" : channel === "instagram" ? "muito curto, casual, foco em curiosidade" : "estruturado, profissional leve, sem ser formal demais";

    const typeDesc = {
      first: "Primeira abordagem: abertura leve, contexto real, gancho de valor, CTA leve (pergunta simples).",
      followup1: "Follow-up 1 (sem resposta): lembrete rápido, focado em um insight específico.",
      followup2: "Follow-up 2: mais direto, focado no problema detectado.",
      last: "Última tentativa: encerramento elegante, deixando a porta aberta.",
    }[type];

    const objectiveDesc = {
      open_conversation: "Objetivo: Abrir uma conversa amigável e estabelecer contato inicial.",
      generate_curiosity: "Objetivo: Criar uma dúvida estratégica sobre a presença digital atual do lead.",
      qualify_lead: "Objetivo: Fazer perguntas para entender se o lead tem fit para um novo site ou serviço.",
      book_meeting: "Objetivo: Agendar uma breve demonstração ou conversa técnica.",
    }[objective];

    const strategyDetails = ({
      neutro: "Foque em ser direto e profissional, sem gatilhos específicos.",
      curiosidade: "Crie uma dúvida leve, faça a pessoa querer responder para saber mais. Não revele tudo de uma vez.",
      oportunidade: "Mostre algo que o lead está perdendo ou como ele pode crescer. Foco em ganho positivo.",
      autoridade: "Demonstre conhecimento profundo do nicho. Mostre que você já resolveu problemas similares.",
      prova_social: "Indique resultados de outros negócios similares (sem citar nomes se não tiver permissão).",
      escassez: "Limite sua disponibilidade. Mostre que você seleciona poucos projetos por mês.",
      curva_medo: "Foco no risco de não agir (perda de clientes para concorrência, visibilidade baixa). Seja profissional, nunca ameaçador.",
    } as Record<string, string>)[strategy] || "Abordagem equilibrada.";

    const intensityDesc = ({
      leve: "Tom sutil e sugestivo.",
      medio: "Mais direto e enfático.",
      forte: "Abordagem assertiva e provocadora, mas sempre mantendo o respeito.",
    } as Record<string, string>)[intensity] || "Tom leve.";

    const problemsDetected = [];
    if (!lead.websiteUrl) problemsDetected.push("Sem site estruturado");
    if (!lead.instagramHandle) problemsDetected.push("Presença no Instagram fraca ou inexistente");
    if (lead.score && lead.score < 50) problemsDetected.push(`Score digital baixo (${lead.score}/100)`);

    const sys =
      "Você é um especialista em vendas B2B (Social Selling) focado em prospecção manual. Seu objetivo é gerar mensagens que NÃO pareçam spam, NÃO usem linguagem de agência e NÃO pareçam robóticas. Use um tom humano, natural e curioso. NUNCA use 'posso te ajudar?' ou 'gostaria de agendar uma reunião?'. Foque em 'mostrar algo' ou 'trocar uma ideia rápida'.";

    const userMsg = `DADOS DO LEAD:
Empresa: ${lead.companyName}
Nicho: ${lead.niche || "—"}
Localização: ${lead.city || "—"}${lead.uf ? `/${lead.uf}` : ""}
Site: ${lead.websiteUrl || "NÃO TEM"}
Instagram: ${lead.instagramHandle ? `@${lead.instagramHandle}` : "NÃO TEM"}
Score: ${lead.score || "—"}
Problemas Detectados: ${problemsDetected.join(", ") || "Nenhum específico"}

INSTRUÇÃO:
Gere 3 variantes de mensagem de prospecção para o canal "${channel}".
Tipo de Mensagem: ${typeDesc}
Foco do Objetivo: ${objectiveDesc}
Restrição: ${lengthHint}. Use o nome da empresa e nicho de forma natural.
Estratégia Psicológica: ${strategy} (${strategyDetails})
Intensidade do Gatilho: ${intensityDesc}
Contexto do Lead: ${behaviorContext}

Estrutura desejada (para Primeira Abordagem):
1. Abertura natural (Oi/Olá [Nome] ou [Empresa])
2. Contexto real (vi seu perfil/negócio)
3. Aplicação do gatilho (${strategy})
4. Insight/Observação relevante
5. Pergunta leve/Sugestão (CTA simples)

- Variante A: Focada 100% na estratégia "${strategy}" com intensidade "${intensity}".
- Variante B: Mescla a estratégia "${strategy}" com tom casual e conversacional.
- Variante C: Foco em diagnóstico consultivo usando o gatilho "${strategy}" como base.

Responda APENAS em JSON: {"variantA":"...", "variantB":"...", "variantC":"..."}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userMsg },
          ],
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return {
          variantA: buildTemplate(lead, "formal", type),
          variantB: buildTemplate(lead, "informal", type),
          variantC: buildTemplate(lead, "consultivo", type),
          used_ai: false,
        };
      }
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      return {
        variantA: parsed.variantA || buildTemplate(lead, "formal", type),
        variantB: parsed.variantB || buildTemplate(lead, "informal", type),
        variantC: parsed.variantC || buildTemplate(lead, "consultivo", type),
        used_ai: true,
      };
    } catch (e) {
      return {
        variantA: buildTemplate(lead, "formal", type),
        variantB: buildTemplate(lead, "informal", type),
        variantC: buildTemplate(lead, "consultivo", type),
        used_ai: false,
      };
    }
  });

function buildTemplate(lead: MakeLeadPayload, tone: "formal" | "informal" | "consultivo", type: string = "first"): string {
  const company = lead.companyName || "sua empresa";
  const city = lead.city ? ` em ${lead.city}` : "";
  
  if (type === "followup1") {
    return `Oi! Passando rápido para ver se conseguiu ler minha mensagem sobre a ${company}. Vi uns pontos no digital de vocês que valem a pena olhar. Faz sentido falarmos?`;
  }
  if (type === "last") {
    return `Vou te deixar em paz por aqui! Se um dia quiser bater um papo sobre como melhorar a presença da ${company} em ${lead.city || 'sua região'}, é só me chamar. Sucesso!`;
  }

  if (tone === "formal") {
    return `Olá! Vi o trabalho da ${company}${city} e achei bem interessante. Notei só que vocês ainda não têm um site estruturado — hoje isso acaba fazendo muita gente se perder no caminho. Vocês já pensaram em melhorar essa parte?`;
  }
  if (tone === "informal") {
    return `Oi! Tudo bem? Dei uma olhada na ${company}${city} e curti o perfil de vocês. Notei um detalhe no site que pode estar afastando clientes. Posso te mostrar em 2 minutos?`;
  }
  return `Olá! Analisando o mercado em ${lead.city || "sua região"}, notei que a ${company} tem um potencial gigante que não está sendo aproveitado no digital. Se fizer sentido, posso te mostrar o que vi.`;
}

// ─── Logs ────────────────────────────────────────────────────────────

export const listMakeSendLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { lead_id?: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const limit = Math.min(data.limit || 20, 100);
    let q = supabase
      .from("make_send_log")
      .select("*")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(limit);
    if (data.lead_id) q = q.eq("lead_id", data.lead_id);
    const { data: logs, error } = await q;
    if (error) {
      console.error("listMakeSendLogs", error);
      return { logs: [], error: "Falha ao carregar histórico." };
    }
    return { logs: logs || [], error: null };
  });

export const getMakeStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: logs } = await supabase
      .from("make_send_log")
      .select("variant, status")
      .eq("user_id", userId)
      .gte("sent_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const stats = { A: { sent: 0, delivered: 0 }, B: { sent: 0, delivered: 0 }, total: 0, delivered: 0 };
    for (const l of logs || []) {
      stats.total++;
      if (l.status === "delivered") stats.delivered++;
      const v = l.variant === "B" ? "B" : "A";
      stats[v].sent++;
      if (l.status === "delivered") stats[v].delivered++;
    }
    return stats;
  });
