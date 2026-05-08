-- Adicionar colunas para personalização de site na tabela leads_analysis
ALTER TABLE public.leads_analysis 
ADD COLUMN IF NOT EXISTS maps_text TEXT,
ADD COLUMN IF NOT EXISTS instagram_bio TEXT,
ADD COLUMN IF NOT EXISTS instagram_posts TEXT,
ADD COLUMN IF NOT EXISTS target_tone TEXT,
ADD COLUMN IF NOT EXISTS extracted_features JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS site_sections JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.leads_analysis.maps_text IS 'Conteúdo bruto copiado do Google Maps';
COMMENT ON COLUMN public.leads_analysis.instagram_bio IS 'Bio do perfil do Instagram';
COMMENT ON COLUMN public.leads_analysis.instagram_posts IS 'Legendas e posts do Instagram';
COMMENT ON COLUMN public.leads_analysis.target_tone IS 'Tom de voz: premium, popular, tecnico, consultivo, luxo, local';
COMMENT ON COLUMN public.leads_analysis.extracted_features IS 'Dados extraídos via IA: serviços, diferenciais, etc';
COMMENT ON COLUMN public.leads_analysis.site_sections IS 'Conteúdo das seções do site para edição';
