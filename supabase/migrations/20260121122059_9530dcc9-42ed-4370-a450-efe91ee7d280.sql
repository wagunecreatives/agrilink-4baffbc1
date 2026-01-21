-- Allow farmers (even if not yet approved) to create listings
-- This fixes "new row violates row-level security policy" when a farmer tries to add a product.

DROP POLICY IF EXISTS "Approved farmers can create listings" ON public.market_listings;

CREATE POLICY "Farmers can create listings"
ON public.market_listings
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'farmer'::app_role)
  AND seller_id = auth.uid()
);
