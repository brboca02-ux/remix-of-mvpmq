-- Tabela de Histórico de Abordagens Comerciais
CREATE TABLE IF NOT EXISTS public.sales_pitch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.commercial_opportunities(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'whatsapp', 'email', 'direct', 'consultative'
    message_content TEXT NOT NULL,
    detected_problems TEXT[],
    presence_score FLOAT,
    meta_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.sales_pitch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for auth users on sales pitches" ON public.sales_pitch_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for auth users on sales pitches" ON public.sales_pitch_history FOR INSERT TO authenticated WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_pitch_lead ON public.sales_pitch_history(lead_id);
