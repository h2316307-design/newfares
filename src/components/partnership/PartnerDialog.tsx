import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface PartnerDialogProps {
  trigger?: React.ReactNode;
  partner?: { id?: string; name: string; phone?: string | null } | null;
  onSaved?: () => void;
}

export function PartnerDialog({ trigger, partner, onSaved }: PartnerDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const isEdit = Boolean(partner?.id);

  useEffect(() => {
    if (open) {
      setName(partner?.name || '');
      setPhone(partner?.phone || '');
    }
  }, [open, partner]);

  const save = async () => {
    const payload: any = { name: name.trim(), phone: phone.trim() || null };
    if (!payload.name) { toast.error('الاسم مطلوب'); return; }

    try {
      let error;
      if (isEdit) {
        ({ error } = await supabase.from('partners').update(payload).eq('id', partner!.id));
      } else {
        ({ error } = await supabase.from('partners').insert(payload));
      }
      if (error) throw error;
      toast.success(isEdit ? 'تم تحديث الشركة' : 'تمت إضافة الشركة');
      setOpen(false);
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || 'فشل الحفظ');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل شركة مشاركة' : 'إضافة شركة مشاركة'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>اسم الشركة</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسم الشركة" />
          </div>
          <div className="grid gap-2">
            <Label>رقم الهاتف</Label>
            <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="09XXXXXXXX" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={()=>setOpen(false)}>إلغاء</Button>
          <Button onClick={save}>{isEdit ? 'حفظ' : 'إضافة'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
