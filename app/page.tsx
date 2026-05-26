"use client"

import { TopPriorityPanel } from "@/components/panels/top-priority"
import { EventCalendarPanel } from "@/components/panels/event-calendar"
import { MainProjectsPanel } from "@/components/panels/main-projects"
import { KpisPanel } from "@/components/panels/kpis"
import { ProjectProgressPanel } from "@/components/panels/project-progress"
import { ObjectivesPanel } from "@/components/panels/objectives"

export default function DashboardPage() {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-gray-50">
      {/* Top header bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-2 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-sm font-bold text-[#7C3AED] tracking-wide">Kornelia&apos;s Op System</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
          <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs font-bold">K</div>
        </div>
      </header>

      {/* 2-row × 3-column grid — fills remaining viewport */}
      <main
        className="flex-1 min-h-0 grid gap-2 p-2"
        style={{
          gridTemplateRows: "1fr 1fr",
          gridTemplateColumns: "1fr 1fr 1fr",
        }}
        aria-label="Dashboard"
      >
        {/* Row 1 */}
        <TopPriorityPanel />
        <EventCalendarPanel />
        <MainProjectsPanel />

        {/* Row 2 */}
        <KpisPanel />
        <ProjectProgressPanel />
        <ObjectivesPanel />
      </main>
    </div>
  )
}
