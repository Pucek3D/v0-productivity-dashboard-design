"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  Users,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react"

type NavItem = {
  id: string
  label: string
  icon: React.ElementType
  shortcut: string
}

const navItems: NavItem[] = [
  { id: "today", label: "Today", icon: LayoutDashboard, shortcut: "1" },
  { id: "inbox", label: "Inbox", icon: Inbox, shortcut: "2" },
  { id: "projects", label: "Projects", icon: FolderKanban, shortcut: "3" },
  { id: "people", label: "People", icon: Users, shortcut: "4" },
  { id: "goals", label: "Goals", icon: Target, shortcut: "5" },
]

interface SidebarProps {
  activeItem?: string
  onItemSelect?: (id: string) => void
}

export function Sidebar({ activeItem = "today", onItemSelect }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border bg-sidebar transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-12 px-3 border-b border-border", collapsed ? "justify-center" : "gap-2.5")}>
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent-color shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-foreground truncate">Op System</span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          return (
            <button
              key={item.id}
              onClick={() => onItemSelect?.(item.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors w-full text-left group",
                isActive
                  ? "bg-accent-color-subtle text-accent-color"
                  : "text-foreground-muted hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-accent-color" : "")} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  <kbd className="text-[10px] text-foreground-subtle font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.shortcut}
                  </kbd>
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border flex flex-col gap-0.5">
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors w-full text-left",
            "text-foreground-muted hover:bg-muted hover:text-foreground"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors w-full text-left text-foreground-muted hover:bg-muted hover:text-foreground"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
