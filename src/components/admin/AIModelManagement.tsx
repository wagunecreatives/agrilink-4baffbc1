import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { 
  Loader2, 
  Brain, 
  Plus, 
  Activity, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

interface AIModelConfig {
  id: string;
  model_name: string;
  model_id: string;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface DiagnosisLog {
  id: string;
  user_id: string | null;
  model_used: string;
  diagnosis_result: string | null;
  confidence_level: string | null;
  status: string;
  created_at: string;
}

export function AIModelManagement() {
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [diagnosisLogs, setDiagnosisLogs] = useState<DiagnosisLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newModel, setNewModel] = useState({
    model_name: '',
    model_id: '',
    description: '',
  });

  useEffect(() => {
    fetchModels();
    fetchDiagnosisLogs();
  }, []);

  async function fetchModels() {
    try {
      const { data, error } = await supabase
        .from('ai_model_config')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
      toast.error('Failed to fetch AI models');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDiagnosisLogs() {
    try {
      const { data, error } = await supabase
        .from('diagnosis_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDiagnosisLogs(data || []);
    } catch (error) {
      console.error('Error fetching diagnosis logs:', error);
    }
  }

  async function handleToggleActive(model: AIModelConfig) {
    try {
      // If activating this model, deactivate others
      if (!model.is_active) {
        await supabase
          .from('ai_model_config')
          .update({ is_active: false })
          .neq('id', model.id);
      }

      const { error } = await supabase
        .from('ai_model_config')
        .update({ is_active: !model.is_active, updated_at: new Date().toISOString() })
        .eq('id', model.id);

      if (error) throw error;

      toast.success(`Model ${!model.is_active ? 'activated' : 'deactivated'}`);
      fetchModels();
    } catch (error) {
      console.error('Error updating model:', error);
      toast.error('Failed to update model');
    }
  }

  async function handleAddModel() {
    if (!newModel.model_name || !newModel.model_id) {
      toast.error('Please fill in model name and ID');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('ai_model_config')
        .insert({
          model_name: newModel.model_name,
          model_id: newModel.model_id,
          description: newModel.description || null,
          is_active: false,
        });

      if (error) throw error;

      toast.success('Model added successfully');
      setAddDialogOpen(false);
      setNewModel({ model_name: '', model_id: '', description: '' });
      fetchModels();
    } catch (error) {
      console.error('Error adding model:', error);
      toast.error('Failed to add model');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteModel(modelId: string) {
    try {
      const { error } = await supabase
        .from('ai_model_config')
        .delete()
        .eq('id', modelId);

      if (error) throw error;

      toast.success('Model removed');
      fetchModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Failed to delete model');
    }
  }

  const activeModel = models.find(m => m.is_active);
  const totalDiagnoses = diagnosisLogs.length;
  const successfulDiagnoses = diagnosisLogs.filter(d => d.status === 'completed').length;
  const todayDiagnoses = diagnosisLogs.filter(d => {
    const today = new Date().toDateString();
    return new Date(d.created_at).toDateString() === today;
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeModel?.model_name || 'None'}</p>
                <p className="text-sm text-muted-foreground">Active Model</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDiagnoses}</p>
                <p className="text-sm text-muted-foreground">Total Diagnoses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayDiagnoses}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalDiagnoses > 0 ? Math.round((successfulDiagnoses / totalDiagnoses) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Configuration */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                AI Model Configuration
              </CardTitle>
              <CardDescription>
                Configure and manage AI models for crop disease diagnosis
              </CardDescription>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add AI Model</DialogTitle>
                  <DialogDescription>
                    Add a new AI model configuration for disease diagnosis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Model Name</Label>
                    <Input
                      value={newModel.model_name}
                      onChange={(e) => setNewModel({ ...newModel, model_name: e.target.value })}
                      placeholder="e.g., Gemini 2.5 Flash"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model ID</Label>
                    <Input
                      value={newModel.model_id}
                      onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                      placeholder="e.g., google/gemini-2.5-flash"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newModel.description}
                      onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                      placeholder="Brief description of the model's capabilities"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddModel} disabled={isAdding}>
                    {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Model
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.model_name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{model.model_id}</code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {model.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={model.is_active}
                        onCheckedChange={() => handleToggleActive(model)}
                      />
                      <Badge variant={model.is_active ? 'default' : 'secondary'}>
                        {model.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteModel(model.id)}
                      disabled={model.is_active}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Diagnosis Logs */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Diagnosis Logs
          </CardTitle>
          <CardDescription>
            Monitor AI diagnosis activity and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {diagnosisLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No diagnosis logs yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Model Used</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnosisLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-xs">{log.model_used}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.confidence_level || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="capitalize">{log.status}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
