// frontend/components/Layout/LeftNav.tsx
import React from 'react';
import { Home, Search, Star, Settings } from 'lucide-react';

export default function LeftNav({ status = 'Guest' }: { status?: string }) {
  return (
    <aside className="w-18 md:w-20 lg:w-24 px-2 py-4 flex flex-col items-center bg-[color:var(--surface)]/40 backdrop-blur-sm">
      <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
        <img src="/logo.svg" alt="Trivora" className="w-7 h-7" />
      </button>

      <nav className="flex-1 flex flex-col items-center space-y-3 mt-4">
        <button className="p-2 rounded hover:bg-white/5">
          <Home size={18} />
        </button>
        <button className="p-2 rounded bg-white/6">
          <Search size={18} />
        </button>
        <button className="p-2 rounded hover:bg-white/5">
          <Star size={18} />
        </button>
        <button className="p-2 rounded hover:bg-white/5">
          <Settings size={18} />
        </button>
      </nav>

      <div className="mb-2 text-xs text-[color:var(--muted)]">{status}</div>
    </aside>
  )
}
