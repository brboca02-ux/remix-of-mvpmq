-- Create prospect_audit_logs table
CREATE TABLE IF NOT EXISTS public.prospect_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    action TEXT NOT NULL,
    source TEXT NOT NULL,
    changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prospect_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own audit logs" 
ON public.prospect_audit_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs" 
ON public.prospect_audit_logs FOR SELECT 
USING (auth.uid() = user_id);
