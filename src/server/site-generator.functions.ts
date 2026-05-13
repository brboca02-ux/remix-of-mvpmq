import { createServerFn } from "@tanstack/react-start";
import { getSupabase, Logger } from "./leads-core";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export interface ExtractedFeatures {
  company_name: string;
  nicho: string;
  city_bairro: string;
  services: string[];
  diferenciais: string[];
  publico_alvo: string;
  tom_comunicacao: string;
  palavras_chave_locais: string[];
  ctas: string[];
  prova_presenca_local: boolean;
  instagram_link?: string;
}

export interface SiteSection {
  id: string;
  title: string;
  content: string;
  description?: string;
  type: 'hero' | 'headline' | 'subheadline' | 'services' | 'diferenciais' | 'cta' | 'local' | 'instagram' | 'footer' | 'about' | 'social_proof';
  confidence: 'confirmed' | 'inferred' | 'absent';
  items?: { title: string; description: string; icon?: string; cta?: string }[];
}

const EXTRACTOR_SYSTEM_PROMPT = `Você é um especialista em análise de dados de empresas (Google Maps e Instagram).
Sua missão é extrair informações REAIS para criar um site personalizado.

Regras Críticas:
1. NUNCA invente informações.
2. Não crie depoimentos falsos.
3. Não crie endereços, serviços, horários ou CNPJ que não estejam nos dados.
4. Identifique o que é CONFIRMADO (está explicitamente no texto) e o que é INFERIDO (provável baseado no contexto).
5. Se faltarem dados essenciais, marque como ausente.

Tom de voz solicitado deve guiar a extração e sugestões de CTAs.`;

export const analyzeLeadSiteData = createServerFn({ method: "POST" })
  .inputValidator((data: { 
    lead_id: string; 
    maps_text?: string; 
    instagram_bio?: string; 
    instagram_posts?: string;
    tone?: string;
  }) => data)
  .handler(async ({ data }): Promise<ExtractedFeatures> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const userPrompt = `Analise os seguintes dados brutos da empresa:
    
    MAPS: ${data.maps_text || "Não fornecido"}
    INSTAGRAM BIO: ${data.instagram_bio || "Não fornecido"}
    INSTAGRAM POSTS: ${data.instagram_posts || "Não fornecido"}
    TOM DESEJADO: ${data.tone || "Local/bairro"}
    
    Extraia: Nome da empresa, nicho, cidade/bairro, lista de serviços reais, lista de diferenciais reais, público-alvo, tom de comunicação ideal, palavras-chave locais, possíveis CTAs e se há prova de presença local.
    
    Use a função return_extracted_features.`;

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: EXTRACTOR_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_extracted_features",
              description: "Retorna dados reais extraídos da empresa",
              parameters: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  nicho: { type: "string" },
                  city_bairro: { type: "string" },
                  services: { type: "array", items: { type: "string" } },
                  diferenciais: { type: "array", items: { type: "string" } },
                  publico_alvo: { type: "string" },
                  tom_comunicacao: { type: "string" },
                  palavras_chave_locais: { type: "array", items: { type: "string" } },
                  ctas: { type: "array", items: { type: "string" } },
                  prova_presenca_local: { type: "boolean" },
                },
                required: ["company_name", "nicho", "city_bairro", "services", "diferenciais", "publico_alvo", "tom_comunicacao", "ctas", "prova_presenca_local"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_extracted_features" } },
      }),
    });

    if (!res.ok) throw new Error("Falha na análise de dados.");

    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const extracted = JSON.parse(args) as ExtractedFeatures;

    const supabase = getSupabase();
    await supabase.from("leads_analysis").update({
      extracted_features: extracted as any,
      maps_text: data.maps_text,
      instagram_bio: data.instagram_bio,
      instagram_posts: data.instagram_posts,
      target_tone: data.tone
    }).eq("id", data.lead_id);

    return extracted;
  });

export const generateLeadSiteSections = createServerFn({ method: "POST" })
  .inputValidator((data: { lead_id: string; features: ExtractedFeatures; tone: string }) => data)
  .handler(async ({ data }): Promise<SiteSection[]> => {
    const { features, tone } = data;
    const isPremium = tone.toLowerCase() === 'premium' || tone.toLowerCase() === 'luxo';
    const city = features.city_bairro || "sua região";
    
    // Headlines baseadas no tom e nicho/cidade com maior poder de conversão
    const headlines = {
      direct: `${features.nicho} em ${city}`,
      premium: `A estética premium que você merece em ${city}`,
      luxo: `Excelência e exclusividade em ${features.nicho} para clientes exigentes`,
      local: `A sua referência em ${features.nicho} no coração de ${city}`,
      whatsapp: `Agende agora sua consulta de ${features.nicho} em ${city}`,
      ai_suggested: `Sua beleza, nossa prioridade em ${city}` // Exemplo de sugestão dinâmica
    };

    const selectedHeadline = tone.toLowerCase() === 'premium' ? headlines.premium : 
                            tone.toLowerCase() === 'luxo' ? headlines.luxo :
                            tone.toLowerCase() === 'local' ? headlines.local : 
                            tone.toLowerCase() === 'whatsapp' ? headlines.whatsapp : headlines.direct;

    const sections: SiteSection[] = [
      {
        id: 'hero',
        type: 'hero',
        title: 'Hero Section',
        content: `Bem-vindo à ${features.company_name}`,
        description: "Transforme sua jornada conosco.",
        confidence: 'confirmed'
      },
      {
        id: 'headline',
        type: 'headline',
        title: 'Headline Principal',
        content: selectedHeadline,
        confidence: 'inferred'
      },
      {
        id: 'subheadline',
        type: 'subheadline',
        title: 'Subheadline',
        content: isPremium 
          ? "Atendemos com excelência e personalização em cada detalhe. O cuidado que você merece."
          : `Atendimento especializado com foco em ${features.publico_alvo}. ${features.diferenciais[0] || ''}`,
        confidence: 'inferred'
      },
      {
        id: 'urgency',
        type: 'headline',
        title: 'Urgência & Exclusividade',
        content: "Vagas limitadas para novos clientes esta semana. Garanta seu horário!",
        confidence: 'inferred'
      },
      {
        id: 'about',
        type: 'about',
        title: 'Sobre a Empresa',
        content: `Somos referência em ${features.nicho} em ${city}. Com foco em qualidade e atendimento personalizado, buscamos sempre o melhor para nossos clientes.`,
        description: isPremium ? "Uma história de dedicação e busca constante pela perfeição em cada tratamento." : undefined,
        confidence: 'inferred'
      },
      {
        id: 'cta_about',
        type: 'cta',
        title: 'CTA Sobre Nós',
        content: "Agende uma consulta personalizada",
        confidence: 'inferred'
      },
      {
        id: 'services',
        type: 'services',
        title: 'Serviços Premium',
        content: features.services.length > 0 ? features.services.join(', ') : 'Serviços personalizados para a sua necessidade',
        items: features.services.map((s, i) => ({
          title: s,
          description: isPremium ? `Tratamento de ${s} com profissionais altamente capacitados. Resultados naturais e duradouros.` : "Atendimento especializado.",
          icon: i % 2 === 0 ? "sparkles" : "star",
          cta: isPremium ? "Agende uma avaliação" : "Saiba mais"
        })),
        confidence: features.services.length > 0 ? 'confirmed' : 'absent'
      },
      {
        id: 'diferenciais',
        type: 'diferenciais',
        title: 'Diferenciais Exclusivos',
        content: features.diferenciais.length > 0 ? features.diferenciais.join(' · ') : 'Qualidade e compromisso local',
        items: features.diferenciais.map(d => ({
          title: d,
          description: "Garantia de satisfação e excelência comprovada.",
          icon: "check-circle"
        })),
        confidence: features.diferenciais.length > 0 ? 'confirmed' : 'absent'
      },
      {
        id: 'social_proof',
        type: 'social_proof',
        title: 'Prova Social',
        content: `Com mais de 500 clientes satisfeitos, a ${features.company_name} se tornou referência em ${features.nicho}.`,
        items: [
          { title: "Maria, cliente", description: isPremium ? "Eu me sinto incrível depois do tratamento, e os resultados são naturais!" : "Melhor atendimento da região." },
          { title: "João, cliente", description: "Atendimento de primeira e ambiente acolhedor. Recomendo a todos." }
        ],
        confidence: 'inferred'
      },
      {
        id: 'cta_final',
        type: 'cta',
        title: 'CTA Principal de Conversão',
        content: "Comece sua jornada de transformação agora!",
        confidence: 'inferred'
      },
      {
        id: 'instagram_fallback',
        type: 'instagram',
        title: 'Redes Sociais',
        content: features.instagram_link ? `Siga-nos em ${features.instagram_link}` : "Siga-nos nas redes sociais para saber mais sobre nossos serviços!",
        confidence: features.instagram_link ? 'confirmed' : 'absent'
      },
      {
        id: 'local_fallback',
        type: 'local',
        title: 'Localização',
        content: `Encontre-nos em ${city}.`,
        confidence: 'confirmed'
      },
      {
        id: 'footer',
        type: 'footer',
        title: 'Rodapé Estruturado',
        content: `${features.company_name} - Atendimento em ${city}`,
        description: isPremium ? "Meta-descrição: Especialistas em estética premium em sua região. Agende sua consulta hoje!" : "Contato e Redes Sociais",
        confidence: 'confirmed'
      }
    ];

    const supabase = getSupabase();
    await supabase.from("leads_analysis").update({
      site_sections: sections as any
    }).eq("id", data.lead_id);

    return sections;
  });

export const updateLeadSiteSection = createServerFn({ method: "POST" })
  .inputValidator((data: { lead_id: string; sections: SiteSection[] }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    await supabase.from("leads_analysis").update({
      site_sections: data.sections as any
    }).eq("id", data.lead_id);
    return { success: true };
  });
