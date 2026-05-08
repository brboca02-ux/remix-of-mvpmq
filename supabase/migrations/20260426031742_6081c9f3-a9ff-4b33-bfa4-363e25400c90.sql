-- Sequências de Follow-up Inteligente
CREATE TABLE IF NOT EXISTS public.sales_followup_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.commercial_opportunities(id) ON DELETE CASCADE,
    current_day INTEGER DEFAULT 0, -- D0, D1, D2, D3
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'replied'
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    next_message_at TIMESTAMP WITH TIME ZONE,
    sequence_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics de Receita e Conversão
CREATE TABLE IF NOT EXISTS public.revenue_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_date DATE DEFAULT CURRENT_DATE,
    total_hot_leads INTEGER DEFAULT 0,
    total_pitches_sent INTEGER DEFAULT 0,
    total_replies INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    top_converting_failure_type TEXT,
    revenue_impact_estimated NUMERIC DEFAULT 0,
    UNIQUE(check_date)
);

-- Evoluir Scoring de Fechamento
ALTER TABLE public.commercial_opportunities 
ADD COLUMN IF NOT EXISTS closing_probability FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS follow_up_day INTEGER DEFAULT 0;

-- RLS
ALTER TABLE public.sales_followup_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for auth users on followup" ON public.sales_followup_sequences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for auth users on revenue analytics" ON public.revenue_analytics_daily FOR SELECT TO authenticated USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_followup_next ON public.sales_followup_sequences(next_message_at) WHERE status = 'active';
