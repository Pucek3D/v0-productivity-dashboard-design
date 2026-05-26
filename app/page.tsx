'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { TodayPriorities, CalendarPanel, PeoplePanel } from '@/components/dashboard/row1-panels'
import { ActiveProjects, InboxCapture } from '@/components/dashboard/row2-panels'
import { HabitsKPIs, QuarterlyOKRs, GoalsTimeline } from '@/components/dashboard/row3-panels'
import { QuickCapture } from '@/components/dashboard/quick-capture'

function PanelCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 flex flex-col overflow-hidden ${className ?? ''}`}>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)

  // Global hotkey: Cmd+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault()
        setCaptureOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onCapture={() => setCaptureOpen(true)} />

        {/* 3-row grid */}
        <main className="flex-1 overflow-hidden p-4 grid grid-rows-[40fr_35fr_25fr] gap-4">

          {/* Row 1 — TODAY */}
          <div className="grid grid-cols-12 gap-4 min-h-0">
            <PanelCard className="col-span-5">
              <TodayPriorities />
            </PanelCard>
            <PanelCard className="col-span-3">
              <CalendarPanel />
            </PanelCard>
            <PanelCard className="col-span-4">
              <PeoplePanel />
            </PanelCard>
          </div>

          {/* Row 2 — PROJECTS */}
          <div className="grid grid-cols-12 gap-4 min-h-0">
            <PanelCard className="col-span-8">
              <ActiveProjects />
            </PanelCard>
            <PanelCard className="col-span-4">
              <InboxCapture />
            </PanelCard>
          </div>

          {/* Row 3 — HORIZON */}
          <div className="grid grid-cols-12 gap-4 min-h-0">
            <PanelCard className="col-span-4">
              <HabitsKPIs />
            </PanelCard>
            <PanelCard className="col-span-4">
              <QuarterlyOKRs />
            </PanelCard>
            <PanelCard className="col-span-4">
              <GoalsTimeline />
            </PanelCard>
          </div>
        </main>
      </div>

      {/* Quick capture modal */}
      <QuickCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCapture={text => console.log('[v0] Captured:', text)}
      />
    </div>
  )
}
