-- Create user_sales_profile table
CREATE TABLE IF NOT EXISTS public.user_sales_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    preferred_tone TEXT DEFAULT 'natural',
    preferred_intensity TEXT DEFAULT 'medium',
    preferred_size TEXT DEFAULT 'medium',
    preferred_cta TEXT DEFAULT 'pergunta leve',
    preferred_channels TEXT[] DEFAULT ARRAY['whatsapp'],
    top_triggers TEXT[] DEFAULT ARRAY[]::TEXT[],
    avg_message_length INTEGER DEFAULT 0,
    messages_sent_count INTEGER DEFAULT 0,
    messages_edited_count INTEGER DEFAULT 0,
    success_rate_by_channel JSONB DEFAULT '{}'::JSONB,
    success_rate_by_trigger JSONB DEFAULT '{}'::JSONB,
    learning_paused BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_sales_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sales profile" ON public.user_sales_profile
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create ai_adaptive_learning table to track granular actions
CREATE TABLE IF NOT EXISTS public.ai_adaptive_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    lead_id UUID REFERENCES public.leads_import(id),
    action_type TEXT NOT NULL, -- 'generate', 'edit', 'copy', 'send', 'outcome_mark', 'skip', 'postpone'
    original_data JSONB,
    final_data JSONB,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_adaptive_learning ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own learning data" ON public.ai_adaptive_learning
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own learning data" ON public.ai_adaptive_learning
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create winner_messages table
CREATE TABLE IF NOT EXISTS public.winner_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    message_content TEXT NOT NULL,
    channel TEXT,
    niche TEXT,
    lead_score INTEGER,
    trigger_used TEXT,
    outcome TEXT, -- 'interested', 'meeting_booked', etc.
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.winner_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own winner messages" ON public.winner_messages
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create user_style_references table for "Aprender com esta mensagem"
CREATE TABLE IF NOT EXISTS public.user_style_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    content TEXT NOT NULL,
    analysis JSONB, -- Analysis results (tone, length, directness)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_style_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own style references" ON public.user_style_references
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Update existing tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sales_pitch_history' AND COLUMN_NAME = 'edited_content') THEN
        ALTER TABLE public.sales_pitch_history ADD COLUMN edited_content TEXT;
        ALTER TABLE public.sales_pitch_history ADD COLUMN was_edited BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'leads_import' AND COLUMN_NAME = 'interaction_outcome') THEN
        ALTER TABLE public.leads_import ADD COLUMN interaction_outcome TEXT;
    END IF;
END $$;
