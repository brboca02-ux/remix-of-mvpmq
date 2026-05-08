CREATE TABLE IF NOT EXISTS public.leads_import (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'gleads_csv',
  nicho text DEFAULT 'solar',
  cnpj text NOT NULL UNIQUE,
  nome text NOT NULL,
  razao_social text,
  site text,
  telefone text,
  email text,
  cidade text,
  uf text,
  bairro text,
  cep text,
  porte text,
  atividade text,
  status text,
  capital_social numeric,
  cnae_principal text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_import_cidade_uf ON public.leads_import (cidade, uf);
CREATE INDEX IF NOT EXISTS idx_leads_import_nicho ON public.leads_import (nicho);

ALTER TABLE public.leads_import ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_import public read"
  ON public.leads_import FOR SELECT
  USING (true);

CREATE POLICY "leads_import public insert"
  ON public.leads_import FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER trg_leads_import_updated_at
  BEFORE UPDATE ON public.leads_import
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();