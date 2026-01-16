import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { toast } from 'sonner';
import { Loader2, UserCheck, UserX, UserPlus, Search, Edit, Ban, CheckCircle } from 'lucide-react';
import { ApprovalStatus } from '@/types/database';

interface PendingFarmer {
  id: string;
  email: string | null;
  full_name: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
}

interface Farmer {
  id: string;
  email: string | null;
  full_name: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
}

interface FarmerManagementProps {
  pendingFarmers: PendingFarmer[];
  onRefresh: () => void;
}

export function FarmerManagement({ pendingFarmers, onRefresh }: FarmerManagementProps) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  async function fetchAllFarmers() {
    setIsLoading(true);
    try {
      // Get all users with farmer role
      const { data: farmerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'farmer');

      if (rolesError) throw rolesError;

      if (!farmerRoles || farmerRoles.length === 0) {
        setFarmers([]);
        return;
      }

      const farmerIds = farmerRoles.map(r => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, approval_status, created_at')
        .in('id', farmerIds);

      if (profilesError) throw profilesError;
      setFarmers(profiles || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to fetch farmers');
    } finally {
      setIsLoading(false);
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
      onRefresh();
      fetchAllFarmers();
    } catch (error) {
      console.error('Error updating approval status:', error);
      toast.error('Failed to update approval status');
    }
  }

  async function handleRegisterFarmer() {
    if (!newFarmer.email || !newFarmer.password || !newFarmer.fullName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsRegistering(true);
    try {
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: newFarmer.email,
        password: newFarmer.password,
        options: {
          data: {
            full_name: newFarmer.fullName,
            role: 'farmer',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Auto-approve since admin is registering
        await supabase
          .from('profiles')
          .update({ approval_status: 'approved' })
          .eq('id', data.user.id);
      }

      toast.success('Farmer registered successfully');
      setRegisterDialogOpen(false);
      setNewFarmer({ email: '', password: '', fullName: '' });
      onRefresh();
      fetchAllFarmers();
    } catch (error: any) {
      console.error('Error registering farmer:', error);
      toast.error(error.message || 'Failed to register farmer');
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleUpdateFarmer() {
    if (!selectedFarmer) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: selectedFarmer.full_name })
        .eq('id', selectedFarmer.id);

      if (error) throw error;

      toast.success('Farmer updated successfully');
      setEditDialogOpen(false);
      setSelectedFarmer(null);
      fetchAllFarmers();
    } catch (error) {
      console.error('Error updating farmer:', error);
      toast.error('Failed to update farmer');
    }
  }

  async function handleDeactivateFarmer(farmerId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'rejected' })
        .eq('id', farmerId);

      if (error) throw error;

      toast.success('Farmer account deactivated');
      fetchAllFarmers();
    } catch (error) {
      console.error('Error deactivating farmer:', error);
      toast.error('Failed to deactivate farmer');
    }
  }

  async function handleActivateFarmer(farmerId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', farmerId);

      if (error) throw error;

      toast.success('Farmer account activated');
      fetchAllFarmers();
    } catch (error) {
      console.error('Error activating farmer:', error);
      toast.error('Failed to activate farmer');
    }
  }

  const filteredFarmers = farmers.filter(
    (f) =>
      f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card className="shadow-soft">
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

      {/* Register & Manage Farmers */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Farmer Accounts
              </CardTitle>
              <CardDescription>Register new farmers or manage existing accounts</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAllFarmers} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Farmers'}
              </Button>
              <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register Farmer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Register New Farmer</DialogTitle>
                    <DialogDescription>
                      Create a new farmer account. The account will be auto-approved.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={newFarmer.fullName}
                        onChange={(e) => setNewFarmer({ ...newFarmer, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newFarmer.email}
                        onChange={(e) => setNewFarmer({ ...newFarmer, email: e.target.value })}
                        placeholder="farmer@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newFarmer.password}
                        onChange={(e) => setNewFarmer({ ...newFarmer, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRegisterFarmer} disabled={isRegistering}>
                      {isRegistering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Register
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {farmers.length > 0 && (
            <>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search farmers..."
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
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarmers.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-medium">
                        {farmer.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{farmer.email || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={farmer.approval_status === 'approved' ? 'default' : 'secondary'}
                          className={
                            farmer.approval_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : farmer.approval_status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : ''
                          }
                        >
                          {farmer.approval_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(farmer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedFarmer(farmer);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {farmer.approval_status === 'approved' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeactivateFarmer(farmer.id)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleActivateFarmer(farmer.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {farmers.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Click "Load Farmers" to view all farmer accounts</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Farmer</DialogTitle>
            <DialogDescription>Update farmer information</DialogDescription>
          </DialogHeader>
          {selectedFarmer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={selectedFarmer.full_name || ''}
                  onChange={(e) =>
                    setSelectedFarmer({ ...selectedFarmer, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedFarmer.email || ''} disabled />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFarmer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
