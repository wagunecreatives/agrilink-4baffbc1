-- Drop the view with security definer issue
DROP VIEW IF EXISTS public.profiles_public;

-- Drop the current SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles basic info" ON public.profiles;

-- Create a policy that only allows users to see their OWN full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy that allows viewing basic info of OTHER users (without email)
-- Since RLS can't filter columns, we need to use a security definer function approach
-- Create a function to get public profile info safely
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  approval_status approval_status,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.approval_status,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- Create a function to get all public profiles (for admin, marketplace, etc.)
CREATE OR REPLACE FUNCTION public.get_all_public_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  approval_status approval_status,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.approval_status,
    p.created_at,
    p.updated_at
  FROM public.profiles p;
$$;

-- Admins should still be able to see full profiles including email
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));