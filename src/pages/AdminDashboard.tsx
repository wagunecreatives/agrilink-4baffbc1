import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Shield, UserCheck, UserX, UserPlus, Search } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { UserRole, ApprovalStatus } from '@/types/database';

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
}

export default function AdminDashboard() {
  const { hasRole, isLoading: authLoading, user } = useAuth();
  const [pendingFarmers, setPendingFarmers] = useState<PendingFarmer[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (!authLoading && isAdmin) {
      setIsLoading(true);
      Promise.all([fetchPendingFarmers(), fetchUsers()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [authLoading, isAdmin]);

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
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as UserRole),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  }

  async function handleApproval(farmerId: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: status })
        .eq('id', farmerId);

      if (error) throw error;

      toast.success(`Farmer ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchPendingFarmers();
    } catch (error) {
      console.error('Error updating approval status:', error);
      toast.error('Failed to update approval status');
    }
  }

  async function handleAddRole() {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select a user and role');
      return;
    }

    setIsAddingRole(true);
    try {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('role', selectedRole)
        .maybeSingle();

      if (existingRole) {
        toast.error('User already has this role');
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser, role: selectedRole });

      if (error) throw error;

      toast.success(`Role "${selectedRole}" added successfully`);
      setDialogOpen(false);
      setSelectedUser('');
      fetchUsers();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    } finally {
      setIsAddingRole(false);
    }
  }

  async function handleRemoveRole(userId: string, role: UserRole) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast.success(`Role "${role}" removed successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    }
  }

  if (authLoading) {
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

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <p className="text-muted-foreground">Manage farmers and user roles</p>
            </div>
          </div>

          {/* Pending Farmer Approvals */}
          <Card className="mb-8 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Pending Farmer Approvals
              </CardTitle>
              <CardDescription>
                Review and approve farmer registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingFarmers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFarmers.map((farmer) => (
                      <TableRow key={farmer.id}>
                        <TableCell className="font-medium">
                          {farmer.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{farmer.email || '-'}</TableCell>
                        <TableCell>
                          {new Date(farmer.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproval(farmer.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(farmer.id, 'rejected')}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* User Role Management */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    User Role Management
                  </CardTitle>
                  <CardDescription>Assign or remove roles from users</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Role to User</DialogTitle>
                      <DialogDescription>
                        Select a user and the role you want to assign.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>User</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name || user.email || user.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="farmer">Farmer</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddRole} disabled={isAddingRole}>
                        {isAddingRole && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Assign Role
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-muted-foreground text-sm">No roles</span>
                          ) : (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === 'admin' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {role}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {user.roles.map((role) => (
                            <Button
                              key={role}
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveRole(user.id, role)}
                            >
                              Remove {role}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Instructions for first admin */}
          <Card className="mt-8 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Setting Up the First Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                To create the first admin user, you need to manually insert a record into the{' '}
                <code className="bg-muted px-1 rounded">user_roles</code> table using SQL:
              </p>
              <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'your-email@example.com';`}
              </pre>
              <p>Replace <code className="bg-muted px-1 rounded">your-email@example.com</code> with the email of the user you want to make an admin.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
