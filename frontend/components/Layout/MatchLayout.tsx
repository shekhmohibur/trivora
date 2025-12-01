// frontend/components/Layout/MatchLayout.tsx
import React from 'react';
import LeftNav from './LeftNav';

export default function MatchLayout({ children, profile }: { children: React.ReactNode, profile?: any }) {
  return (
    <div className="min-h-screen flex">
      <LeftNav status={profile?.badge || 'Guest'} />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {children}
      </main>
      <aside className="hidden lg:block w-72 p-4">
        {/* Reserve right profile panel content here (ProfileDrawer can be used) */}
      </aside>
    </div>
  )
}
