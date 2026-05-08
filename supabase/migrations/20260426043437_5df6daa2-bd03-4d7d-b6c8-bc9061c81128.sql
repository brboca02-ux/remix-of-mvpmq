-- Adicionar confidence_score se não existir
ALTER TABLE public.leads_import ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0;

-- Trigger para atualizar score de confiança automaticamente
CREATE OR REPLACE FUNCTION public.trg_update_lead_confidence()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.leads_import 
    SET confidence_score = public.calculate_lead_confidence(
        CASE 
            WHEN TG_TABLE_NAME = 'lead_data_sources' THEN NEW.lead_id 
            ELSE NEW.lead_id 
        END
    ),
    updated_at = now()
    WHERE id = (CASE WHEN TG_TABLE_NAME = 'lead_data_sources' THEN NEW.lead_id ELSE NEW.lead_id END);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_confidence_on_source ON public.lead_data_sources;
CREATE TRIGGER update_confidence_on_source
AFTER INSERT OR UPDATE ON public.lead_data_sources
FOR EACH ROW EXECUTE FUNCTION public.trg_update_lead_confidence();

DROP TRIGGER IF EXISTS update_confidence_on_conflict ON public.data_conflicts;
CREATE TRIGGER update_confidence_on_conflict
AFTER INSERT OR UPDATE OR DELETE ON public.data_conflicts
FOR EACH ROW EXECUTE FUNCTION public.trg_update_lead_confidence();

-- Garantir unicidade no cache de API
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'public_api_cache_api_key_key') THEN
        ALTER TABLE public.public_api_cache ADD CONSTRAINT public_api_cache_api_key_key UNIQUE (api_key);
    END IF;
END $$;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_leads_import_identity_hash ON public.leads_import(identity_hash);
CREATE INDEX IF NOT EXISTS idx_leads_import_confidence ON public.leads_import(confidence_score);
CREATE INDEX IF NOT EXISTS idx_data_conflicts_lead_id ON public.data_conflicts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_data_sources_lead_id ON public.lead_data_sources(lead_id);

-- Ajuste de RLS para lead_data_sources se necessário
ALTER TABLE public.lead_data_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública lead_data_sources" ON public.lead_data_sources;
CREATE POLICY "Leitura pública lead_data_sources" ON public.lead_data_sources FOR SELECT USING (true);
DROP POLICY IF EXISTS "Inserção sistema lead_data_sources" ON public.lead_data_sources;
CREATE POLICY "Inserção sistema lead_data_sources" ON public.lead_data_sources FOR INSERT WITH CHECK (true);
