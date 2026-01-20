-- Recreate RLS policies for market_listings with explicit schema
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.market_listings;
DROP POLICY IF EXISTS "Sellers can view all own listings" ON public.market_listings;
DROP POLICY IF EXISTS "Approved farmers can create listings" ON public.market_listings;
DROP POLICY IF EXISTS "Sellers can update own listings" ON public.market_listings;
DROP POLICY IF EXISTS "Sellers can delete own listings" ON public.market_listings;

-- Recreate policies with explicit table reference
CREATE POLICY "Anyone can view active listings" 
ON public.market_listings FOR SELECT 
USING (public.market_listings.status = 'active');

CREATE POLICY "Sellers can view all own listings" 
ON public.market_listings FOR SELECT 
USING (public.market_listings.seller_id = auth.uid());

CREATE POLICY "Approved farmers can create listings" 
ON public.market_listings FOR INSERT 
WITH CHECK (public.is_approved_farmer(auth.uid()) AND public.market_listings.seller_id = auth.uid());

CREATE POLICY "Sellers can update own listings" 
ON public.market_listings FOR UPDATE 
USING (public.market_listings.seller_id = auth.uid());

CREATE POLICY "Sellers can delete own listings" 
ON public.market_listings FOR DELETE 
USING (public.market_listings.seller_id = auth.uid());