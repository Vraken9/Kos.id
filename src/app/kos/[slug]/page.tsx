'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, ArrowLeft, Home, Users, Ruler, Bath, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

const genderLabels: Record<string, string> = { putra: 'Putra', putri: 'Putri', campur: 'Campur' };
const bathroomLabels: Record<string, string> = { inside: 'Kamar Mandi Dalam', outside: 'Kamar Mandi Luar', shared: 'Kamar Mandi Bersama' };
const electricLabels: Record<string, string> = { included: 'Termasuk', token: 'Token Sendiri', separate: 'Bayar Terpisah' };

export default function KosDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [kos, setKos] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerName: '', customerWhatsapp: '', plannedCheckinDate: '', customerNote: '', durationMonths: 1,
  });

  useEffect(() => {
    fetch(`/api/public/kos/${slug}`)
      .then(res => res.json())
      .then(json => { if (json.success) setKos(json.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBooking = async () => {
    if (!selectedRoom || !kos) return;
    if (!form.customerName || form.customerName.length < 2) { toast.error('Nama minimal 2 karakter'); return; }
    if (!form.customerWhatsapp || form.customerWhatsapp.length < 8) { toast.error('Nomor WhatsApp tidak valid'); return; }
    if (!form.plannedCheckinDate) { toast.error('Tanggal mulai sewa wajib diisi'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kosId: kos.id,
          roomTypeId: selectedRoom.id,
          customerName: form.customerName,
          customerWhatsapp: form.customerWhatsapp,
          plannedCheckinDate: form.plannedCheckinDate,
          customerNote: form.customerNote,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Booking berhasil dibuat!');
        window.location.href = json.data.statusUrl;
      } else {
        toast.error(json.error?.message || 'Gagal membuat booking');
      }
    } catch { toast.error('Terjadi kesalahan'); } finally { setSubmitting(false); }
  };

  const openBookingDialog = (room: Record<string, unknown>) => {
    setSelectedRoom(room);
    setBookingOpen(true);
  };

  const waMessage = (roomName?: string) => {
    if (!kos) return '';
    return roomName
      ? `Halo, saya tertarik dengan ${kos.name} tipe ${roomName} yang saya lihat di kos.id. Apakah kamar masih tersedia?`
      : `Halo, saya tertarik dengan ${kos.name} yang saya lihat di kos.id. Apakah kamar masih tersedia?`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!kos) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-gray-700">Kos tidak ditemukan</h2>
        <Link href="/"><Button variant="outline">Kembali ke beranda</Button></Link>
      </div>
    );
  }

  const roomTypes = (kos.roomTypes as Record<string, unknown>[]) || [];
  const facilities = (kos.facilities as Record<string, unknown>[]) || [];
  const photos = (kos.photos as Record<string, unknown>[]) || [];
  const coverUrl = (kos.coverImageUrl as string) || (photos.length > 0 ? photos[0].image_path as string : null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Kembali</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5 text-emerald-600" />
              <span className="text-lg font-bold text-emerald-600">kos.id</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Cover */}
            <div className="rounded-xl overflow-hidden bg-gray-100 h-56 sm:h-72 lg:h-80 mb-6">
              {coverUrl ? (
                <img src={coverUrl} alt={kos.name as string} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                  <Home className="h-16 w-16 text-emerald-300" />
                </div>
              )}
            </div>

            {/* Gallery */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                {photos.slice(0, 6).map((photo, i) => (
                  <img key={i} src={photo.image_path as string} alt={photo.alt_text as string || ''} className="h-20 w-28 object-cover rounded-lg shrink-0" />
                ))}
              </div>
            )}

            {/* Info */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={(kos.gender_type as string) as 'putra' | 'putri' | 'campur'}>
                  {genderLabels[kos.gender_type as string] || kos.gender_type as string}
                </Badge>
                {kos.is_featured === 1 && <Badge variant="warning"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{kos.name as string}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{kos.address as string}</span>
                {kos.distanceKm !== null && (
                  <span className="text-emerald-600 font-medium">{kos.distanceKm as number} km dari kampus</span>
                )}
              </div>
              </div>

            {/* Description */}
            {(kos.description as string) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-900">Deskripsi</h2>
                <div className="text-gray-600 text-sm leading-relaxed">
                  {(kos.description as string).split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
                </div>
              </div>
            )}

            {/* Facilities */}
            {facilities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Fasilitas Umum</h2>
                <div className="flex flex-wrap gap-2">
                  {facilities.map((f) => (
                    <span key={f.id as number} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm">
                      {f.name as string}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Tipe Kamar</h2>
              <div className="space-y-4">
                {roomTypes.map((room) => {
                  const rtFacilities = (room.facilities as Record<string, unknown>[]) || [];
                  const stockAvailable = room.stock_available as number;
                  return (
                    <Card key={room.id as number}>
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{room.name as string}</h3>
                              <Badge variant={stockAvailable > 0 ? 'default' : 'destructive'}>
                                {stockAvailable > 0 ? `${stockAvailable} tersedia` : 'Penuh'}
                              </Badge>
                            </div>
                            {(room.description as string) && <p className="text-sm text-gray-500 mb-3">{room.description as string}</p>}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                              {(room.room_size as string) && <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{room.room_size as string}</span>}
                              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{bathroomLabels[room.bathroom_type as string]}</span>
                              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" />Listrik: {electricLabels[room.electricity_type as string]}</span>
                            </div>
                            {rtFacilities.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {rtFacilities.map(f => (
                                  <span key={f.id as number} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f.name as string}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="sm:text-right shrink-0 flex flex-col items-start sm:items-end gap-2">
                            <p className="text-xl font-bold text-emerald-700">{formatRupiah(room.price_monthly as number)}</p>
                            <p className="text-xs text-gray-500">per bulan</p>
                            <div className="flex gap-2 mt-1">
                              <a
                                href={`https://wa.me/${kos.owner_whatsapp}?text=${encodeURIComponent(waMessage(room.name as string))}`}
                                target="_blank" rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm"><Phone className="h-3.5 w-3.5 mr-1" />Tanya</Button>
                              </a>
                              <Button size="sm" disabled={stockAvailable <= 0} onClick={() => openBookingDialog(room)}>
                                Pesan
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Rules */}
            {(kos.rules as string) && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-900">Peraturan Kos</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-gray-700">
                  {(kos.rules as string).split('\n').map((line, i) => <p key={i} className="mb-1">• {line}</p>)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-20 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Info Pemilik</h3>
              {(kos.owner_name as string) && <p className="text-sm text-gray-600 mb-1">{kos.owner_name as string}</p>}
              <a
                href={`https://wa.me/${kos.owner_whatsapp}?text=${encodeURIComponent(waMessage())}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 mt-2">
                  <Phone className="h-4 w-4 mr-2" />
                  Tanya Pemilik via WhatsApp
                </Button>
              </a>
              {(kos.campus as Record<string, unknown>) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Kampus acuan</p>
                  <p className="text-sm font-medium text-gray-700">{(kos.campus as Record<string, unknown>).name as string}</p>
                  {kos.distanceKm !== null && <p className="text-sm text-emerald-600 mt-1">{kos.distanceKm as number} km dari kampus</p>}
                </div>
              )}
            </div>

            <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Lokasi Kos</h3>
              </div>
              {(kos.latitude && kos.longitude) ? (
                <iframe 
                  width="100%" 
                  height="250" 
                  frameBorder={0}
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={`https://maps.google.com/maps?q=${kos.latitude},${kos.longitude}&hl=id&z=15&output=embed`}
                ></iframe>
              ) : (
                <div className="bg-gray-100 h-[250px] flex items-center justify-center text-gray-500">Peta tidak tersedia</div>
              )}
              {(kos.google_maps_url as string) && (
                <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                  <a href={kos.google_maps_url as string} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                    Buka di Aplikasi Google Maps →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pesan Kamar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRoom && (
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="font-medium text-emerald-800">{selectedRoom.name as string}</p>
                <p className="text-emerald-700 text-sm">{formatRupiah(selectedRoom.price_monthly as number)}/bulan</p>
              </div>
            )}
            <div>
              <Label>Nama Lengkap *</Label>
              <Input placeholder="Nama lengkap Anda" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Durasi Sewa (Bulan) *</Label>
              <Input type="number" min="1" max="60" value={form.durationMonths} onChange={e => setForm({ ...form, durationMonths: parseInt(e.target.value) || 1 })} className="mt-1" />
            </div>
            <div>
              <Label>Nomor WhatsApp *</Label>
              <Input placeholder="08123456789" value={form.customerWhatsapp} onChange={e => setForm(f => ({ ...f, customerWhatsapp: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Tanggal Mulai Sewa *</Label>
              <Input type="date" value={form.plannedCheckinDate} onChange={e => setForm(f => ({ ...f, plannedCheckinDate: e.target.value }))} className="mt-1" min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label>Catatan (opsional)</Label>
              <Textarea placeholder="Catatan untuk pemilik kos" value={form.customerNote} onChange={e => setForm(f => ({ ...f, customerNote: e.target.value }))} className="mt-1" />
            </div>
            <Button className="w-full" disabled={submitting} onClick={handleBooking}>
              {submitting ? 'Memproses...' : 'Buat Pesanan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
