-- 1. Camada de Auditoria
CREATE TABLE IF NOT EXISTS public.job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.lead_import_jobs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, 
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Camada de Consistência
ALTER TABLE public.leads_import ADD COLUMN IF NOT EXISTS identity_hash TEXT;

-- Função de Hash
CREATE OR REPLACE FUNCTION public.generate_lead_identity_hash(
    p_cnpj TEXT,
    p_telefone TEXT,
    p_nome TEXT,
    p_cidade TEXT
) RETURNS TEXT AS $$
DECLARE
    v_clean_cnpj TEXT;
    v_clean_tel TEXT;
BEGIN
    v_clean_cnpj := regexp_replace(COALESCE(p_cnpj, ''), '\D', '', 'g');
    IF v_clean_cnpj <> '' AND length(v_clean_cnpj) = 14 THEN
        RETURN 'cnpj:' || v_clean_cnpj;
    END IF;

    v_clean_tel := regexp_replace(COALESCE(p_telefone, ''), '\D', '', 'g');
    IF v_clean_tel <> '' AND length(v_clean_tel) >= 10 THEN
        RETURN 'tel:' || v_clean_tel;
    END IF;

    RETURN 'name_city:' || md5(lower(trim(COALESCE(p_nome, ''))) || '|' || lower(trim(COALESCE(p_cidade, ''))));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atualizar registros
UPDATE public.leads_import 
SET identity_hash = generate_lead_identity_hash(cnpj, telefone, nome, cidade);

-- Limpar duplicados antes de criar o índice
DELETE FROM public.leads_import
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY identity_hash ORDER BY created_at DESC) as rn
        FROM public.leads_import
    ) t
    WHERE t.rn > 1
);

-- Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_identity_hash ON public.leads_import (identity_hash);

-- 3. Visão Mestra
CREATE OR REPLACE VIEW public.leads_master_view AS
SELECT 
    l.*,
    COALESCE(l.confidence_score, 0) as final_score,
    (l.enrichment_data->>'email_source') as email_provider,
    CASE 
        WHEN l.cnpj IS NOT NULL AND l.cnpj NOT LIKE 'TEMP:%' THEN true 
        ELSE false 
    END as is_verified_business
FROM public.leads_import l;

-- 4. Melhorias em Jobs
ALTER TABLE public.lead_import_jobs ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.lead_import_jobs ADD COLUMN IF NOT EXISTS worker_config JSONB DEFAULT '{"max_concurrency": 5}'::jsonb;
ALTER TABLE public.lead_import_jobs ADD COLUMN IF NOT EXISTS batch_size INTEGER DEFAULT 50;

-- 5. Recuperação
CREATE OR REPLACE FUNCTION public.recover_stuck_import_jobs()
RETURNS void AS $$
BEGIN
    UPDATE public.lead_import_jobs
    SET status = 'failed',
        error_message = 'Job detectado como travado (timeout de heartbeat)'
    WHERE status = 'processing'
      AND last_heartbeat < now() - interval '10 minutes';
      
    UPDATE public.lead_enrichment_queue
    SET status = 'pending',
        attempts = attempts + 1
    WHERE status = 'processing'
      AND updated_at < now() - interval '5 minutes'
      AND attempts < 3;
END;
$$ LANGUAGE plpgsql;

GRANT SELECT ON public.leads_master_view TO anon, authenticated;
GRANT ALL ON public.job_events TO service_role;
