'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Eye, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}
function formatDate(date: string) {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const statusBadge: Record<string, { label: string; variant: string }> = {
  waiting_payment: { label: 'Menunggu Bayar', variant: 'warning' },
  waiting_confirmation: { label: 'Menunggu Konfirmasi', variant: 'info' },
  confirmed: { label: 'Dikonfirmasi', variant: 'default' },
  rejected: { label: 'Ditolak', variant: 'destructive' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
  expired: { label: 'Kedaluwarsa', variant: 'secondary' },
};

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [actionDialog, setActionDialog] = useState<{ type: 'confirm' | 'reject' | 'cancel' | 'checkout'; booking: Record<string, unknown> } | null>(null);
  const [detailBooking, setDetailBooking] = useState<Record<string, unknown> | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const json = await res.json();
      if (json.success) setBookings(json.data.items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  const handleAction = async () => {
    if (!actionDialog) return;
    const { type, booking } = actionDialog;
    if ((type === 'reject' || type === 'cancel') && !adminNote.trim()) { toast.error('Catatan admin wajib diisi.'); return; }

    setActionLoading(true);
    try {
      let res;
      if (type === 'checkout') {
        res = await fetch(`/api/admin/bookings/${booking.id}/checkout`, { method: 'POST' });
      } else {
        res = await fetch(`/api/admin/bookings/${booking.id}/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminNote: adminNote.trim() }),
        });
      }
      const json = await res.json();
      if (json.success) { toast.success(`Booking berhasil di-${type}!`); fetchBookings(); setActionDialog(null); setAdminNote(''); }
      else { toast.error(json.error?.message || 'Gagal memproses'); }
    } catch { toast.error('Terjadi kesalahan'); } finally { setActionLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kelola Booking</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari kode/nama/WA..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchBookings()} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
          <option value="">Semua Status</option>
          {Object.entries(statusBadge).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <Button variant="outline" onClick={fetchBookings}>Cari</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4 h-20" /></Card>)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Tidak ada booking ditemukan.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const sb = statusBadge[b.status as string] || statusBadge.waiting_payment;
            return (
              <Card key={b.id as number}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-gray-900">{b.booking_code as string}</span>
                        <Badge variant={sb.variant as 'default' | 'destructive' | 'warning' | 'info'}>{sb.label}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>{b.customer_name as string}</span> · <span>{b.snapshot_kos_name as string}</span> · <span>{b.snapshot_room_type_name as string}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Durasi: <strong>{b.duration_months as number} bulan</strong> · Masuk: <strong>{formatDate(b.planned_checkin_date as string)}</strong>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatRupiah(b.payment_amount as number)} · Dibuat: {formatDate(b.created_at as string)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setDetailBooking(b)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />Detail
                      </Button>
                      {Boolean(b.payment_proof_url) && (
                        <a href={b.payment_proof_url as string} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="secondary">
                            <Eye className="h-3.5 w-3.5 mr-1" />Lihat Bukti
                          </Button>
                        </a>
                      )}
                      {b.status === 'waiting_confirmation' && (
                        <>
                          <Button size="sm" onClick={() => { setActionDialog({ type: 'confirm', booking: b }); setAdminNote(''); }}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Confirm
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setActionDialog({ type: 'reject', booking: b }); setAdminNote(''); }}>
                            <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                          </Button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <Button size="sm" onClick={() => { setActionDialog({ type: 'checkout', booking: b }); setAdminNote(''); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Selesaikan Sewa
                        </Button>
                      )}
                      {['waiting_payment', 'waiting_confirmation', 'confirmed', 'rejected'].includes(b.status as string) && (
                        <Button size="sm" variant="outline" onClick={() => { setActionDialog({ type: 'cancel', booking: b }); setAdminNote(''); }}>Cancel</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'confirm' && 'Konfirmasi Pembayaran'}
              {actionDialog?.type === 'reject' && 'Tolak Bukti Pembayaran'}
              {actionDialog?.type === 'cancel' && 'Batalkan Booking'}
              {actionDialog?.type === 'checkout' && 'Selesaikan Sewa (Check-out)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Booking: <span className="font-mono font-medium">{actionDialog?.booking?.booking_code as string}</span>
            </p>
            {actionDialog?.type === 'confirm' && (
              <p className="text-sm text-amber-600">Stok kamar akan dikurangi 1 setelah konfirmasi.</p>
            )}
            {actionDialog?.type === 'cancel' && actionDialog?.booking?.status === 'confirmed' && (
              <p className="text-sm text-amber-600">Stok kamar akan dikembalikan 1 karena booking sudah dikonfirmasi sebelumnya.</p>
            )}
            {actionDialog?.type === 'checkout' && (
              <p className="text-sm text-amber-600">Stok kamar akan dikembalikan 1 dan status booking menjadi Expired.</p>
            )}
            {actionDialog?.type !== 'checkout' && (
              <div>
                <Label>Catatan Admin {actionDialog?.type !== 'confirm' ? '*' : '(opsional)'}</Label>
                <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} className="mt-1" placeholder="Catatan untuk user dan log..." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Batal</Button>
            <Button
              variant={actionDialog?.type === 'confirm' || actionDialog?.type === 'checkout' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Memproses...' : actionDialog?.type === 'confirm' ? 'Konfirmasi' : actionDialog?.type === 'reject' ? 'Tolak' : actionDialog?.type === 'checkout' ? 'Selesaikan Sewa' : 'Batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
          </DialogHeader>
          {detailBooking && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 block">Kode Booking</span><span className="font-medium font-mono">{detailBooking.booking_code as string}</span></div>
                <div><span className="text-gray-500 block">Status</span><Badge variant={(statusBadge[detailBooking.status as string] || statusBadge.waiting_payment).variant as any}>{(statusBadge[detailBooking.status as string] || statusBadge.waiting_payment).label}</Badge></div>
              </div>
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 block">Nama Pemesan</span><span className="font-medium">{detailBooking.customer_name as string}</span></div>
                <div><span className="text-gray-500 block">No WhatsApp</span><span className="font-medium">{detailBooking.customer_whatsapp as string}</span></div>
              </div>
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 block">Nama Kos</span><span className="font-medium">{detailBooking.snapshot_kos_name as string}</span></div>
                <div><span className="text-gray-500 block">Tipe Kamar</span><span className="font-medium">{detailBooking.snapshot_room_type_name as string}</span></div>
                <div><span className="text-gray-500 block">Durasi Sewa</span><span className="font-medium">{detailBooking.duration_months as number} Bulan</span></div>
                <div><span className="text-gray-500 block">Tgl Mulai Sewa</span><span className="font-medium">{formatDate(detailBooking.planned_checkin_date as string)}</span></div>
              </div>
              <div className="border-t pt-4">
                <span className="text-gray-500 block">Catatan Pemesan</span>
                <p className="font-medium mt-1">{(detailBooking.customer_note as string) || '-'}</p>
              </div>
              <div className="border-t pt-4">
                <span className="text-gray-500 block">Total Pembayaran</span>
                <p className="font-bold text-lg text-emerald-700">{formatRupiah(detailBooking.payment_amount as number)}</p>
              </div>
              {(detailBooking.admin_note as string) && (
                <div className="bg-gray-50 border rounded-lg p-3">
                  <span className="text-gray-500 block text-xs">Catatan Admin</span>
                  <p className="font-medium mt-1">{detailBooking.admin_note as string}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailBooking(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
