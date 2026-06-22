import Link from 'next/link';
import { MapPin, Phone, Mail, Home } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8 mt-16 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">kos.id</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Platform pencarian dan pemesanan kos terbaik di sekitar area kampus Kebumen. 
              Membantu mahasiswa menemukan tempat tinggal yang nyaman dan aman.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6">Hubungi Kami</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Universitas Ma'arif Nahdlatul Ulama<br />
                  Kebumen, Jawa Tengah, Indonesia
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-500 shrink-0" />
                <a href="https://wa.me/089530123608" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                  0895-3012-3608
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-emerald-500 shrink-0" />
                <a href="mailto:akhyarmualif422006@gmail.com" className="hover:text-emerald-400 transition-colors">
                  akhyarmualif422006@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Tautan Cepat</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">Beranda</Link>
              </li>
              <li>
                <Link href="/cek-pesanan" className="hover:text-emerald-400 transition-colors">Cek Status Pesanan</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi (Privacy Policy)</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Kos.id. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
