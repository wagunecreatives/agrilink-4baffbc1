-- Fix RLS policies for market_listings - change from RESTRICTIVE to PERMISSIVE
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON market_listings;
DROP POLICY IF EXISTS "Authenticated users can view active listings" ON market_listings;
DROP POLICY IF EXISTS "Sellers can view all own listings" ON market_listings;
DROP POLICY IF EXISTS "Approved farmers can create listings" ON market_listings;
DROP POLICY IF EXISTS "Sellers can update own listings" ON market_listings;
DROP POLICY IF EXISTS "Sellers can delete own listings" ON market_listings;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Anyone can view active listings" 
ON market_listings FOR SELECT 
USING (status = 'active');

CREATE POLICY "Sellers can view all own listings" 
ON market_listings FOR SELECT 
USING (seller_id = auth.uid());

CREATE POLICY "Approved farmers can create listings" 
ON market_listings FOR INSERT 
WITH CHECK (is_approved_farmer(auth.uid()) AND seller_id = auth.uid());

CREATE POLICY "Sellers can update own listings" 
ON market_listings FOR UPDATE 
USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete own listings" 
ON market_listings FOR DELETE 
USING (seller_id = auth.uid());