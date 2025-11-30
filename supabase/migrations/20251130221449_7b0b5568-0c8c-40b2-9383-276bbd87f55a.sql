-- Create table for document templates
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cv', 'lettre')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own templates" 
ON public.document_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.document_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.document_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.document_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add columns to applications table for document tracking
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS cv_template_id UUID REFERENCES public.document_templates(id),
ADD COLUMN IF NOT EXISTS letter_template_id UUID REFERENCES public.document_templates(id),
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recommended_channel TEXT,
ADD COLUMN IF NOT EXISTS ats_compliant BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX idx_document_templates_user_id ON public.document_templates(user_id);
CREATE INDEX idx_document_templates_type ON public.document_templates(type);