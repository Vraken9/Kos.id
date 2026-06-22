'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const qrisRef = useRef<HTMLInputElement>(null);

  const [campus, setCampus] = useState({ name: '', address: '', latitude: '', longitude: '', googleMapsUrl: '' });
  const [payment, setPayment] = useState({ receiverName: '', paymentInstructions: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const s = json.data;
          setSettings(s);
          setCampus({
            name: s.campus_name || '', address: s.campus_address || '',
            latitude: s.campus_latitude?.toString() || '', longitude: s.campus_longitude?.toString() || '',
            googleMapsUrl: s.campus_google_maps_url || '',
          });
          setPayment({ receiverName: s.payment_receiver_name || '', paymentInstructions: s.payment_instructions || '' });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveCampus = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/campus', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campus, latitude: campus.latitude ? parseFloat(campus.latitude) : null, longitude: campus.longitude ? parseFloat(campus.longitude) : null }),
      });
      const json = await res.json();
      if (json.success) toast.success('Data kampus disimpan!'); else toast.error(json.error?.message || 'Gagal menyimpan');
    } catch { toast.error('Terjadi kesalahan'); } finally { setSaving(false); }
  };

  const savePayment = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/payment', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) });
      const json = await res.json();
      if (json.success) toast.success('Data pembayaran disimpan!'); else toast.error('Gagal menyimpan');
    } catch { toast.error('Terjadi kesalahan'); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (password.newPassword !== password.confirmPassword) { toast.error('Konfirmasi password tidak cocok'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }) });
      const json = await res.json();
      if (json.success) { toast.success('Password berhasil diubah!'); setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else toast.error(json.error?.message || 'Gagal mengubah password');
    } catch { toast.error('Terjadi kesalahan'); } finally { setSaving(false); }
  };

  const uploadQris = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('qrisImage', file);
    try {
      const res = await fetch('/api/admin/uploads/qris', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) { toast.success('QRIS berhasil diupload!'); setSettings(s => ({ ...s, qris_image_path: json.data.qrisImageUrl })); }
      else toast.error(json.error?.message || 'Gagal upload QRIS');
    } catch { toast.error('Terjadi kesalahan'); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Campus */}
        <Card>
          <CardHeader><CardTitle className="text-base">Kampus Acuan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nama Kampus</Label><Input value={campus.name} onChange={e => setCampus(c => ({ ...c, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Alamat</Label><Textarea value={campus.address} onChange={e => setCampus(c => ({ ...c, address: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Latitude</Label><Input type="number" step="any" value={campus.latitude} onChange={e => setCampus(c => ({ ...c, latitude: e.target.value }))} className="mt-1" /></div>
              <div><Label>Longitude</Label><Input type="number" step="any" value={campus.longitude} onChange={e => setCampus(c => ({ ...c, longitude: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Link Google Maps</Label><Input value={campus.googleMapsUrl} onChange={e => setCampus(c => ({ ...c, googleMapsUrl: e.target.value }))} className="mt-1" /></div>
            <Button onClick={saveCampus} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Kampus'}</Button>
          </CardContent>
        </Card>

        {/* QRIS */}
        <Card>
          <CardHeader><CardTitle className="text-base">QRIS Statis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(settings?.qris_image_path as string) && (
              <img src={settings?.qris_image_path as string} alt="QRIS" className="max-w-xs rounded-lg border" />
            )}
            <input ref={qrisRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadQris} />
            <Button variant="outline" onClick={() => qrisRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Upload QRIS</Button>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader><CardTitle className="text-base">Instruksi Pembayaran</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nama Penerima</Label><Input value={payment.receiverName} onChange={e => setPayment(p => ({ ...p, receiverName: e.target.value }))} className="mt-1" /></div>
            <div><Label>Instruksi</Label><Textarea value={payment.paymentInstructions} onChange={e => setPayment(p => ({ ...p, paymentInstructions: e.target.value }))} className="mt-1" /></div>
            <Button onClick={savePayment} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pembayaran'}</Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ganti Password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Password Saat Ini</Label><Input type="password" value={password.currentPassword} onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))} className="mt-1" /></div>
            <div><Label>Password Baru</Label><Input type="password" value={password.newPassword} onChange={e => setPassword(p => ({ ...p, newPassword: e.target.value }))} className="mt-1" /></div>
            <div><Label>Konfirmasi Password Baru</Label><Input type="password" value={password.confirmPassword} onChange={e => setPassword(p => ({ ...p, confirmPassword: e.target.value }))} className="mt-1" /></div>
            <Button onClick={changePassword} disabled={saving}>{saving ? 'Menyimpan...' : 'Ganti Password'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
