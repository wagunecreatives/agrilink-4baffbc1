import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, ApprovalStatus } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  /** True while we are determining if there is a session (initial app load / auth change). */
  isAuthLoading: boolean;
  /** True while fetching profile + roles for the current user. */
  isUserDataLoading: boolean;
  isApprovedFarmer: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(false);

  // Prevent duplicate profile/role fetches on initial load (getSession + INITIAL_SESSION)
  const userDataPromiseRef = useRef<Promise<void> | null>(null);

  async function fetchUserData(userId: string) {
    // Fetch profile + roles in parallel to minimize perceived load time
    const [profileRes, rolesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, approval_status, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (rolesRes.error) throw rolesRes.error;

    setProfile(profileRes.data);
    setRoles(rolesRes.data?.map((r) => r.role as UserRole) || []);
  }

  const ensureUserData = useCallback((userId: string) => {
    if (userDataPromiseRef.current) return userDataPromiseRef.current;

    setIsUserDataLoading(true);
    userDataPromiseRef.current = fetchUserData(userId)
      .catch((error) => {
        console.error('Error fetching user data:', error);
      })
      .finally(() => {
        userDataPromiseRef.current = null;
        setIsUserDataLoading(false);
      });

    return userDataPromiseRef.current;
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listen for auth changes (set up BEFORE getSession)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      if (session?.user) {
        await ensureUserData(session.user.id);
      } else {
        userDataPromiseRef.current = null;
        setProfile(null);
        setRoles([]);
        setIsUserDataLoading(false);
      }
    });

    // Get initial session (deduped with INITIAL_SESSION via ensureUserData)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      if (session?.user) {
        void ensureUserData(session.user.id);
      } else {
        setIsUserDataLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [ensureUserData]);


  async function signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) console.error('Sign-in error:', error);
    return { error };
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole) {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      console.error('Sign-up error:', error);
      return { error };
    }

    // If signup didn't actually create a user, treat as an error so the UI doesn't claim success.
    if (!data?.user) {
      return { error: new Error('Signup did not complete. Please try again.') };
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setIsAuthLoading(false);
    setIsUserDataLoading(false);
  }

  function hasRole(role: UserRole) {
    return roles.includes(role);
  }

  const isApprovedFarmer = 
    roles.includes('farmer') && profile?.approval_status === 'approved';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isAuthLoading,
        isUserDataLoading,
        isApprovedFarmer,
        signIn,
        signUp,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
