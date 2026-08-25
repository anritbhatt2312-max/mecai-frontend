'use client'

import { LayoutGrid, Home, MessageSquare, FolderOpen } from 'lucide-react'

export default function IconSidebar() {
  return (
    <aside className="w-[56px] min-w-[56px] h-full bg-[#111827] flex flex-col items-center py-4 gap-1">
      {/* Top icons */}
      <div className="flex flex-col items-center gap-1 w-full">
        <SidebarIcon active>
          <LayoutGrid size={18} />
        </SidebarIcon>
        <SidebarIcon>
          <Home size={18} />
        </SidebarIcon>
        <SidebarIcon>
          <MessageSquare size={18} />
        </SidebarIcon>
        <SidebarIcon>
          <FolderOpen size={18} />
        </SidebarIcon>
      </div>

      {/* Bottom avatar */}
      <div className="mt-auto">
        <div className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center text-[11px] font-medium text-white">
          AB
        </div>
      </div>
    </aside>
  )
}

function SidebarIcon({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer
        ${active
          ? 'bg-[#1f2937] text-white'
          : 'text-[#6b7280] hover:bg-[#1f2937] hover:text-[#9ca3af]'
        }`}
    >
      {children}
    </button>
  )
}