-- Drop the security definer view and use a regular view instead
DROP VIEW IF EXISTS public.market_listings_public;

-- Create a regular view (not security definer) that masks seller identity
CREATE VIEW public.market_listings_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  crop_type,
  quantity,
  unit,
  price,
  CASE 
    WHEN location IS NOT NULL THEN split_part(location, ',', 1)
    ELSE NULL 
  END as location,
  images,
  status,
  created_at,
  updated_at
FROM public.market_listings
WHERE status = 'active';

-- Grant access to the view
GRANT SELECT ON public.market_listings_public TO anon, authenticated;