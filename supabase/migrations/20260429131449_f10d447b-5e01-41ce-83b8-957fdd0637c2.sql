-- Create prospect_leads table
CREATE TABLE IF NOT EXISTS public.prospect_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    niche TEXT,
    city TEXT,
    status TEXT,
    opportunity_score INTEGER,
    opportunity_level TEXT,
    diagnosis TEXT,
    source TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prospect_leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own leads" 
ON public.prospect_leads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own leads" 
ON public.prospect_leads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.prospect_leads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.prospect_leads FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospect_leads_updated_at
    BEFORE UPDATE ON public.prospect_leads
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
