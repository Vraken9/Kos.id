'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home, ArrowLeft, CheckCircle2, Clock, Upload, AlertCircle, XCircle, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  const d = new Date(date);
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}.${String(d.getMinutes()).padStart(2,'0')} WIB`;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  waiting_payment: { label: 'Menunggu Pembayaran', color: 'warning', icon: <Clock className="h-4 w-4" /> },
  waiting_confirmation: { label: 'Menunggu Konfirmasi Admin', color: 'info', icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: 'Pembayaran Dikonfirmasi', color: 'default', icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: { label: 'Bukti Pembayaran Ditolak', color: 'destructive', icon: <AlertCircle className="h-4 w-4" /> },
  cancelled: { label: 'Pesanan Dibatalkan', color: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  expired: { label: 'Pesanan Kedaluwarsa', color: 'secondary', icon: <XCircle className="h-4 w-4" /> },
};

function BookingStatusContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingCode = params.bookingCode as string;
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBooking = async () => {
    if (!token) { setError('Link booking tidak valid atau sudah tidak bisa diakses.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/public/bookings/${bookingCode}?token=${token}`);
      const json = await res.json();
      if (json.success) { setBooking(json.data); } else { setError(json.error?.message || 'Data tidak ditemukan'); }
    } catch { setError('Terjadi kesalahan'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBooking(); }, [bookingCode, token]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('token', token);
    formData.append('proofImage', file);

    try {
      const res = await fetch(`/api/public/bookings/${bookingCode}/payment-proof`, { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        toast.success('Bukti pembayaran berhasil diupload!');
        fetchBooking();
      } else { toast.error(json.error?.message || 'Gagal upload'); }
    } catch { toast.error('Terjadi kesalahan'); } finally { setUploading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-lg font-semibold text-gray-700">{error || 'Booking tidak ditemukan'}</h2>
        <Link href="/"><Button variant="outline">Kembali ke beranda</Button></Link>
      </div>
    );
  }

  const status = booking.status as string;
  const sc = statusConfig[status] || statusConfig.waiting_payment;
  const qris = booking.qris as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
          <Link href="/" className="flex items-center gap-2"><Home className="h-5 w-5 text-emerald-600" /><span className="text-lg font-bold text-emerald-600">kos.id</span></Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Booking Code & Copy Link */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Status Pesanan</h1>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link disalin!'); }}>
              <Copy className="h-3.5 w-3.5 mr-1" />Salin Link
            </Button>
          </div>
          <p className="text-sm text-gray-500 font-mono mb-3">{booking.bookingCode as string}</p>
          <Badge variant={sc.color as 'default' | 'destructive' | 'warning' | 'info' | 'secondary'} className="gap-1">
            {sc.icon}{sc.label}
          </Badge>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: 'waiting_payment', label: 'Pesanan dibuat', done: true },
                { status: 'waiting_payment', label: 'Menunggu pembayaran', done: status !== 'waiting_payment' },
                { status: 'waiting_confirmation', label: 'Bukti pembayaran dikirim', done: ['waiting_confirmation', 'confirmed', 'rejected'].includes(status) },
                { status: 'confirmed', label: 'Dikonfirmasi admin', done: status === 'confirmed' },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 ${step.done ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className="text-sm">{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Detail Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Nama Kos</span><span className="font-medium">{booking.kosName as string}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tipe Kamar</span><span className="font-medium">{booking.roomTypeName as string}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Nama Pemesan</span><span className="font-medium">{booking.customerName as string}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">WhatsApp</span><span className="font-medium">{booking.customerWhatsapp as string}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tanggal Mulai Sewa</span><span className="font-medium">{booking.plannedCheckinDate as string}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tanggal Pesan</span><span className="font-medium">{formatDate(booking.createdAt as string)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-700 font-medium">Total Bayar</span><span className="text-lg font-bold text-emerald-700">{formatRupiah(booking.paymentAmount as number)}</span></div>
          </CardContent>
        </Card>

        {/* Admin Note */}
        {(booking.adminNote as string) && ['rejected', 'cancelled'].includes(status) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-800 mb-1">Catatan Admin:</p>
            <p className="text-sm text-red-700">{booking.adminNote as string}</p>
          </div>
        )}

        {/* QRIS & Upload */}
        {['waiting_payment', 'rejected'].includes(status) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Pembayaran</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {qris?.imageUrl ? (
                <div className="text-center">
                  <img src={qris.imageUrl as string} alt="QRIS" className="max-w-xs mx-auto rounded-lg border" />
                  {(qris.receiverName as string) && <p className="text-sm text-gray-600 mt-2">Penerima: {qris.receiverName as string}</p>}
                  {(qris.instructions as string) && <p className="text-xs text-gray-500 mt-1">{qris.instructions as string}</p>}
                </div>
              ) : (
                <p className="text-sm text-amber-600 text-center">QRIS belum dikonfigurasi. Silakan hubungi admin.</p>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Upload Bukti Pembayaran</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Mengupload...' : 'Pilih File'}
                </Button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, atau WebP. Maks 2 MB.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Proof Preview */}
        {(booking.paymentProof as Record<string, unknown>) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bukti Pembayaran</CardTitle></CardHeader>
            <CardContent>
              <img src={(booking.paymentProof as Record<string, unknown>).imageUrl as string} alt="Bukti Pembayaran" className="max-w-sm rounded-lg border mx-auto" />
            </CardContent>
          </Card>
        )}

        {/* Receipt Download */}
        {status === 'confirmed' && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-5 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold text-emerald-800 mb-2">Pembayaran Dikonfirmasi!</h3>
              <div className="flex gap-2 justify-center">
                <Link href={`/receipt/${bookingCode}?token=${token}`}>
                  <Button><FileText className="h-4 w-4 mr-2" />Lihat Struk</Button>
                </Link>
                <a href={`/api/receipts/${bookingCode}/pdf?token=${token}`}>
                  <Button variant="outline">Download PDF</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>}>
      <BookingStatusContent />
    </Suspense>
  );
}
