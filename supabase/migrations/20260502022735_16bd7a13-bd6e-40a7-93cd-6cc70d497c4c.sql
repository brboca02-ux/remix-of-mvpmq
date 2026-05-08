-- Evolução para Motor de Persuasão Psicológica
ALTER TABLE public.prospect_leads
ADD COLUMN IF NOT EXISTS psychological_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS behavioral_profile TEXT, -- Analítico, Direto, Desconfiado...
ADD COLUMN IF NOT EXISTS real_time_strategy TEXT, -- Estratégia adaptada ao comportamento
ADD COLUMN IF NOT EXISTS conversion_score_by_profile NUMERIC DEFAULT 0;

-- Tabela de estatísticas por perfil psicológico
CREATE TABLE IF NOT EXISTS public.profile_conversion_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_type TEXT UNIQUE NOT NULL, -- Analítico, Direto, Desconfiado...
    leads_count INTEGER DEFAULT 0,
    responses_count INTEGER DEFAULT 0,
    closures_count INTEGER DEFAULT 0,
    avg_velocity_ms NUMERIC DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profile_conversion_stats ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (simplificadas para o contexto do app)
CREATE POLICY "Enable all for profile stats" ON public.profile_conversion_stats FOR ALL USING (true);

-- Inserir perfis iniciais para rastreamento
INSERT INTO public.profile_conversion_stats (profile_type)
VALUES ('Analítico'), ('Direto'), ('Desconfiado'), ('Ocupado'), ('Curioso'), ('Indeciso'), ('Reativo')
ON CONFLICT (profile_type) DO NOTHING;
