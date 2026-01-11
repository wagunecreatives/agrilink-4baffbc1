-- Drop the view entirely - we don't need it since we have proper RLS policies
DROP VIEW IF EXISTS public.market_listings_public;

-- Also drop the function that was created but isn't being used
DROP FUNCTION IF EXISTS public.get_listing_with_seller(uuid);