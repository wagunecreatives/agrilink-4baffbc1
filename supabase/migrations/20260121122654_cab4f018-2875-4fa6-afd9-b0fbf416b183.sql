-- Fix the INSERT policy for market_listings using a direct subquery instead of the function
DROP POLICY IF EXISTS "Farmers can create listings" ON public.market_listings;

CREATE POLICY "Farmers can create listings"
ON public.market_listings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'farmer'
  )
  AND seller_id = auth.uid()
);