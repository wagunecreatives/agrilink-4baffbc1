-- Add phone and location columns to profiles table for enhanced user data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number for contact';
COMMENT ON COLUMN public.profiles.location IS 'User location/address';