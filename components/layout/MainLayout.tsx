'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import type { LayoutProps } from '@/types';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isHomePage = pathname === '/';

  const handleMenuClick = () => {
    console.log('🍔 Burger menu clicked, toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Mobile viewport height fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  return (
    <div className="flex h-screen main-layout w-screen overflow-hidden">
      {/* Unified Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={handleMenuClick} />
        <main className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${isHomePage ? 'bg-white' : 'bg-secondary-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

