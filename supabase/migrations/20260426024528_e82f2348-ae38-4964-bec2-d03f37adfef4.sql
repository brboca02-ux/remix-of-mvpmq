CREATE OR REPLACE FUNCTION public.get_most_common_import_errors(p_job_id UUID)
RETURNS TABLE (error_message TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT lie.error_message, COUNT(*) as count
    FROM public.lead_import_errors lie
    WHERE lie.job_id = p_job_id
    GROUP BY lie.error_message
    ORDER BY count DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SET search_path = public;
