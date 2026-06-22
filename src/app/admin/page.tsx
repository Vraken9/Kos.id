'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Bed, ClipboardList, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(json => { if (json.success) setStats(json.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Kos Aktif', value: stats.total_kos_active || 0, icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Stok Tersedia', value: stats.total_stock_available || 0, icon: Bed, color: 'text-blue-600 bg-blue-50' },
    { label: 'Menunggu Konfirmasi', value: stats.bookings_waiting || 0, icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
    { label: 'Confirmed Bulan Ini', value: stats.bookings_confirmed_this_month || 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/admin/kos/new"><Button><Plus className="h-4 w-4 mr-2" />Tambah Kos</Button></Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-5 h-24" /></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="h-6 w-6" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/kos/new" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border">
              <span className="text-sm font-medium text-gray-700">Tambah Kos Baru</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/admin/bookings?status=waiting_confirmation" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border">
              <span className="text-sm font-medium text-gray-700">Lihat Booking Menunggu Konfirmasi</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/admin/settings" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border">
              <span className="text-sm font-medium text-gray-700">Kelola Settings & QRIS</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
