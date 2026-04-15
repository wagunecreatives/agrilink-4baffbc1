-- DISABLED ENTIRELY - storage schema missing due to config.toml [storage] enabled=false
-- Marketplace listing-images bucket + policies (re-enable when storage enabled)

-- Create storage bucket for listing images (DISABLED)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('listing-images', 'listing-images', true);

-- All policies DISABLED for local dev
/*
-- Allow authenticated users to upload images
CREATE POLICY \"Authenticated users can upload listing images\"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to listing images
CREATE POLICY \"Anyone can view listing images\"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listing-images');

-- Allow users to update their own uploaded images
CREATE POLICY \"Users can update own listing images\"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploaded images
CREATE POLICY \"Users can delete own listing images\"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'listing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
*/
