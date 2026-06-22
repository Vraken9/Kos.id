'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home, ArrowLeft, Printer, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}
function formatDate(date: string) {
  const d = new Date(date);
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}.${String(d.getMinutes()).padStart(2,'0')} WIB`;
}

function ReceiptContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingCode = params.bookingCode as string;
  const token = searchParams.get('token');
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Link tidak valid.'); setLoading(false); return; }
    fetch(`/api/public/bookings/${bookingCode}?token=${token}`)
      .then(res => res.json())
      .then(json => { if (json.success) { if (json.data.status !== 'confirmed') { setError('Struk tersedia setelah pembayaran dikonfirmasi admin.'); } else { setBooking(json.data); } } else { setError(json.error?.message || 'Error'); } })
      .catch(() => setError('Terjadi kesalahan'))
      .finally(() => setLoading(false));
  }, [bookingCode, token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>;
  if (error || !booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-amber-400" />
      <p className="text-gray-700 text-center max-w-sm">{error}</p>
      <Link href="/"><Button variant="outline">Kembali ke beranda</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto px-4">
        {/* Actions */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Link href={`/booking/${bookingCode}?token=${token}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-1"><ArrowLeft className="h-4 w-4" />Kembali</Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Cetak</Button>
            <a href={`/api/receipts/${bookingCode}/pdf?token=${token}`}><Button size="sm"><Download className="h-4 w-4 mr-1" />Download PDF</Button></a>
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-xl shadow-sm border p-8 print:shadow-none print:border-none print:rounded-none">
          <div className="text-center border-b pb-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2"><Home className="h-6 w-6 text-emerald-600" /><span className="text-2xl font-bold text-emerald-600">kos.id</span></div>
            <h1 className="text-lg font-semibold text-gray-800">Struk Pemesanan Kos</h1>
          </div>

          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                ['Kode Booking', booking.bookingCode],
                ['Tanggal Pesan', formatDate(booking.createdAt as string)],
                ['Tanggal Konfirmasi', booking.confirmedAt ? formatDate(booking.confirmedAt as string) : '-'],
                ['', ''],
                ['Nama Pemesan', booking.customerName],
                ['No. WhatsApp', booking.customerWhatsapp],
                ['', ''],
                ['Nama Kos', booking.kosName],
                ['Alamat Kos', booking.kosAddress],
                ['Tipe Kamar', booking.roomTypeName],
                ['Tanggal Mulai Sewa', booking.plannedCheckinDate],
                ['', ''],
                ['Nominal Pembayaran', formatRupiah(booking.paymentAmount as number)],
                ['Status Pembayaran', 'Confirmed'],
                ['WhatsApp Pemilik', booking.ownerWhatsapp],
              ].filter(([k]) => k !== '').map(([label, value], i) => (
                <tr key={i}>
                  <td className="py-2 text-gray-500 pr-4 whitespace-nowrap">{label as string}</td>
                  <td className="py-2 text-gray-900 font-medium text-right">{value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center italic">
              Struk ini adalah bukti pemesanan melalui kos.id. Detail hunian tetap mengikuti peraturan kos dan konfirmasi pengelola.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>}>
      <ReceiptContent />
    </Suspense>
  );
}
