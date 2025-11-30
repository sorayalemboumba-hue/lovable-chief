-- Create applications table for storing job offers and applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise TEXT NOT NULL,
  poste TEXT NOT NULL,
  lieu TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('à compléter', 'en cours', 'soumise', 'entretien')),
  priorite INTEGER NOT NULL DEFAULT 1 CHECK (priorite >= 1 AND priorite <= 5),
  keywords TEXT,
  notes TEXT,
  url TEXT,
  contacts JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type TEXT CHECK (type IN ('standard', 'spontanée', 'recommandée')),
  referent TEXT,
  compatibility INTEGER CHECK (compatibility >= 0 AND compatibility <= 100),
  missing_requirements JSONB DEFAULT '[]'::jsonb,
  matching_skills JSONB DEFAULT '[]'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own applications"
ON public.applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
ON public.applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
ON public.applications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
ON public.applications
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_statut ON public.applications(statut);
CREATE INDEX idx_applications_deadline ON public.applications(deadline);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);