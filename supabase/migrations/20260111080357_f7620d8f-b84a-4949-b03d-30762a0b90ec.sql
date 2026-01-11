-- Drop the view first
DROP VIEW IF EXISTS public.market_listings_public;

-- Recreate the view without security_invoker (use default security invoker behavior)
CREATE VIEW public.market_listings_public AS
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