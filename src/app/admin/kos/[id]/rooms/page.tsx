'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export default function RoomsPage() {
  const params = useParams();
  const kosId = params.id as string;
  const [kosName, setKosName] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [facilitiesList, setFacilitiesList] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', priceMonthly: '', stockTotal: '', stockAvailable: '',
    roomSize: '', bathroomType: 'shared', electricityType: 'included',
    isActive: true, facilityIds: [] as number[],
  });

  const fetchKosAndRooms = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/kos/${kosId}`).then(res => res.json()),
      fetch(`/api/admin/kos/${kosId}/room-types`).then(res => res.json())
    ]).then(([kosRes, roomsRes]) => {
      if (kosRes.success) setKosName(kosRes.data.name);
      if (roomsRes.success) setRooms(roomsRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKosAndRooms();
    fetch('/api/admin/facilities')
      .then(res => res.json())
      .then(json => {
        if (json.success) setFacilitiesList(json.data.filter((f: any) => f.scope === 'room' || f.scope === 'both'));
      })
      .catch(console.error);
  }, [kosId]);

  const openAddModal = () => {
    setEditingRoomId(null);
    setForm({
      name: '', description: '', priceMonthly: '', stockTotal: '1', stockAvailable: '1',
      roomSize: '', bathroomType: 'shared', electricityType: 'included',
      isActive: true, facilityIds: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (room: any) => {
    setEditingRoomId(room.id);
    setForm({
      name: room.name, description: room.description || '', priceMonthly: String(room.price_monthly),
      stockTotal: String(room.stock_total), stockAvailable: String(room.stock_available),
      roomSize: room.room_size || '', bathroomType: room.bathroom_type, electricityType: room.electricity_type,
      isActive: Boolean(room.is_active), facilityIds: room.facilities ? room.facilities.map((f: any) => f.id) : []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus tipe kamar ini?')) return;
    try {
      const res = await fetch(`/api/admin/room-types/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Kamar dihapus');
        fetchKosAndRooms();
      } else {
        toast.error(json.error?.message || 'Gagal menghapus');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        priceMonthly: parseInt(form.priceMonthly) || 0,
        stockTotal: parseInt(form.stockTotal) || 0,
        stockAvailable: parseInt(form.stockAvailable) || 0,
      };

      const url = editingRoomId ? `/api/admin/room-types/${editingRoomId}` : `/api/admin/kos/${kosId}/room-types`;
      const method = editingRoomId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success(editingRoomId ? 'Kamar diperbarui' : 'Kamar ditambahkan');
        setIsModalOpen(false);
        fetchKosAndRooms();
      } else {
        toast.error(json.error?.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/kos">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Tipe Kamar</h1>
          <p className="text-gray-500">Kos: {kosName || 'Memuat...'}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openAddModal}><Plus className="h-4 w-4 mr-2" /> Tambah Tipe Kamar</Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Memuat data...</div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-gray-500">
            <p>Kos ini belum memiliki tipe kamar.</p>
            <Button onClick={openAddModal} className="mt-4">Tambah Kamar Pertama</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <Card key={room.id} className={!room.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-900">{room.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${room.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {room.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{room.description || 'Tidak ada deskripsi'}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-gray-500">Harga per Bulan</p>
                      <p className="font-medium">{formatRupiah(room.price_monthly)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sisa Stok / Total</p>
                      <p className="font-medium">{room.stock_available} / {room.stock_total}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Kamar Mandi</p>
                      <p className="font-medium capitalize">{room.bathroom_type === 'inside' ? 'Dalam' : room.bathroom_type === 'outside' ? 'Luar' : 'Berbagi'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Listrik</p>
                      <p className="font-medium capitalize">{room.electricity_type === 'included' ? 'Termasuk' : room.electricity_type}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(room)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(room.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoomId ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nama Tipe Kamar <span className="text-red-500">*</span></Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Kamar AC Eksklusif" />
              </div>
              <div className="space-y-1">
                <Label>Harga per Bulan (Rp) <span className="text-red-500">*</span></Label>
                <Input required type="number" min="0" value={form.priceMonthly} onChange={e => setForm(f => ({ ...f, priceMonthly: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Total Kamar</Label>
                <Input required type="number" min="0" value={form.stockTotal} onChange={e => setForm(f => ({ ...f, stockTotal: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Kamar Kosong</Label>
                <Input required type="number" min="0" value={form.stockAvailable} onChange={e => setForm(f => ({ ...f, stockAvailable: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Ukuran Kamar</Label>
                <Input value={form.roomSize} onChange={e => setForm(f => ({ ...f, roomSize: e.target.value }))} placeholder="3x4 m" />
              </div>
              <div className="space-y-1">
                <Label>Kamar Mandi</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.bathroomType} onChange={e => setForm(f => ({ ...f, bathroomType: e.target.value }))}>
                  <option value="inside">Dalam</option>
                  <option value="outside">Luar</option>
                  <option value="shared">Berbagi</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Listrik</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.electricityType} onChange={e => setForm(f => ({ ...f, electricityType: e.target.value }))}>
                <option value="included">Termasuk Harga</option>
                <option value="token">Token Sendiri</option>
                <option value="separate">Bayar Terpisah</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Fasilitas Kamar</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facilitiesList.map(f => (
                  <label key={f.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.facilityIds.includes(f.id)}
                      onChange={e => {
                        if (e.target.checked) setForm(prev => ({ ...prev, facilityIds: [...prev.facilityIds, f.id] }));
                        else setForm(prev => ({ ...prev, facilityIds: prev.facilityIds.filter(id => id !== f.id) }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{f.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan Kamar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
