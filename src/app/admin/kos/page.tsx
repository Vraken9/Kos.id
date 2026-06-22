'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Bed, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export default function AdminKosListPage() {
  const [kosList, setKosList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchKos = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    try {
      const res = await fetch(`/api/admin/kos?${params.toString()}`);
      const json = await res.json();
      if (json.success) setKosList(json.data.items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleToggle = async (id: number, field: 'is_active' | 'is_featured', currentValue: boolean) => {
    try {
      const res = await fetch(`/api/admin/kos/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil mengubah status ${field === 'is_active' ? 'Aktif' : 'Featured'}`);
        setKosList(prev => prev.map(k => k.id === id ? { ...k, [field]: !currentValue } : k));
      } else {
        toast.error(json.error?.message || 'Gagal mengubah status');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  useEffect(() => { fetchKos(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Kos</h1>
        <Link href="/admin/kos/new"><Button><Plus className="h-4 w-4 mr-2" />Tambah Kos</Button></Link>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari kos..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchKos()} className="pl-9" />
        </div>
        <Button variant="outline" onClick={fetchKos}>Cari</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-20" /></Card>)}</div>
      ) : kosList.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>Belum ada data kos.</p>
          <Link href="/admin/kos/new"><Button className="mt-4">Tambah Kos Pertama</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {kosList.map(kos => (
            <Card key={kos.id as number}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {kos.cover_image_url ? (
                    <img src={kos.cover_image_url as string} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Bed className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{kos.name as string}</h3>
                    <button 
                      onClick={() => handleToggle(kos.id as number, 'is_active', !!kos.is_active)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${kos.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {kos.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button 
                      onClick={() => handleToggle(kos.id as number, 'is_featured', !!kos.is_featured)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${kos.is_featured ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {kos.is_featured ? '⭐ Featured' : 'Biasa'}
                    </button>
                    <Badge variant={(kos.gender_type as string) as 'putra' | 'putri' | 'campur'}>{kos.gender_type as string}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{kos.address as string}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>Harga: {kos.minimum_price ? formatRupiah(kos.minimum_price as number) : '-'}</span>
                    <span>Stok: {kos.available_stock as number || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-col sm:flex-row">
                  <Link href={`/admin/kos/${kos.id}/rooms`}><Button variant="outline" size="sm" className="w-full sm:w-auto"><Bed className="h-3.5 w-3.5 mr-1" />Kelola Tipe Kamar</Button></Link>
                  <Link href={`/admin/kos/${kos.id}/edit`}><Button variant="outline" size="sm" className="w-full sm:w-auto"><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
