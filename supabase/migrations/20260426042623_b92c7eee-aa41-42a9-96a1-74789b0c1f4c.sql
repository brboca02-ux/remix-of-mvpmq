-- 1. Base Local da Receita Federal (Dados Abertos)
CREATE TABLE IF NOT EXISTS public.cnpj_base_receita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj TEXT UNIQUE NOT NULL,
    razao_social TEXT,
    nome_fantasia TEXT,
    cnae_principal TEXT,
    cnae_secundario TEXT[],
    situacao_cadastral TEXT,
    data_abertura DATE,
    porte TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cep TEXT,
    uf TEXT,
    cidade TEXT,
    capital_social NUMERIC,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_cnpj_base_receita_cnpj ON public.cnpj_base_receita(cnpj);

-- 2. Tabela de Conflitos de Dados
CREATE TABLE IF NOT EXISTS public.data_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    value_a TEXT,
    source_a TEXT,
    value_b TEXT,
    source_b TEXT,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Função para Cálculo de Confidence Score Multi-fonte
CREATE OR REPLACE FUNCTION public.calculate_lead_confidence(p_lead_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    score NUMERIC := 0;
    source_count INTEGER;
    conflict_count INTEGER;
BEGIN
    -- Base: Numero de fontes únicas que contribuíram para este lead
    SELECT COUNT(DISTINCT source_name) INTO source_count
    FROM public.lead_data_sources
    WHERE lead_id = p_lead_id;

    -- Penalidade por conflitos não resolvidos
    SELECT COUNT(*) INTO conflict_count
    FROM public.data_conflicts
    WHERE lead_id = p_lead_id AND resolved = false;

    -- Lógica: +20 por fonte (max 60), -15 por conflito
    score := LEAST(source_count * 20, 60);
    
    -- Bônus se houver batimento com base local da Receita
    IF EXISTS (
        SELECT 1 FROM public.lead_data_sources 
        WHERE lead_id = p_lead_id AND source_name = 'receita_federal_local'
    ) THEN
        score := score + 20;
    END IF;

    score := GREATEST(0, LEAST(100, score - (conflict_count * 15)));
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 4. Habilitar RLS
ALTER TABLE public.cnpj_base_receita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_conflicts ENABLE ROW LEVEL SECURITY;

-- 5. Políticas
CREATE POLICY "Leitura pública cnpj_base_receita" ON public.cnpj_base_receita FOR SELECT USING (true);
CREATE POLICY "Leitura autenticada data_conflicts" ON public.data_conflicts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin pode gerenciar conflitos" ON public.data_conflicts FOR ALL TO authenticated USING (true);
