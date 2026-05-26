'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Inbox,
  FolderOpen,
  Users,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Today', shortcut: '1' },
  { icon: Inbox, label: 'Inbox', shortcut: '2', badge: 7 },
  { icon: FolderOpen, label: 'Projects', shortcut: '3' },
  { icon: Users, label: 'People', shortcut: '4' },
  { icon: Target, label: 'Goals', shortcut: '5' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [active, setActive] = useState('Today')

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-border bg-sidebar transition-all duration-200',
        collapsed ? 'w-16' : 'w-[220px]'
      )}
    >
      {/* Logo / header */}
      <div className="flex items-center h-12 px-3 border-b border-sidebar-border shrink-0">
        <div className="w-6 h-6 rounded bg-accent-brand flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-primary-foreground">K</span>
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-[13px] font-semibold text-foreground truncate">
            Kornelia
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 flex flex-col gap-0.5 overflow-hidden">
        {navItems.map(({ icon: Icon, label, shortcut, badge }) => (
          <button
            key={label}
            onClick={() => setActive(label)}
            title={label}
            className={cn(
              'group flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-[13px] transition-colors',
              active === label
                ? 'bg-accent-brand-subtle text-accent-brand font-medium'
                : 'text-foreground-muted hover:bg-surface hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{label}</span>
                {badge ? (
                  <span className="text-[10px] bg-accent-brand text-primary-foreground rounded-full px-1.5 py-0 leading-4">
                    {badge}
                  </span>
                ) : (
                  <span className="text-[10px] text-foreground-subtle opacity-0 group-hover:opacity-100">
                    {shortcut}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 flex flex-col gap-0.5 border-t border-sidebar-border pt-2">
        <button
          title="Settings"
          className="flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-[13px] text-foreground-muted hover:bg-surface hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-[13px] text-foreground-subtle hover:bg-surface hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
