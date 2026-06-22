'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Filter, X, SlidersHorizontal, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface KosItem {
  id: number;
  name: string;
  slug: string;
  address: string;
  coverImageUrl: string | null;
  genderType: string;
  distanceKm: number | null;
  minimumPrice: number | null;
  availableStock: number;
  isAvailable: boolean;
  facilities: { name: string; slug: string; iconKey: string | null }[];
}

interface CampusInfo {
  name: string;
  address: string | null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const genderLabels: Record<string, string> = {
  putra: 'Putra',
  putri: 'Putri',
  campur: 'Campur',
};

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [kosList, setKosList] = useState<KosItem[]>([]);
  const [campus, setCampus] = useState<CampusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state from URL
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [maxDistance, setMaxDistance] = useState(searchParams.get('maxDistanceKm') || '');
  const [genderType, setGenderType] = useState(searchParams.get('genderType') || '');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('availableOnly') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'recommended');
  const [page, setPage] = useState(Number(searchParams.get('page') || '1'));

  const fetchKos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('q', keyword);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (maxDistance) params.set('maxDistanceKm', maxDistance);
      if (genderType) params.set('genderType', genderType);
      if (availableOnly) params.set('availableOnly', 'true');
      if (sort) params.set('sort', sort);
      params.set('page', String(page));

      const res = await fetch(`/api/public/kos?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setKosList(json.data.items);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching kos:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, minPrice, maxPrice, maxDistance, genderType, availableOnly, sort, page]);

  useEffect(() => {
    fetch('/api/public/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.campus) {
          setCampus(json.data.campus);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchKos();
  }, [fetchKos]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (maxDistance) params.set('maxDistanceKm', maxDistance);
    if (genderType) params.set('genderType', genderType);
    if (availableOnly) params.set('availableOnly', 'true');
    if (sort !== 'recommended') params.set('sort', sort);

    router.push(`/?${params.toString()}`);
    setPage(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setKeyword(''); setMinPrice(''); setMaxPrice('');
    setMaxDistance(''); setGenderType(''); setAvailableOnly(false);
    setSort('recommended'); setPage(1);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-emerald-600" />
              <span className="text-xl font-bold text-emerald-600">kos.id</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/admin/login">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Search Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Temukan Kos Terbaik
            </h1>
            {campus && (
              <p className="text-emerald-100 text-sm sm:text-base flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                Sekitar {campus.name}
              </p>
            )}
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama kos atau alamat..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="pl-9 bg-white text-gray-900 h-12"
                />
              </div>
              <Button onClick={applyFilters} size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-white">
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filter
                </h2>
                <button onClick={resetFilters} className="text-xs text-emerald-600 hover:underline">Reset</button>
              </div>

              <div className="space-y-4">
                {/* Price */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Harga/bulan</label>
                  <div className="flex gap-2">
                    <Input placeholder="Min" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="text-xs h-9" />
                    <Input placeholder="Max" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="text-xs h-9" />
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Jarak maks dari kampus</label>
                  <select
                    value={maxDistance}
                    onChange={e => setMaxDistance(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Semua jarak</option>
                    <option value="1">≤ 1 km</option>
                    <option value="2">≤ 2 km</option>
                    <option value="3">≤ 3 km</option>
                    <option value="5">≤ 5 km</option>
                    <option value="10">≤ 10 km</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tipe Penghuni</label>
                  <select
                    value={genderType}
                    onChange={e => setGenderType(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Semua</option>
                    <option value="putra">Putra</option>
                    <option value="putri">Putri</option>
                    <option value="campur">Campur</option>
                  </select>
                </div>

                {/* Available Only */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={e => setAvailableOnly(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Kamar tersedia saja</span>
                </label>

                {/* Sort */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Urutkan</label>
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="recommended">Rekomendasi</option>
                    <option value="nearest">Terdekat</option>
                    <option value="cheapest">Termurah</option>
                    <option value="highest_price">Termahal</option>
                    <option value="most_available">Stok terbanyak</option>
                  </select>
                </div>

                <Button onClick={applyFilters} className="w-full">Terapkan Filter</Button>
              </div>
            </div>
          </aside>

          {/* Kos List */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? 'Memuat...' : `${kosList.length} kos ditemukan`}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-44 bg-gray-200 rounded-t-xl" />
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : kosList.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Kos tidak ditemukan</h3>
                <p className="text-gray-500 mb-4">Coba ubah filter pencarian.</p>
                <Button variant="outline" onClick={resetFilters}>Reset Filter</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {kosList.map((kos) => (
                    <Link key={kos.id} href={`/kos/${kos.slug}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer h-full">
                        <div className="relative h-44 bg-gray-100 overflow-hidden">
                          {kos.coverImageUrl ? (
                            <img src={kos.coverImageUrl} alt={kos.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                              <Home className="h-10 w-10 text-emerald-300" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <Badge variant={kos.genderType as 'putra' | 'putri' | 'campur'}>
                              {genderLabels[kos.genderType] || kos.genderType}
                            </Badge>
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge variant={kos.isAvailable ? 'default' : 'destructive'}>
                              {kos.isAvailable ? 'Tersedia' : 'Penuh'}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{kos.name}</h3>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {kos.address}
                          </p>
                          <div className="flex items-center justify-between mb-3">
                            {kos.distanceKm !== null && (
                              <span className="text-xs text-emerald-600 font-medium">
                                {kos.distanceKm} km dari kampus
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {kos.availableStock} kamar tersedia
                            </span>
                          </div>
                          {kos.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {kos.facilities.slice(0, 4).map(f => (
                                <span key={f.slug} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  {f.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-sm font-bold text-emerald-700">
                              {kos.minimumPrice ? `Mulai ${formatRupiah(kos.minimumPrice)}/bulan` : 'Harga belum tersedia'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
                    <span className="text-sm text-gray-500 flex items-center px-3">Hal {page} dari {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>}>
      <HomePageContent />
    </Suspense>
  );
}
