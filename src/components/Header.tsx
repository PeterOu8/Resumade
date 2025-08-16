'use client';

import Link from 'next/link';
import { FileUser } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm border-b">
      <nav className="flex items-center gap-8 h-16 justify-between px-12">
        <div className="flex items-center gap-2">
          <FileUser className="w-6 h-6" />
          <Link href="/" className="text-xl font-bold tracking-tight">
            Resumade
          </Link>
        </div>
        <ThemeToggle />
      </nav>
    </header>
  );
}
