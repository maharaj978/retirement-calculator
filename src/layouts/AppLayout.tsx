import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#181818] flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">R</span>
            </div>
            <span className="text-sm font-semibold text-[#181818] tracking-tight">Retirement Planner</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium">India · 2026</span>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
        {children}
      </main>
    </div>
  )
}
