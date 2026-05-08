CREATE OR REPLACE FUNCTION public.get_buscador_metrics(
    p_cidades TEXT[] DEFAULT NULL,
    p_estados TEXT[] DEFAULT NULL,
    p_cnae_codes TEXT[] DEFAULT NULL,
    p_portes TEXT[] DEFAULT NULL,
    p_fontes TEXT[] DEFAULT NULL,
    p_search_text TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH filtered_leads AS (
        SELECT 
            porte,
            uf,
            cnae_principal,
            capital_social,
            final_score,
            source
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
    stats AS (
        SELECT 
            COUNT(*) as total_count,
            COALESCE(SUM(capital_social), 0) / 12.0 as potencial_mensal,
            AVG(final_score) as avg_score,
            jsonb_object_agg(porte, count_porte) as distribuicao_porte
        FROM (
            SELECT porte, COUNT(*) as count_porte, SUM(capital_social) as capital_social, AVG(final_score) as final_score
            FROM filtered_leads
            GROUP BY porte
        ) s
    ),
    geo_stats AS (
        SELECT jsonb_object_agg(uf, count_uf) as distribuicao_estado
        FROM (
            SELECT uf, COUNT(*) as count_uf
            FROM filtered_leads
            GROUP BY uf
            ORDER BY count_uf DESC
            LIMIT 10
        ) g
    )
    SELECT 
        jsonb_build_object(
            'total', COALESCE((SELECT total_count FROM stats), 0),
            'potencial_mensal', COALESCE((SELECT potencial_mensal FROM stats), 0),
            'qualidade_score', ROUND(COALESCE((SELECT avg_score FROM stats), 0)::numeric, 1),
            'distribuicao_porte', COALESCE((SELECT distribuicao_porte FROM stats), '{}'::jsonb),
            'distribuicao_estado', COALESCE((SELECT distribuicao_estado FROM geo_stats), '{}'::jsonb),
            'updated_at', now()
        ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
