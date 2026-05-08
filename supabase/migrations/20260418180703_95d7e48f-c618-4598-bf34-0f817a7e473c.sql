-- Mover pg_trgm para schema extensions (boa prática Supabase)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP INDEX IF EXISTS public.idx_empresas_cache_nome_trgm;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE INDEX idx_empresas_cache_nome_trgm
  ON public.empresas_cache
  USING gin (nome extensions.gin_trgm_ops);