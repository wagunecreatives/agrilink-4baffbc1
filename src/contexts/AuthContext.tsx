import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isAuthLoading: boolean;
  isUserDataLoading: boolean;
  isApprovedFarmer: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string,
    location?: string
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

  const userDataPromiseRef = useRef<Promise<void> | null>(null);

  // =========================
  // FETCH USER DATA (PROFILE + ROLES)
  // =========================
  async function fetchUserData(userId: string) {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (rolesRes.error) throw rolesRes.error;

    // 🚨 CRITICAL: if profile is missing → treat as deleted user
    if (!profileRes.data) {
      throw new Error('Profile not found (user deleted or disabled)');
    }

    setProfile(profileRes.data);
    setRoles(rolesRes.data?.map((r) => r.role as UserRole) || []);
  }

  const ensureUserData = useCallback((userId: string) => {
    if (userDataPromiseRef.current) return userDataPromiseRef.current;

    setIsUserDataLoading(true);

    userDataPromiseRef.current = fetchUserData(userId)
      .catch(async (error) => {
        console.error('User access blocked:', error.message);

        // 🚨 FORCE LOGOUT if profile is missing/deleted
        await supabase.auth.signOut();

        setUser(null);
        setSession(null);
        setProfile(null);
        setRoles([]);
      })
      .finally(() => {
        userDataPromiseRef.current = null;
        setIsUserDataLoading(false);
      });

    return userDataPromiseRef.current;
  }, []);

  // =========================
  // AUTH LISTENER
  // =========================
  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      if (session?.user) {
        ensureUserData(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      if (session?.user) {
        ensureUserData(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [ensureUserData]);

  // =========================
  // SIGN IN (BLOCK DELETED USERS)
  // =========================
  async function signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) return { error };

    // 🚨 VERIFY PROFILE EXISTS
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();

      return {
        error: new Error('Account deleted or disabled'),
      };
    }

    return { error: null };
  }

  // =========================
  // SIGN UP
  // =========================
  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string,
    location?: string
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone: phone || null,
          location: location || null,
        },
      },
    });

    return { error };
  }

  // =========================
  // SIGN OUT
  // =========================
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  }

  function hasRole(role: UserRole) {
    return roles.includes(role);
  }

  // =========================
  // FARMER APPROVAL CHECK
  // =========================
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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}