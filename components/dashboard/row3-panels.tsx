"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, Flame, TrendingUp } from "lucide-react"

// ─── KPIs & Habits Panel ────────────────────────────────────────────

interface Habit {
  id: string
  label: string
  done: boolean
  streak: number
  weekPct: number
  rule: string
}

const initialHabits: Habit[] = [
  { id: "h1", label: "20-min workout", done: true, streak: 12, weekPct: 86, rule: "Daily" },
  { id: "h2", label: "Deep work block (2h)", done: false, streak: 5, weekPct: 71, rule: "Weekdays" },
  { id: "h3", label: "Evening shutdown ritual", done: false, streak: 3, weekPct: 57, rule: "Daily" },
]

interface KPI {
  label: string
  value: string
  unit: string
  trend: "up" | "down" | "neutral"
  sparkline: number[]
}

const kpis: KPI[] = [
  { label: "Sleep", value: "7.2", unit: "hrs", trend: "up", sparkline: [6.5, 7.0, 6.8, 7.5, 7.2, 6.9, 7.2] },
  { label: "Steps", value: "9.4k", unit: "", trend: "neutral", sparkline: [8.2, 9.1, 7.8, 10.2, 8.9, 9.4, 9.4] },
  { label: "HRV", value: "58", unit: "ms", trend: "down", sparkline: [65, 62, 60, 58, 57, 59, 58] },
]

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 40
  const h = 14
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function KpisHabits() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits)

  const toggle = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)))
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Habits & KPIs</h2>
        <span className="text-[10px] text-foreground-subtle">3 habits &middot; glanceable only</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Habits */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider">Today&apos;s habits</p>
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-2.5 px-1 py-1.5 rounded hover:bg-surface-raised transition-colors">
              <button
                onClick={() => toggle(habit.id)}
                className={cn(
                  "flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors",
                  habit.done ? "bg-status-done border-status-done" : "border-border-subtle hover:border-accent-color"
                )}
              >
                {habit.done && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span className={cn("text-xs flex-1 truncate", habit.done ? "text-foreground-subtle line-through" : "text-foreground")}>
                {habit.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-foreground-subtle">{habit.weekPct}% wk</span>
                <div className="flex items-center gap-0.5 text-[10px] text-status-due-soon">
                  <Flame className="w-3 h-3" />
                  <span className="font-mono">{habit.streak}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider">Health KPIs</p>
          <div className="grid grid-cols-3 gap-2">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-muted rounded-md px-2.5 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-foreground-subtle">{kpi.label}</span>
                  <TrendingUp className={cn("w-2.5 h-2.5",
                    kpi.trend === "up" ? "text-status-done" :
                    kpi.trend === "down" ? "text-status-overdue rotate-180" :
                    "text-foreground-subtle"
                  )} />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-semibold text-foreground font-mono">{kpi.value}</span>
                  {kpi.unit && <span className="text-[10px] text-foreground-subtle">{kpi.unit}</span>}
                </div>
                <MiniSparkline
                  values={kpi.sparkline}
                  color={kpi.trend === "up" ? "oklch(0.60 0.15 155)" : kpi.trend === "down" ? "oklch(0.55 0.20 25)" : "oklch(0.56 0 0)"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Quarterly OKRs Panel ────────────────────────────────────────────

interface KeyResult {
  label: string
  progress: number
  unit: string
}

interface Objective {
  id: string
  title: string
  progress: number
  keyResults: KeyResult[]
  expanded?: boolean
}

const initialOkrs: Objective[] = [
  {
    id: "okr1",
    title: "Become the go-to strategy partner for 3 new clients",
    progress: 67,
    keyResults: [
      { label: "Active pipeline meetings", progress: 80, unit: "4/5 targets" },
      { label: "Proposals submitted", progress: 60, unit: "3/5" },
      { label: "Signed LOIs", progress: 33, unit: "1/3" },
    ],
  },
  {
    id: "okr2",
    title: "Deliver Meridian merger with 95%+ client sat",
    progress: 38,
    keyResults: [
      { label: "Milestones on track", progress: 38, unit: "3/8" },
      { label: "Client NPS", progress: 80, unit: "8.0/10" },
    ],
  },
  {
    id: "okr3",
    title: "Build a sustainable deep-work practice",
    progress: 54,
    keyResults: [
      { label: "2h deep-work blocks / week", progress: 71, unit: "5/7 days" },
      { label: "Weekly shutdown completed", progress: 57, unit: "4/7 wks" },
      { label: "Inbox zero achieved", progress: 43, unit: "3/7 wks" },
    ],
  },
]

export function QuarterlyOkrs() {
  const [okrs, setOkrs] = useState<Objective[]>(
    initialOkrs.map((o) => ({ ...o, expanded: false }))
  )

  const toggle = (id: string) => {
    setOkrs((prev) =>
      prev.map((o) => (o.id === id ? { ...o, expanded: !o.expanded } : o))
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Q2 Objectives</h2>
        <span className="text-[10px] text-foreground-subtle">OKR framework &middot; reviewed quarterly</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {okrs.map((okr) => (
          <div key={okr.id} className="rounded-md border border-border-subtle overflow-hidden">
            <button
              onClick={() => toggle(okr.id)}
              className="w-full flex items-start gap-2.5 p-3 hover:bg-surface-raised transition-colors text-left"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground leading-snug flex-1">{okr.title}</p>
                  <span className="text-[10px] font-mono text-foreground-muted shrink-0">{okr.progress}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-color transition-all"
                    style={{ width: `${okr.progress}%` }}
                  />
                </div>
              </div>
              <span className={cn("text-foreground-subtle mt-0.5 transition-transform shrink-0", okr.expanded ? "rotate-90" : "")}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {okr.expanded && (
              <div className="px-3 pb-3 space-y-1.5 border-t border-border-subtle">
                {okr.keyResults.map((kr, i) => (
                  <div key={i} className="flex items-center gap-2 pt-1.5">
                    <div className="w-1 h-1 rounded-full bg-foreground-subtle shrink-0 ml-1" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-[11px] text-foreground-muted truncate">{kr.label}</span>
                        <span className="text-[10px] text-foreground-subtle shrink-0">{kr.unit}</span>
                      </div>
                      <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent-color/60"
                          style={{ width: `${kr.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Goals Timeline Panel ────────────────────────────────────────────

interface Milestone {
  id: string
  label: string
  date: string
  week: number // 1-13 (quarter weeks)
  done: boolean
  color: string
}

const currentWeek = 8 // simulated: week 8 of Q2

const milestones: Milestone[] = [
  { id: "m1", label: "ACME Board deck", date: "Jun 3", week: 9, done: false, color: "bg-accent-color" },
  { id: "m2", label: "Legal NDA", date: "May 30", week: 8, done: false, color: "bg-status-overdue" },
  { id: "m3", label: "BD Proposal", date: "Jun 1", week: 9, done: false, color: "bg-status-done" },
  { id: "m4", label: "OKR Workshop", date: "Jun 10", week: 10, done: false, color: "bg-status-due-soon" },
  { id: "m5", label: "Berlin Offsite", date: "Jun 20", week: 12, done: false, color: "bg-foreground-subtle" },
]

const quarterGoals = [
  { label: "Run Berlin half-marathon", progress: 60, deadline: "Sep 28" },
  { label: "Close 2 new client mandates", progress: 50, deadline: "Aug 31" },
  { label: "Publish thought-leadership piece", progress: 20, deadline: "Jul 15" },
]

export function GoalsTimeline() {
  const totalWeeks = 13
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Goals Timeline</h2>
        <span className="text-[10px] text-foreground-subtle">Q2 2026 &middot; Wk {currentWeek} of 13</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Quarter Gantt strip */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider">Quarter milestones</p>
          <div className="relative h-6">
            {/* Week track */}
            <div className="flex h-full items-center gap-0.5">
              {weeks.map((w) => (
                <div
                  key={w}
                  className={cn(
                    "flex-1 h-1 rounded-sm transition-colors",
                    w < currentWeek ? "bg-accent-color/40" : w === currentWeek ? "bg-accent-color" : "bg-muted"
                  )}
                />
              ))}
            </div>
            {/* Current week marker */}
            <div
              className="absolute top-0 bottom-0 flex items-center"
              style={{ left: `${((currentWeek - 1) / totalWeeks) * 100}%` }}
            >
              <div className="w-0.5 h-5 bg-accent-color rounded-full" />
            </div>
          </div>
          {/* Milestones */}
          <div className="relative h-6">
            {milestones.map((ms) => (
              <div
                key={ms.id}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${((ms.week - 1) / totalWeeks) * 100}%`, transform: "translateX(-50%)" }}
                title={`${ms.label} — ${ms.date}`}
              >
                <div className={cn("w-2 h-2 rounded-full border-2 border-background", ms.color)} />
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-0.5">
            {milestones.map((ms) => (
              <div key={ms.id} className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", ms.color)} />
                <span className="text-[10px] text-foreground-subtle">{ms.label}</span>
                <span className="text-[10px] text-foreground-subtle/60">{ms.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Long-term goals */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-foreground-subtle uppercase tracking-wider">Long-term goals</p>
          {quarterGoals.map((goal, i) => (
            <div key={i} className="space-y-1 px-1 py-1.5 rounded hover:bg-surface-raised transition-colors">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-foreground truncate">{goal.label}</span>
                <span className="text-[10px] text-foreground-subtle shrink-0">by {goal.deadline}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-color/70"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-foreground-subtle w-7 text-right">{goal.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
