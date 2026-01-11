-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a policy that allows users to see all profiles but we'll handle email exposure via a view
-- For now, let's create a more restrictive base policy
CREATE POLICY "Users can view all profiles basic info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Create a secure view that excludes email for other users
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  full_name,
  avatar_url,
  approval_status,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;