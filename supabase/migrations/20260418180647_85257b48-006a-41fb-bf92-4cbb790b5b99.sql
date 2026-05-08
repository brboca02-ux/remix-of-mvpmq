-- Cache persistente de empresas + queries para o /buscador
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.empresas_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text UNIQUE,
  place_id text UNIQUE,
  nome text NOT NULL,
  nome_fantasia text,
  site text,
  cidade text,
  uf text,
  nicho text,
  telefone text,
  email text,
  latitude numeric,
  longitude numeric,
  rating numeric,
  user_ratings_total int,
  source text NOT NULL DEFAULT 'places',
  raw_places jsonb,
  raw_brasilapi jsonb,
  data_fresh timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_empresas_cache_cidade_uf_nicho ON public.empresas_cache (cidade, uf, nicho);
CREATE INDEX idx_empresas_cache_nome_trgm ON public.empresas_cache USING gin (nome gin_trgm_ops);
CREATE INDEX idx_empresas_cache_data_fresh ON public.empresas_cache (data_fresh DESC);

CREATE TABLE public.pesquisas_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text UNIQUE NOT NULL,
  query_text text,
  cidade text,
  uf text,
  nicho text,
  result_cnpjs text[] NOT NULL DEFAULT '{}',
  result_place_ids text[] NOT NULL DEFAULT '{}',
  total_count int NOT NULL DEFAULT 0,
  hit_count int NOT NULL DEFAULT 1,
  last_hit_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pesquisas_cache_last_hit ON public.pesquisas_cache (last_hit_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_empresas_cache_updated_at
BEFORE UPDATE ON public.empresas_cache
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: leitura pública (app sem auth), escrita só via service role
ALTER TABLE public.empresas_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesquisas_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresas_cache public read"
  ON public.empresas_cache FOR SELECT
  USING (true);

CREATE POLICY "pesquisas_cache public read"
  ON public.pesquisas_cache FOR SELECT
  USING (true);
-- INSERT/UPDATE/DELETE: somente service role (usado em server functions); sem policies = bloqueado para anon/authenticated