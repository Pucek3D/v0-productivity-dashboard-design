"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { TodayPriorities, CalendarPanel, PeoplePanel } from "@/components/dashboard/row1-panels"
import { ActiveProjects, InboxPanel } from "@/components/dashboard/row2-panels"
import { KpisHabits, QuarterlyOkrs, GoalsTimeline } from "@/components/dashboard/row3-panels"

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("today")
  const [inboxItems, setInboxItems] = useState<string[]>([])

  const handleCapture = (text: string) => {
    setInboxItems((prev) => [text, ...prev])
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar activeItem={activeNav} onItemSelect={setActiveNav} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onQuickCapture={handleCapture} />

        {/* Dashboard grid */}
        <main className="flex-1 overflow-y-auto p-3 space-y-3" aria-label="Dashboard">
          {/* Row 1 — TODAY (hero row) */}
          <section
            aria-label="Today"
            className="grid gap-3"
            style={{ gridTemplateColumns: "5fr 3fr 4fr", height: "clamp(240px, 38vh, 380px)" }}
          >
            <TodayPriorities />
            <CalendarPanel />
            <PeoplePanel />
          </section>

          {/* Row 2 — PROJECTS */}
          <section
            aria-label="Projects and Inbox"
            className="grid gap-3"
            style={{ gridTemplateColumns: "8fr 4fr", height: "clamp(200px, 30vh, 320px)" }}
          >
            <ActiveProjects />
            <InboxPanel />
          </section>

          {/* Row 3 — HORIZON */}
          <section
            aria-label="Habits, OKRs, and Goals"
            className="grid grid-cols-3 gap-3"
            style={{ height: "clamp(200px, 26vh, 300px)" }}
          >
            <KpisHabits />
            <QuarterlyOkrs />
            <GoalsTimeline />
          </section>
        </main>
      </div>
    </div>
  )
}
