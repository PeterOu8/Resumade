import Link from 'next/link';
import { FileUser } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-sm">
      <nav className="flex h-16 items-center justify-between gap-4 px-4 sm:px-12">
        <div className="flex items-center gap-2">
          <FileUser className="w-6 h-6" />
          <Link href="/" className="text-xl font-bold tracking-tight">
            Resumade
          </Link>
        </div>
        <Link href="/editor" className="text-sm font-medium hover:underline">
          Resume editor
        </Link>
      </nav>
    </header>
  );
}
