-- Expand sales_pitch_history with revenue and reply details
ALTER TABLE public.sales_pitch_history 
ADD COLUMN IF NOT EXISTS reply_type TEXT CHECK (reply_type IN ('interessado', 'neutro', 'negativo')),
ADD COLUMN IF NOT EXISTS revenue_generated NUMERIC(15,2) DEFAULT 0;

-- Create channel performance tracking
CREATE TABLE IF NOT EXISTS public.channel_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    niche TEXT,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_replied INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,
    total_revenue NUMERIC(15,2) DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on channel_performance
ALTER TABLE public.channel_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for auth users on channel_performance" 
ON public.channel_performance FOR SELECT 
TO authenticated 
USING (true);

-- Function to update channel performance automatically
CREATE OR REPLACE FUNCTION public.update_channel_performance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.channel_performance (channel, total_sent, updated_at)
    VALUES (NEW.channel, 1, now())
    ON CONFLICT (id) DO NOTHING; -- This is a simplified version, usually we'd aggregate
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- View for sales efficiency
CREATE OR REPLACE VIEW public.sales_efficiency_analytics AS
SELECT 
    channel,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE replied = true) as replies,
    COUNT(*) FILTER (WHERE converted = true) as conversions,
    SUM(revenue_generated) as total_revenue,
    AVG(response_time_ms) as avg_response_time,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            ((COUNT(*) FILTER (WHERE replied = true) * 2) + (COUNT(*) FILTER (WHERE converted = true) * 5))::float / COUNT(*) 
        ELSE 0 
    END as efficiency_score
FROM public.sales_pitch_history
GROUP BY channel;

-- Add tracking fields to followup
ALTER TABLE public.sales_followup_sequences
ADD COLUMN IF NOT EXISTS preferred_channel TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_pitch_performance ON public.sales_pitch_history (channel, replied, converted);
