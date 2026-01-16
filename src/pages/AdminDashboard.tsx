import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Shield, Users, Brain, Tractor } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { UserRole, ApprovalStatus } from '@/types/database';
import { FarmerManagement } from '@/components/admin/FarmerManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { AIModelManagement } from '@/components/admin/AIModelManagement';

interface PendingFarmer {
  id: string;
  email: string | null;
  full_name: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
}

interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: UserRole[];
  approval_status: string;
}

export default function AdminDashboard() {
  const { hasRole, isAuthLoading, isUserDataLoading, user } = useAuth();
  const [pendingFarmers, setPendingFarmers] = useState<PendingFarmer[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = hasRole('admin');
  const isFullyLoaded = !isAuthLoading && !isUserDataLoading;

  useEffect(() => {
    if (isFullyLoaded && isAdmin) {
      setIsLoading(true);
      Promise.all([fetchPendingFarmers(), fetchUsers()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isFullyLoaded, isAdmin]);

  async function fetchPendingFarmers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, approval_status, created_at')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingFarmers(data || []);
    } catch (error) {
      console.error('Error fetching pending farmers:', error);
      toast.error('Failed to fetch pending farmers');
    }
  }

  async function fetchUsers() {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, approval_status')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const profileRows = profiles || [];
      if (profileRows.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = profileRows.map((p) => p.id);

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      const rolesByUserId = new Map<string, UserRole[]>();
      (roles || []).forEach((r) => {
        const next = [...(rolesByUserId.get(r.user_id) ?? []), r.role as UserRole];
        rolesByUserId.set(r.user_id, next);
      });

      const usersWithRoles: UserWithRoles[] = profileRows.map((profile) => ({
        ...profile,
        approval_status: profile.approval_status || 'pending',
        roles: rolesByUserId.get(profile.id) ?? [],
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  }

  const handleRefresh = () => {
    fetchPendingFarmers();
    fetchUsers();
  };

  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage farmers, users, and AI models</p>
            </div>
          </div>

          <Tabs defaultValue="farmers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="farmers" className="flex items-center gap-2">
                <Tractor className="w-4 h-4" />
                <span className="hidden sm:inline">Farmer Management</span>
                <span className="sm:hidden">Farmers</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">User Management</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">AI Model</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="farmers">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <FarmerManagement 
                  pendingFarmers={pendingFarmers} 
                  onRefresh={handleRefresh} 
                />
              )}
            </TabsContent>

            <TabsContent value="users">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <UserManagement 
                  users={users} 
                  onRefresh={handleRefresh} 
                />
              )}
            </TabsContent>

            <TabsContent value="ai">
              <AIModelManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
