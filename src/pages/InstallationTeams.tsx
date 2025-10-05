import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, CreditCard as Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/Layout/MainLayout';
import { MultiSelect } from '@/components/ui/multi-select';

interface InstallationTeam {
  id: string;
  team_name: string;
  sizes: string[];
  created_at: string;
  updated_at: string;
}

export default function InstallationTeams() {
  const [teams, setTeams] = useState<InstallationTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<InstallationTeam | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    team_name: '',
    sizes: [] as string[]
  });
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  const loadAvailableSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('billboards')
        .select('Size')
        .not('Size', 'is', null);

      if (error) throw error;

      const uniqueSizes = [...new Set(data.map(item => String(item.Size)).filter(Boolean))];
      setAvailableSizes(uniqueSizes.sort());
    } catch (error) {
      console.error('Error loading sizes:', error);
      toast.error('خطأ في تحميل المقاسات');
    }
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('installation_teams')
        .select('*')
        .order('team_name', { ascending: true });

      if (error) throw error;

      if (data) {
        setTeams(data.map(team => ({
          ...team,
          sizes: Array.isArray(team.sizes) ? team.sizes : []
        })));
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('خطأ في تحميل فرق التركيب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
    loadAvailableSizes();
  }, []);

  const handleOpenDialog = (team?: InstallationTeam) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        team_name: team.team_name,
        sizes: team.sizes
      });
    } else {
      setEditingTeam(null);
      setFormData({
        team_name: '',
        sizes: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTeam(null);
    setFormData({
      team_name: '',
      sizes: []
    });
  };

  const handleSaveTeam = async () => {
    if (!formData.team_name.trim()) {
      toast.error('يرجى إدخال اسم الفرقة');
      return;
    }

    try {
      if (editingTeam) {
        const { error } = await supabase
          .from('installation_teams')
          .update({
            team_name: formData.team_name,
            sizes: formData.sizes,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTeam.id);

        if (error) throw error;
        toast.success('تم تحديث الفرقة بنجاح');
      } else {
        const { error } = await supabase
          .from('installation_teams')
          .insert([{
            team_name: formData.team_name,
            sizes: formData.sizes
          }]);

        if (error) throw error;
        toast.success('تم إضافة الفرقة بنجاح');
      }

      handleCloseDialog();
      loadTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error('خطأ في حفظ الفرقة');
    }
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeamId) return;

    try {
      const { error } = await supabase
        .from('installation_teams')
        .delete()
        .eq('id', deletingTeamId);

      if (error) throw error;

      toast.success('تم حذف الفرقة بنجاح');
      setIsDeleteDialogOpen(false);
      setDeletingTeamId(null);
      loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('خطأ في حذف الفرقة');
    }
  };

  const handleOpenDeleteDialog = (teamId: string) => {
    setDeletingTeamId(teamId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">إدارة فرق التركيب</h1>
              <p className="text-muted-foreground">إدارة فرق التركيب والمقاسات المرتبطة بها</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة فرقة جديدة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة فرق التركيب</CardTitle>
            <CardDescription>
              عرض وإدارة جميع فرق التركيب في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد فرق تركيب حالياً</p>
                <Button onClick={() => handleOpenDialog()} className="mt-4">
                  إضافة فرقة جديدة
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الفرقة</TableHead>
                    <TableHead>المقاسات</TableHead>
                    <TableHead>عدد المقاسات</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {team.sizes.slice(0, 3).map((size, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                            >
                              {size}
                            </span>
                          ))}
                          {team.sizes.length > 3 && (
                            <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                              +{team.sizes.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{team.sizes.length}</TableCell>
                      <TableCell>
                        {new Date(team.created_at).toLocaleDateString('ar-LY')}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(team)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(team.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTeam ? 'تعديل فرقة التركيب' : 'إضافة فرقة تركيب جديدة'}
              </DialogTitle>
              <DialogDescription>
                قم بإدخال اسم الفرقة واختيار المقاسات المرتبطة بها
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">اسم الفرقة</Label>
                <Input
                  id="team_name"
                  placeholder="مثال: فرقة التركيب الأولى"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sizes">المقاسات المرتبطة</Label>
                <MultiSelect
                  options={availableSizes.map(size => ({
                    label: size,
                    value: size
                  }))}
                  selected={formData.sizes}
                  onChange={(selected) => setFormData({ ...formData, sizes: selected })}
                  placeholder="اختر المقاسات..."
                />
                <p className="text-xs text-muted-foreground">
                  اختر المقاسات التي ستقوم هذه الفرقة بتركيبها
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                إلغاء
              </Button>
              <Button onClick={handleSaveTeam}>
                {editingTeam ? 'حفظ التعديلات' : 'إضافة الفرقة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه الفرقة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingTeamId(null)}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
