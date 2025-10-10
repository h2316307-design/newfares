import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import * as UIDialog from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Wallet, Plus, Edit, Trash2, DollarSign, Calendar, User } from 'lucide-react';

interface Salary {
  id: string;
  employee_name: string;
  position: string;
  salary_amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
  status: string;
  created_at: string;
}

export default function Salaries() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);

  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('نقدي');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('معلق');

  useEffect(() => {
    loadSalaries();
  }, []);

  const loadSalaries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('خطأ في تحميل الرواتب:', error);
        toast.error('فشل في تحميل الرواتب');
      } else {
        setSalaries(data || []);
      }
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmployeeName('');
    setPosition('');
    setSalaryAmount('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('نقدي');
    setNotes('');
    setStatus('معلق');
    setEditingSalary(null);
  };

  const handleOpenDialog = (salary?: Salary) => {
    if (salary) {
      setEditingSalary(salary);
      setEmployeeName(salary.employee_name);
      setPosition(salary.position);
      setSalaryAmount(salary.salary_amount.toString());
      setPaymentDate(salary.payment_date);
      setPaymentMethod(salary.payment_method);
      setNotes(salary.notes || '');
      setStatus(salary.status);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!employeeName.trim()) {
      toast.error('يرجى إدخال اسم الموظف');
      return;
    }

    if (!salaryAmount || parseFloat(salaryAmount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    try {
      const salaryData = {
        employee_name: employeeName,
        position: position || '',
        salary_amount: parseFloat(salaryAmount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes || '',
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (editingSalary) {
        const { error } = await supabase
          .from('salaries')
          .update(salaryData)
          .eq('id', editingSalary.id);

        if (error) {
          console.error('خطأ في تحديث الراتب:', error);
          toast.error('فشل في تحديث الراتب');
        } else {
          toast.success('تم تحديث الراتب بنجاح');
          handleCloseDialog();
          loadSalaries();
        }
      } else {
        const { error } = await supabase
          .from('salaries')
          .insert([salaryData]);

        if (error) {
          console.error('خطأ في إضافة الراتب:', error);
          toast.error('فشل في إضافة الراتب');
        } else {
          toast.success('تم إضافة الراتب بنجاح');
          handleCloseDialog();
          loadSalaries();
        }
      }
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      toast.error('حدث خطأ غير متوقع');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الراتب؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('salaries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('خطأ في حذف الراتب:', error);
        toast.error('فشل في حذف الراتب');
      } else {
        toast.success('تم حذف الراتب بنجاح');
        loadSalaries();
      }
    } catch (error) {
      console.error('خطأ غير متوقع:', error);
      toast.error('حدث خطأ غير متوقع');
    }
  };

  const totalPaid = salaries
    .filter(s => s.status === 'مدفوع')
    .reduce((sum, s) => sum + s.salary_amount, 0);

  const totalPending = salaries
    .filter(s => s.status === 'معلق')
    .reduce((sum, s) => sum + s.salary_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الرواتب</h1>
          <p className="text-muted-foreground mt-1">متابعة وإدارة رواتب الموظفين</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة راتب
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرواتب المدفوعة</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPaid.toLocaleString('ar-LY')} د.ل
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرواتب المعلقة</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalPending.toLocaleString('ar-LY')} د.ل
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الموظفين</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(salaries.map(s => s.employee_name)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            سجل الرواتب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الموظف</TableHead>
                <TableHead className="text-right">الوظيفة</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">تاريخ الدفع</TableHead>
                <TableHead className="text-right">طريقة الدفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد رواتب مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">{salary.employee_name}</TableCell>
                    <TableCell>{salary.position || '-'}</TableCell>
                    <TableCell>{salary.salary_amount.toLocaleString('ar-LY')} د.ل</TableCell>
                    <TableCell>{new Date(salary.payment_date).toLocaleDateString('ar-LY')}</TableCell>
                    <TableCell>{salary.payment_method}</TableCell>
                    <TableCell>
                      <Badge variant={salary.status === 'مدفوع' ? 'default' : 'secondary'}>
                        {salary.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(salary)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(salary.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UIDialog.Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <UIDialog.DialogContent className="max-w-2xl">
          <UIDialog.DialogHeader>
            <UIDialog.DialogTitle>
              {editingSalary ? 'تعديل راتب' : 'إضافة راتب جديد'}
            </UIDialog.DialogTitle>
          </UIDialog.DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">اسم الموظف *</label>
              <Input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="أدخل اسم الموظف"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">الوظيفة</label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="أدخل الوظيفة"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">مبلغ الراتب *</label>
              <Input
                type="number"
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">تاريخ الدفع *</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نقدي">نقدي</SelectItem>
                  <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                  <SelectItem value="شيك">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="معلق">معلق</SelectItem>
                  <SelectItem value="مدفوع">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">ملاحظات</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف أي ملاحظات..."
                rows={3}
              />
            </div>
          </div>

          <UIDialog.DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {editingSalary ? 'تحديث' : 'إضافة'}
            </Button>
          </UIDialog.DialogFooter>
        </UIDialog.DialogContent>
      </UIDialog.Dialog>
    </div>
  );
}
