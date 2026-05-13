CREATE OR REPLACE FUNCTION public.increment_import_job_stats(
    p_job_id UUID,
    p_processed INT,
    p_success INT,
    p_failed INT,
    p_duplicate INT,
    p_new_status TEXT DEFAULT NULL,
    p_source_stats JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE public.lead_import_jobs
    SET 
        processed_rows = COALESCE(processed_rows, 0) + p_processed,
        success_rows = COALESCE(success_rows, 0) + p_success,
        failed_rows = COALESCE(failed_rows, 0) + p_failed,
        duplicate_rows = COALESCE(duplicate_rows, 0) + p_duplicate,
        status = COALESCE(p_new_status, status),
        source_stats = CASE 
            WHEN p_source_stats IS NOT NULL THEN (
                SELECT jsonb_object_agg(key, COALESCE((source_stats->>key)::int, 0) + (p_source_stats->>key)::int)
                FROM (
                    SELECT key FROM jsonb_object_keys(source_stats)
                    UNION
                    SELECT key FROM jsonb_object_keys(p_source_stats)
                ) keys(key)
            )
            ELSE source_stats
        END,
        last_heartbeat = now(),
        finished_at = CASE WHEN p_new_status IN ('completed', 'failed', 'partial') THEN now() ELSE finished_at END
    WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;