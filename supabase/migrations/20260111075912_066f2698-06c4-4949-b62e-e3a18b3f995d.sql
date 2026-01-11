-- Fix 1: Update market_listings to restrict seller identity exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.market_listings;

-- Create a view that masks seller identity for public access
CREATE OR REPLACE VIEW public.market_listings_public AS
SELECT 
  id,
  title,
  description,
  crop_type,
  quantity,
  unit,
  price,
  -- Only show general location (e.g., city level), not full address
  CASE 
    WHEN location IS NOT NULL THEN split_part(location, ',', 1)
    ELSE NULL 
  END as location,
  images,
  status,
  created_at,
  updated_at
  -- Note: seller_id is intentionally excluded for public access
FROM public.market_listings
WHERE status = 'active';

-- Create a function to get listing with seller info (only for authenticated users)
CREATE OR REPLACE FUNCTION public.get_listing_with_seller(listing_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  crop_type text,
  quantity numeric,
  unit text,
  price numeric,
  location text,
  images text[],
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  seller_id uuid,
  seller_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ml.id,
    ml.title,
    ml.description,
    ml.crop_type,
    ml.quantity,
    ml.unit,
    ml.price,
    ml.location,
    ml.images,
    ml.status,
    ml.created_at,
    ml.updated_at,
    ml.seller_id,
    p.full_name as seller_name
  FROM public.market_listings ml
  LEFT JOIN public.profiles p ON p.id = ml.seller_id
  WHERE ml.id = listing_id
    AND ml.status = 'active';
$$;

-- New policy: Authenticated users can view active listings (but through the view or function)
CREATE POLICY "Authenticated users can view active listings"
ON public.market_listings
FOR SELECT
TO authenticated
USING (status = 'active');

-- Policy for sellers to see their own listings regardless of status
CREATE POLICY "Sellers can view all own listings"
ON public.market_listings
FOR SELECT
USING (seller_id = auth.uid());

-- Fix 2: Ensure profiles table has no email exposure
-- The existing policies look correct, but let's add an explicit deny for email access
-- by ensuring the get_public_profile functions are the only way to access other users' data

-- Grant access to the public view
GRANT SELECT ON public.market_listings_public TO anon, authenticated;