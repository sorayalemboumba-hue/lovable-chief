-- Create storage bucket for original job offers
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-offers', 'job-offers', false);

-- RLS policies for job-offers bucket
CREATE POLICY "Users can upload their own offers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-offers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own offers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-offers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own offers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-offers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add columns to applications table for storing original offer info
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS original_offer_url text,
ADD COLUMN IF NOT EXISTS publication_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS application_email text,
ADD COLUMN IF NOT EXISTS application_instructions text,
ADD COLUMN IF NOT EXISTS required_documents text[];