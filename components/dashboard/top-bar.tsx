'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Command } from 'lucide-react'

interface TopBarProps {
  onCapture: () => void
}

export function TopBar({ onCapture }: TopBarProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="h-12 flex items-center px-4 gap-4 border-b border-border bg-background shrink-0">
      {/* Date + time */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[13px] font-medium text-foreground">{dateStr}</span>
        <span className="text-[12px] text-foreground-muted">{timeStr}</span>
      </div>

      {/* Search / command bar */}
      <button className="flex-1 max-w-xs flex items-center gap-2 h-7 rounded-md bg-surface border border-border px-2.5 text-[12px] text-foreground-muted hover:border-accent-brand transition-colors">
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <span className="flex items-center gap-0.5 text-foreground-subtle">
          <Command className="w-3 h-3" />
          <span>K</span>
        </span>
      </button>

      <div className="flex-1" />

      {/* Quick capture */}
      <button
        onClick={onCapture}
        className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-accent-brand text-primary-foreground text-[12px] font-medium hover:bg-accent-brand-hover transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Capture</span>
        <span className="text-primary-foreground/60 text-[11px] ml-0.5">⇧⌘A</span>
      </button>
    </header>
  )
}
