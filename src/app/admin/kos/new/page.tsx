'use client';

import { useState, useEffect } from 'react';
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
    rules: '', isActive: true, isFeatured: false, facilityIds: [] as number[],
    photos: [] as { url: string; isCover: boolean }[],
  });
  const [facilitiesList, setFacilitiesList] = useState<{id: number, name: string}[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newFacilityName, setNewFacilityName] = useState('');
  const [addingFacility, setAddingFacility] = useState(false);

  useEffect(() => {
    fetch('/api/admin/facilities')
      .then(res => res.json())
      .then(json => {
        if (json.success) setFacilitiesList(json.data);
      })
      .catch(console.error);
  }, []);

  const handleAddFacility = async () => {
    if (!newFacilityName.trim()) return;
    setAddingFacility(true);
    try {
      const res = await fetch('/api/admin/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFacilityName.trim(), slug: slugify(newFacilityName), scope: 'both' })
      });
      const json = await res.json();
      if (json.success) {
        const newFac = { id: json.data.id, name: newFacilityName.trim() };
        setFacilitiesList(prev => [...prev, newFac]);
        setForm(prev => ({ ...prev, facilityIds: [...prev.facilityIds, newFac.id] }));
        setNewFacilityName('');
        toast.success('Fasilitas berhasil ditambahkan');
      } else {
        toast.error(json.error?.message || 'Gagal menambah fasilitas');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    } finally {
      setAddingFacility(false);
    }
  };

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugify(name) }));
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }
    
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/admin/uploads/kos-photo', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setForm(f => ({
          ...f,
          photos: [...f.photos, { url: json.data.imagePath, isCover: f.photos.length === 0 }]
        }));
        toast.success('Foto berhasil diunggah');
      } else {
        toast.error(json.error?.message || 'Gagal unggah foto');
      }
    } catch {
      toast.error('Gagal terhubung ke server');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl) return;
    setForm(f => ({
      ...f,
      photos: [...f.photos, { url: newPhotoUrl, isCover: f.photos.length === 0 }]
    }));
    setNewPhotoUrl('');
  };

  const setCoverPhoto = (index: number) => {
    setForm(f => ({
      ...f,
      photos: f.photos.map((p, i) => ({ ...p, isCover: i === index }))
    }));
  };

  const removePhoto = (index: number) => {
    setForm(f => {
      const newPhotos = f.photos.filter((_, i) => i !== index);
      if (newPhotos.length > 0 && !newPhotos.some(p => p.isCover)) {
        newPhotos[0].isCover = true;
      }
      return { ...f, photos: newPhotos };
    });
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
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Aktif</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">Jika aktif, kos ini akan terlihat oleh pengunjung di halaman publik.</p>
            </div>
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Featured</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">Menambahkan badge khusus (Bintang) dan memprioritaskan kos ini dalam tampilan.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Galeri Foto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Atau masukkan URL gambar..." value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} />
              <Button type="button" onClick={handleAddPhotoUrl} variant="secondary">Tambah URL</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Atau upload file (Max 10MB):</span>
              <Input type="file" accept="image/*" onChange={handleUploadPhoto} disabled={uploadingPhoto} className="max-w-xs" />
              {uploadingPhoto && <span className="text-sm text-emerald-600">Mengunggah...</span>}
            </div>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {form.photos.map((p, i) => (
                  <div key={i} className={`relative rounded-lg border-2 overflow-hidden ${p.isCover ? 'border-emerald-500' : 'border-gray-200'}`}>
                    <img src={p.url} alt="preview" className="w-full h-24 object-cover" />
                    <div className="absolute top-1 right-1 flex gap-1">
                      {!p.isCover && <button type="button" onClick={() => setCoverPhoto(i)} className="bg-white/80 p-1 rounded text-xs hover:bg-emerald-100" title="Jadikan Cover">⭐</button>}
                      <button type="button" onClick={() => removePhoto(i)} className="bg-red-500/80 text-white p-1 rounded text-xs hover:bg-red-600" title="Hapus">✕</button>
                    </div>
                    {p.isCover && <div className="absolute bottom-0 w-full bg-emerald-500 text-white text-[10px] text-center py-0.5">COVER</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Fasilitas Kos
            </CardTitle>
            <p className="text-sm text-gray-500">Daftar fasilitas di bawah ini diambil otomatis dari <strong>Master Data Fasilitas</strong>. Anda dapat menambah opsi fasilitas baru melalui menu <Link href="/admin/facilities" className="text-emerald-600 hover:underline">Kelola Fasilitas</Link>.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {facilitiesList.map(f => {
                const isSelected = form.facilityIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) setForm(prev => ({ ...prev, facilityIds: prev.facilityIds.filter(id => id !== f.id) }));
                      else setForm(prev => ({ ...prev, facilityIds: [...prev.facilityIds, f.id] }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-200 ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    {f.name}
                  </button>
                );
              })}
              {facilitiesList.length === 0 && <span className="text-sm text-gray-500 italic">Memuat fasilitas...</span>}
            </div>
            
            {/* Inline Facility Add */}
            <div className="mt-6 border-t pt-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">Fasilitas tidak ada di list? Tambah baru:</label>
              <div className="flex gap-2 max-w-sm">
                <Input 
                  placeholder="Nama fasilitas baru..." 
                  value={newFacilityName} 
                  onChange={e => setNewFacilityName(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFacility(); } }}
                />
                <Button type="button" onClick={handleAddFacility} disabled={addingFacility} variant="secondary">
                  {addingFacility ? 'Menambah...' : 'Tambah'}
                </Button>
              </div>
            </div>
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
