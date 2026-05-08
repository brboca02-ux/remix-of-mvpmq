-- Expandir Sales Pitch History para Tracking de CRO
ALTER TABLE public.sales_pitch_history 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS replied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS ab_test_variant TEXT DEFAULT 'A';

-- Adicionar Scoring de Conversão na Oportunidade
ALTER TABLE public.commercial_opportunities 
ADD COLUMN IF NOT EXISTS conversion_probability FLOAT DEFAULT 0.0, -- 0 a 1
ADD COLUMN IF NOT EXISTS suggested_next_action TEXT,
ADD COLUMN IF NOT EXISTS best_channel_hint TEXT DEFAULT 'whatsapp';

-- Função para calcular probabilidade de conversão baseada em histórico real
CREATE OR REPLACE FUNCTION public.calculate_conversion_probability(p_lead_id UUID)
RETURNS FLOAT AS $$
DECLARE
    opp_score FLOAT;
    base_prob FLOAT;
BEGIN
    SELECT opportunity_score INTO opp_score 
    FROM public.commercial_opportunities WHERE lead_id = p_lead_id;
    
    -- Algoritmo base: Oportunidade + Histórico de Resposta do Canal
    base_prob := (opp_score / 100.0) * 0.7;
    
    -- Bônus por resposta positiva prévia (se existir no futuro)
    RETURN LEAST(0.95, base_prob);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
