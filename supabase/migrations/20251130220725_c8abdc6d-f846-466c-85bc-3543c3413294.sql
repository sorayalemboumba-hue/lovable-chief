-- Create table for user's custom coaching tips
CREATE TABLE public.coaching_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coaching_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own tips" 
ON public.coaching_tips 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tips" 
ON public.coaching_tips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tips" 
ON public.coaching_tips 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_coaching_tips_user_id ON public.coaching_tips(user_id);