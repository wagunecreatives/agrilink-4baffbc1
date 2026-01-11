-- Add policy to allow anyone (including anonymous users) to view active listings
CREATE POLICY "Anyone can view active listings"
ON public.market_listings
FOR SELECT
TO anon, authenticated
USING (status = 'active');