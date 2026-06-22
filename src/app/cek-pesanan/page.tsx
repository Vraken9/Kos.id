'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, ShieldCheck, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import Footer from '@/components/Footer';

export default function CekPesananPage() {
  const router = useRouter();
  const [form, setForm] = useState({ bookingCode: '', customerWhatsapp: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bookingCode.trim() || !form.customerWhatsapp.trim()) {
      toast.error('Harap lengkapi form');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/public/bookings/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Pesanan ditemukan!');
        router.push(`/booking/${json.data.bookingCode}?token=${json.data.token}`);
      } else {
        toast.error(json.error?.message || 'Gagal mengecek pesanan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-emerald-600" />
              <span className="text-xl font-bold text-emerald-600">kos.id</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-emerald-100 shadow-xl shadow-emerald-900/5">
            <CardHeader className="text-center space-y-2 pb-6 border-b border-gray-100">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <Search className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Cek Pesanan Anda</CardTitle>
              <CardDescription>
                Lacak status pesanan kos Anda tanpa perlu login.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bookingCode">Kode Booking</Label>
                  <Input 
                    id="bookingCode"
                    placeholder="Contoh: BKG-ABCD-1234" 
                    value={form.bookingCode}
                    onChange={(e) => setForm({ ...form, bookingCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Nomor WhatsApp Pemesan</Label>
                  <Input 
                    id="whatsapp"
                    type="tel"
                    placeholder="Contoh: 081234567890" 
                    value={form.customerWhatsapp}
                    onChange={(e) => setForm({ ...form, customerWhatsapp: e.target.value })}
                    required
                  />
                </div>

                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2 items-start">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Kode booking dan nomor WhatsApp digunakan sebagai validasi keamanan untuk melindungi data pesanan Anda.</p>
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? 'Mencari...' : (
                    <>Cek Status Pesanan <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
