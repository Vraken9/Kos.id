'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', scope: 'both', iconKey: '' });
  const [saving, setSaving] = useState(false);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/facilities');
      const json = await res.json();
      if (json.success) setFacilities(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFacilities(); }, []);

  const openNew = () => { setEditId(null); setForm({ name: '', slug: '', scope: 'both', iconKey: '' }); setDialogOpen(true); };
  const openEdit = (f: Record<string, unknown>) => { setEditId(f.id as number); setForm({ name: f.name as string, slug: f.slug as string, scope: f.scope as string, iconKey: (f.icon_key as string) || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editId ? `/api/admin/facilities/${editId}` : '/api/admin/facilities';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { toast.success(editId ? 'Fasilitas diupdate!' : 'Fasilitas ditambahkan!'); fetchFacilities(); setDialogOpen(false); }
      else toast.error(json.error?.message || 'Gagal menyimpan');
    } catch { toast.error('Terjadi kesalahan'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Nonaktifkan fasilitas ini?')) return;
    try {
      const res = await fetch(`/api/admin/facilities/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { toast.success('Fasilitas dinonaktifkan!'); fetchFacilities(); }
      else toast.error('Gagal menghapus');
    } catch { toast.error('Terjadi kesalahan'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Fasilitas</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Tambah</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-14" /></Card>)}</div>
      ) : (
        <div className="space-y-2">
          {facilities.map(f => (
            <Card key={f.id as number}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 text-sm">{f.name as string}</span>
                  <Badge variant="secondary">{f.scope as string}</Badge>
                  {f.is_active === 0 && <Badge variant="destructive">Nonaktif</Badge>}
                  {(f.icon_key as string) && <span className="text-xs text-gray-400">Icon: {f.icon_key as string}</span>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id as number)} className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Fasilitas' : 'Tambah Fasilitas'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama *</Label><Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: editId ? f.slug : slugify(e.target.value) })); }} className="mt-1" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="mt-1" /></div>
            <div>
              <Label>Scope</Label>
              <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
                <option value="both">Both (Kos & Room)</option>
                <option value="kos">Kos saja</option>
                <option value="room">Room saja</option>
              </select>
            </div>
            <div><Label>Icon Key</Label><Input value={form.iconKey} onChange={e => setForm(f => ({ ...f, iconKey: e.target.value }))} className="mt-1" placeholder="wifi, ac, bed-double..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
