-- Adiciona campos de scoring e controle de enriquecimento
ALTER TABLE public.leads_import 
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP WITH TIME ZONE;

-- Melhora o rastreamento dos jobs
ALTER TABLE public.lead_import_jobs
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'fast',
ADD COLUMN IF NOT EXISTS eta_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_completion_at TIMESTAMP WITH TIME ZONE;

-- Cria fila de enriquecimento
CREATE TABLE IF NOT EXISTS public.lead_enrichment_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.lead_import_jobs(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para a fila
ALTER TABLE public.lead_enrichment_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Serviço pode gerenciar fila" ON public.lead_enrichment_queue FOR ALL USING (true);

-- Index para performance na fila
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status_priority ON public.lead_enrichment_queue(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_lead_id ON public.lead_enrichment_queue(lead_id);
