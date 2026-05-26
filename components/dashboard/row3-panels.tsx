'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── KPIs & Habits ────────────────────────────────────────────────────────────

interface Habit {
  id: string
  label: string
  rule: string
  streak: number
  weekPct: number
  done: boolean
}

const HABITS: Habit[] = [
  { id: 'h1', label: 'Morning journal', rule: '10 min write', streak: 12, weekPct: 86, done: true },
  { id: 'h2', label: '30-min workout', rule: '30 min move', streak: 4, weekPct: 57, done: false },
  { id: 'h3', label: 'No late screen', rule: 'Off by 22:00', streak: 1, weekPct: 43, done: false },
]

interface KPI {
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'flat'
  spark: number[]
}

const KPIS: KPI[] = [
  { label: 'Sleep', value: '7.2', unit: 'h', trend: 'up', spark: [6.5, 7.0, 6.8, 7.4, 7.1, 6.9, 7.2] },
  { label: 'Steps', value: '8.4k', unit: '', trend: 'flat', spark: [9200, 7800, 8100, 6900, 8400, 9100, 8400] },
  { label: 'HRV', value: '54', unit: 'ms', trend: 'down', spark: [58, 56, 55, 57, 53, 52, 54] },
]

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 40
  const h = 16
  const step = w / (data.length - 1)
  const pts = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HabitsKPIs() {
  const [habits, setHabits] = useState(HABITS)

  const toggle = (id: string) =>
    setHabits(hs => hs.map(h => h.id === id ? { ...h, done: !h.done } : h))

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Habits & KPIs
        </h2>
      </div>

      {/* Habits */}
      <div className="flex flex-col gap-1">
        {habits.map(h => (
          <div key={h.id} className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-raised transition-colors">
            <button
              onClick={() => toggle(h.id)}
              className={cn(
                'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                h.done ? 'bg-status-done border-status-done' : 'border-border hover:border-foreground-muted'
              )}
            >
              {h.done && <Check className="w-2.5 h-2.5 text-background" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('text-[13px]', h.done ? 'line-through text-foreground-subtle' : 'text-foreground')}>
                {h.label}
              </p>
              <p className="text-[11px] text-foreground-subtle">{h.rule}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-medium text-foreground-muted">{h.streak}d streak</p>
              <p className="text-[10px] text-foreground-subtle">{h.weekPct}% wk</p>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* KPIs */}
      <div className="flex flex-col gap-1.5">
        {KPIS.map(kpi => (
          <div key={kpi.label} className="flex items-center gap-2.5 px-2 py-1">
            <span className="text-[12px] text-foreground-muted w-10 shrink-0">{kpi.label}</span>
            <div className="flex-1 flex items-center gap-1">
              <span className="text-[15px] font-semibold text-foreground">{kpi.value}</span>
              {kpi.unit && <span className="text-[11px] text-foreground-subtle">{kpi.unit}</span>}
            </div>
            <Sparkline
              data={kpi.spark}
              color={
                kpi.trend === 'up' ? 'oklch(0.60 0.15 155)' :
                kpi.trend === 'down' ? 'oklch(0.58 0.21 25)' :
                'oklch(0.55 0 0)'
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Quarterly OKRs ───────────────────────────────────────────────────────────

interface KeyResult {
  id: string
  label: string
  progress: number
  target: string
}

interface Objective {
  id: string
  label: string
  progress: number
  krs: KeyResult[]
}

const OBJECTIVES: Objective[] = [
  {
    id: 'o1',
    label: 'Land 2 new client mandates',
    progress: 50,
    krs: [
      { id: 'kr1', label: 'Submit 4 proposals', progress: 50, target: '2/4' },
      { id: 'kr2', label: 'Hold 8 BD meetings', progress: 75, target: '6/8' },
    ],
  },
  {
    id: 'o2',
    label: 'Deliver Meridian at 9/10 NPS',
    progress: 70,
    krs: [
      { id: 'kr3', label: 'Complete Phase 2 on time', progress: 62, target: 'Jun 10' },
      { id: 'kr4', label: 'Weekly exec check-ins ×8', progress: 75, target: '6/8' },
    ],
  },
  {
    id: 'o3',
    label: 'Publish 1 thought-leadership piece',
    progress: 25,
    krs: [
      { id: 'kr5', label: 'Outline drafted', progress: 100, target: 'Done' },
      { id: 'kr6', label: '1st draft complete', progress: 0, target: 'Jun 30' },
    ],
  },
]

export function QuarterlyOKRs() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Q2 Objectives
        </h2>
        <span className="text-[11px] text-foreground-subtle">Apr – Jun 2025</span>
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
        {OBJECTIVES.map(obj => (
          <div key={obj.id} className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === obj.id ? null : obj.id)}
              className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-surface-raised transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">{obj.label}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-brand rounded-full"
                      style={{ width: `${obj.progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-foreground-subtle shrink-0">{obj.progress}%</span>
                </div>
              </div>
              {expanded === obj.id ? (
                <ChevronDown className="w-3.5 h-3.5 text-foreground-subtle mt-0.5 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-foreground-subtle mt-0.5 shrink-0" />
              )}
            </button>

            {expanded === obj.id && (
              <div className="border-t border-border bg-surface px-3 py-2 flex flex-col gap-1.5">
                {obj.krs.map(kr => (
                  <div key={kr.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground-muted">{kr.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              kr.progress === 100 ? 'bg-status-done' : 'bg-accent-brand/70'
                            )}
                            style={{ width: `${kr.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-foreground-subtle shrink-0">{kr.target}</span>
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

// ─── Goals Timeline ───────────────────────────────────────────────────────────

interface Milestone {
  label: string
  week: number  // 0–12 within the quarter
  done: boolean
}

interface GoalTrack {
  id: string
  label: string
  color: string
  milestones: Milestone[]
}

const QUARTER_WEEKS = 13
const CURRENT_WEEK = 8  // Week 8 of the quarter

const GOAL_TRACKS: GoalTrack[] = [
  {
    id: 'g1',
    label: 'Meridian Mandate',
    color: 'oklch(0.60 0.19 264)',
    milestones: [
      { label: 'Phase 1 complete', week: 3, done: true },
      { label: 'Phase 2 kickoff', week: 9, done: false },
      { label: 'Final delivery', week: 12, done: false },
    ],
  },
  {
    id: 'g2',
    label: 'Thought Leadership',
    color: 'oklch(0.60 0.15 155)',
    milestones: [
      { label: 'Outline', week: 5, done: true },
      { label: '1st draft', week: 10, done: false },
      { label: 'Published', week: 13, done: false },
    ],
  },
  {
    id: 'g3',
    label: 'BD Pipeline',
    color: 'oklch(0.72 0.17 76)',
    milestones: [
      { label: '2 proposals', week: 6, done: true },
      { label: '4 proposals', week: 10, done: false },
    ],
  },
]

interface LongTermGoal {
  label: string
  progress: number
  horizon: string
}

const LONG_TERM: LongTermGoal[] = [
  { label: 'Make Partner by 2027', progress: 35, horizon: '2027' },
  { label: 'Build Nordic practice', progress: 20, horizon: '2026' },
]

export function GoalsTimeline() {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Q2 Milestones
        </h2>
        <span className="text-[11px] text-foreground-subtle">Wk {CURRENT_WEEK}/13</span>
      </div>

      {/* Gantt strip */}
      <div className="flex flex-col gap-2">
        {/* Week axis */}
        <div className="flex items-center pl-24">
          {Array.from({ length: QUARTER_WEEKS }, (_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 text-center text-[9px] leading-3',
                i + 1 === CURRENT_WEEK ? 'text-accent-brand font-bold' : 'text-foreground-subtle'
              )}
            >
              {i + 1 === CURRENT_WEEK ? '▼' : ''}
            </div>
          ))}
        </div>

        {GOAL_TRACKS.map(track => (
          <div key={track.id} className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted w-24 shrink-0 truncate">{track.label}</span>
            <div className="flex-1 relative h-5">
              {/* Track line */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px bg-border" />
              {/* Current week marker */}
              <div
                className="absolute top-0 bottom-0 w-px bg-accent-brand/30"
                style={{ left: `${((CURRENT_WEEK - 1) / (QUARTER_WEEKS - 1)) * 100}%` }}
              />
              {/* Milestones */}
              {track.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                  style={{ left: `${((m.week - 1) / (QUARTER_WEEKS - 1)) * 100}%` }}
                  title={m.label}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-125',
                      m.done ? 'border-transparent' : 'bg-background'
                    )}
                    style={{
                      borderColor: track.color,
                      backgroundColor: m.done ? track.color : undefined,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Long-term goals */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] uppercase tracking-widest text-foreground-subtle">Long-term</p>
        {LONG_TERM.map(g => (
          <div key={g.label} className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[12px] text-foreground-muted truncate">{g.label}</p>
                <span className="text-[11px] text-foreground-subtle shrink-0 ml-2">{g.horizon}</span>
              </div>
              <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-brand/50 rounded-full"
                  style={{ width: `${g.progress}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-foreground-subtle shrink-0">{g.progress}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
