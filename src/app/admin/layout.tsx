'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutDashboard, Building2, ListChecks, Settings, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/kos', label: 'Kelola Kos', icon: Building2 },
  { href: '/admin/facilities', label: 'Fasilitas', icon: ListChecks },
  { href: '/admin/bookings', label: 'Booking', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ username: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') { setLoading(false); return; }

    fetch('/api/admin/auth/me')
      .then(res => res.json())
      .then(json => {
        if (json.success) { setAdmin(json.data.admin); }
        else { router.replace('/admin/login'); }
      })
      .catch(() => router.replace('/admin/login'))
      .finally(() => setLoading(false));
  }, [pathname, router]);

  if (pathname === '/admin/login') return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!admin) return null;

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-emerald-600" />
            <span className="text-lg font-bold text-emerald-600">kos.id</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2 truncate">{admin.name}</div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1"><Button variant="ghost" size="sm" className="w-full text-xs">Lihat Site</Button></Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600" /></button>
          <span className="ml-3 font-semibold text-gray-900">Admin Panel</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
