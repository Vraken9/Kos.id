'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function NewKosPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', address: '',
    latitude: '', longitude: '', googleMapsUrl: '',
    genderType: 'campur', ownerName: '', ownerWhatsapp: '',
    rules: '', isActive: true, isFeatured: false,
  });

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugify(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/kos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Kos berhasil ditambahkan!');
        router.push('/admin/kos');
      } else { toast.error(json.error?.message || 'Gagal menambahkan kos'); }
    } catch { toast.error('Terjadi kesalahan'); } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/kos" className="text-gray-600 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Kos Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Dasar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nama Kos *</Label><Input value={form.name} onChange={e => handleNameChange(e.target.value)} className="mt-1" required /></div>
            <div><Label>Slug URL</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="mt-1" /></div>
            <div><Label>Alamat *</Label><Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" required /></div>
            <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lokasi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} className="mt-1" /></div>
              <div><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Link Google Maps</Label><Input value={form.googleMapsUrl} onChange={e => setForm(f => ({ ...f, googleMapsUrl: e.target.value }))} className="mt-1" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Penghuni & Pemilik</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipe Penghuni *</Label>
              <select value={form.genderType} onChange={e => setForm(f => ({ ...f, genderType: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
                <option value="putra">Putra</option>
                <option value="putri">Putri</option>
                <option value="campur">Campur</option>
              </select>
            </div>
            <div><Label>Nama Pemilik</Label><Input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} className="mt-1" /></div>
            <div><Label>WhatsApp Pemilik *</Label><Input placeholder="08123456789" value={form.ownerWhatsapp} onChange={e => setForm(f => ({ ...f, ownerWhatsapp: e.target.value }))} className="mt-1" required /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Peraturan & Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Peraturan Kos</Label><Textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} className="mt-1" placeholder="Satu peraturan per baris" /></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" /><span className="text-sm">Aktif</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded" /><span className="text-sm">Featured</span></label>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Kos'}</Button>
          <Link href="/admin/kos"><Button variant="outline" type="button">Batal</Button></Link>
        </div>
      </form>
    </div>
  );
}
