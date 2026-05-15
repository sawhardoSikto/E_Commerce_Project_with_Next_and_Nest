'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2026);
  useEffect(() => { setCurrentYear(new Date().getFullYear()); }, []);

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <Link href="/products" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Shop<span className="text-indigo-600">Nest</span></span>
        </Link>

        <p className="text-xs text-gray-400">© {currentYear} ShopNest. All rights reserved.</p>

        <div className="flex items-center gap-3">
          <Link href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy</Link>
          <Link href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}