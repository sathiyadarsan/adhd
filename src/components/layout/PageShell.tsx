import type { ReactNode } from 'react';
import { TabBar } from './TabBar';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 bg-white min-h-screen shadow-sm">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
