CREATE OR REPLACE FUNCTION public.get_buscador_metrics(
  p_cidades text[] DEFAULT NULL::text[],
  p_estados text[] DEFAULT NULL::text[],
  p_cnae_codes text[] DEFAULT NULL::text[],
  p_portes text[] DEFAULT NULL::text[],
  p_fontes text[] DEFAULT NULL::text[],
  p_search_text text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
    result JSONB;
BEGIN
    WITH filtered_leads AS (
        SELECT 
            CASE 
                WHEN porte ILIKE '%MEI%' THEN 'MEI'
                WHEN porte = '01' OR porte ILIKE '%MICRO%' OR porte = 'ME' THEN 'Micro'
                WHEN porte = '03' OR porte ILIKE '%PEQUENO%' OR porte = 'EPP' THEN 'Pequena'
                WHEN porte = '05' OR porte ILIKE '%DEMAIS%' OR porte ILIKE '%GRANDE%' OR porte ILIKE '%MATRIZ%' THEN 'Grande'
                WHEN porte ILIKE '%MÉDIA%' THEN 'Média'
                ELSE 'Micro' -- Fallback
            END as normalized_porte,
            COALESCE(NULLIF(uf, ''), 'XX') as uf,
            capital_social,
            final_score
        FROM public.leads_master_view
        WHERE 
            (p_cidades IS NULL OR cidade = ANY(p_cidades))
            AND (p_estados IS NULL OR uf = ANY(p_estados))
            AND (p_cnae_codes IS NULL OR cnae_principal = ANY(p_cnae_codes))
            AND (p_portes IS NULL OR porte = ANY(p_portes))
            AND (p_fontes IS NULL OR source = ANY(p_fontes))
            AND (p_search_text IS NULL OR (
                nome ILIKE '%' || p_search_text || '%' 
                OR cnpj ILIKE '%' || p_search_text || '%'
                OR cidade ILIKE '%' || p_search_text || '%'
            ))
    ),
    summary AS (
        SELECT 
            COUNT(*) as total_count,
            COALESCE(SUM(capital_social), 0) / 12.0 as potencial_mensal,
            AVG(final_score) as avg_score
        FROM filtered_leads
    ),
    porte_stats AS (
        SELECT COALESCE(jsonb_object_agg(normalized_porte, cnt) FILTER (WHERE normalized_porte IS NOT NULL), '{}'::jsonb) as distribuicao_porte
        FROM (
            SELECT normalized_porte, COUNT(*) as cnt
            FROM filtered_leads
            GROUP BY normalized_porte
        ) p
    ),
    geo_stats AS (
        SELECT COALESCE(jsonb_object_agg(uf, cnt) FILTER (WHERE uf IS NOT NULL), '{}'::jsonb) as distribuicao_estado
        FROM (
            SELECT uf, COUNT(*) as cnt
            FROM filtered_leads
            GROUP BY uf
            ORDER BY cnt DESC
            LIMIT 10
        ) g
    )
    SELECT 
        jsonb_build_object(
            'total', (SELECT total_count FROM summary),
            'potencial_mensal', (SELECT potencial_mensal FROM summary),
            'qualidade_score', ROUND(COALESCE((SELECT avg_score FROM summary), 0)::numeric, 1),
            'distribuicao_porte', (SELECT distribuicao_porte FROM porte_stats),
            'distribuicao_estado', (SELECT distribuicao_estado FROM geo_stats),
            'updated_at', now()
        ) INTO result;

    RETURN result;
END;
$function$;