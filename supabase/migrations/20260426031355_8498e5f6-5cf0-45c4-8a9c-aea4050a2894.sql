-- Evoluir Oportunidades Comerciais com Insights de Negócio
ALTER TABLE public.commercial_opportunities 
ADD COLUMN IF NOT EXISTS commercial_insight TEXT,
ADD COLUMN IF NOT EXISTS financial_impact_reason TEXT,
ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'educational'; -- 'direct', 'consultative', 'educational'

-- Atualizar metadados para suportar múltiplos canais de venda
ALTER TABLE public.sales_pitch_history
ADD COLUMN IF NOT EXISTS pitch_variation TEXT DEFAULT 'standard'; -- 'closing', 'initial', 'educational'
