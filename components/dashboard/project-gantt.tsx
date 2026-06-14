'use client'
import { useMemo } from 'react'
import { IconX } from '@tabler/icons-react'
import { Project } from '@/lib/data'
import type { TaskMeta } from '@/lib/task-meta'

interface ProjectGanttProps {
  project: Project
  projectDone: Record<string, boolean>
  taskMeta: Record<string, TaskMeta>
  onClose: () => void
}

type Segment = { start: Date; end: Date }

interface GanttRow {
  label: string
  owner?: string
  segments: Segment[]
  start?: Date
  end?: Date
  done: boolean
  isSubtask?: boolean
  color: string
  hasDeadline: boolean
  fromSchedule: boolean
}

// ── ISO 8601 week number (Monday-start) — mirrors the task modal picker ──
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// Group selected ISO-week Mondays into contiguous runs (Mon→Sun bars).
function weeksToSegments(weeks: number[], weekToMonday: Map<number, Date>): Segment[] {
  const mondays = weeks.map(w => weekToMonday.get(w)).filter(Boolean) as Date[]
  mondays.sort((a, b) => a.getTime() - b.getTime())
  if (!mondays.length) return []
  const segs: Segment[] = []
  let runStart = mondays[0]; let prev = mondays[0]
  for (let i = 1; i < mondays.length; i++) {
    if ((mondays[i].getTime() - prev.getTime()) / 86400000 === 7) { prev = mondays[i] }
    else { segs.push({ start: runStart, end: addDays(prev, 6) }); runStart = mondays[i]; prev = mondays[i] }
  }
  segs.push({ start: runStart, end: addDays(prev, 6) })
  return segs
}

export function ProjectGantt({ project, projectDone, taskMeta, onClose }: ProjectGanttProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Map ISO week number → that week's Monday date, mirroring how the task
  // modal's week picker enumerates weeks (current month forward).
  const weekToMonday = useMemo(() => {
    const map = new Map<number, Date>()
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // back up to the Monday on/before the 1st
    for (let i = 0; i < 40; i++) {
      const wn = getISOWeekNumber(d)
      if (!map.has(wn)) map.set(wn, new Date(d))
      d.setDate(d.getDate() + 7)
    }
    return map
  }, [])

  const rows = useMemo(() => {
    const result: GanttRow[] = []
    const buildRow = (label: string, meta: TaskMeta | undefined, done: boolean, isSubtask: boolean, color: string, fallbackPadDays: number, inlineDeadline?: string): GanttRow => {
      const weeks: number[] = (meta as any)?.schedule?.weeks || []
      const deadlineStr = meta?.deadline || inlineDeadline
      const deadline = deadlineStr ? new Date(deadlineStr + 'T00:00') : undefined
      // Prefer the explicitly scheduled weeks; otherwise fall back to a
      // deadline-anchored bar so legacy tasks still render.
      const scheduleSegs = weeksToSegments(weeks, weekToMonday)
      let segments: Segment[] = scheduleSegs
      if (!segments.length && deadline) segments = [{ start: addDays(deadline, -fallbackPadDays), end: deadline }]
      const starts = segments.map(s => s.start.getTime())
      const ends = segments.map(s => s.end.getTime())
      return {
        label,
        owner: (meta as any)?.owner,
        segments,
        start: starts.length ? new Date(Math.min(...starts)) : undefined,
        end: ends.length ? new Date(Math.max(...ends)) : undefined,
        done,
        isSubtask,
        color,
        hasDeadline: !!deadline && !scheduleSegs.length,
        fromSchedule: scheduleSegs.length > 0,
      }
    }
    project.tasks.forEach((task, i) => {
      const key = `proj-${project.key}-task-${i}`
      const meta = taskMeta[key]
      const done = !!projectDone[`${project.key}-task-${i}`]
      result.push(buildRow(task, meta, done, false, project.color, 7))
      // Subtask rows (inline deadlines only — they have no schedule weeks)
      if (meta?.subtasks) {
        meta.subtasks.forEach(st => {
          result.push(buildRow(st.text, undefined, st.done, true, `${project.color}99`, 3, (st as any).deadline))
        })
      }
    })
    return result
  }, [project, projectDone, taskMeta, weekToMonday])

  // ── FIX #5: Better date range calculation ──
  // Ensure minimum 21-day span, and add enough padding so labels don't clip.
  const { minDate, maxDate, totalDays } = useMemo(() => {
    const dates = rows.filter(r => r.start || r.end).flatMap(r => [r.start, r.end].filter(Boolean) as Date[])
    dates.push(today)
    dates.push(new Date(today.getTime() + 21 * 86400000)) // at least 3 weeks ahead
    const min = new Date(Math.min(...dates.map(d => d.getTime())) - 5 * 86400000)
    const max = new Date(Math.max(...dates.map(d => d.getTime())) + 5 * 86400000)
    const days = Math.ceil((max.getTime() - min.getTime()) / 86400000)
    return { minDate: min, maxDate: max, totalDays: Math.max(days, 21) }
  }, [rows, today])

  const dayToPercent = (date: Date) => {
    const diff = date.getTime() - minDate.getTime()
    return (diff / (totalDays * 86400000)) * 100
  }

  const todayPct = dayToPercent(today)

  // ── FIX #5: Week labels with minimum spacing — skip if too close ──
  const weekLabels = useMemo(() => {
    const labels: { week: string; date: string; pct: number }[] = []
    const d = new Date(minDate)
    d.setDate(d.getDate() - d.getDay() + 1) // start from Monday
    const MIN_GAP_PCT = 8 // minimum 8% gap between labels
    let lastPct = -100

    while (d <= maxDate) {
      if (d >= minDate) {
        const pct = dayToPercent(d)
        if (pct - lastPct >= MIN_GAP_PCT) {
          // Label each week column by its ISO week number (W#) so the axis
          // lines up exactly with the weeks chosen in the Schedule picker,
          // with the Monday date underneath for context.
          labels.push({
            week: `W${getISOWeekNumber(d)}`,
            date: `${d.getDate()}/${d.getMonth() + 1}`,
            pct,
          })
          lastPct = pct
        }
      }
      d.setDate(d.getDate() + 7)
    }
    return labels
  }, [minDate, maxDate, totalDays])

  const LABEL_W = 180
  const ROW_H = 28

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: project.color, boxShadow: `0 0 8px ${project.color}` }} />
            <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Gantt — {project.name}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <IconX size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        {rows.length === 0 ? (
          <div className="text-center text-slate-500 text-[12px] py-6">No tasks yet. Open a task and mark its Schedule (weeks) — or set a deadline — to see it on the Gantt chart.</div>
        ) : (
          <div style={{ position: 'relative', minWidth: 600 }}>
            {/* Week headers */}
            <div style={{ height: 30, position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
              {weekLabels.map((w, i) => (
                <span key={i} style={{
                  position: 'absolute',
                  left: `${w.pct}%`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>{w.week}</span>
                  <span style={{ fontSize: 8, color: '#64748b', fontWeight: 500 }}>{w.date}</span>
                </span>
              ))}
            </div>

            {/* Today line */}
            <div style={{ position: 'absolute', left: `${todayPct}%`, top: 30, bottom: 0, width: 1.5, background: '#fb7185', boxShadow: '0 0 8px rgba(251,113,133,0.5)', zIndex: 5 }}>
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 8, fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Today</div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => {
              const hasBar = row.segments.length > 0

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', height: ROW_H, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  {/* Label */}
                  <div style={{ width: LABEL_W, flexShrink: 0, paddingRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {row.isSubtask && <span style={{ color: '#475569', fontSize: 10, marginLeft: 8 }}>↳</span>}
                    <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${row.done ? 'bg-indigo-500/50' : ''}`}
                      style={row.done ? {} : { border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }} />
                    <span style={{ fontSize: row.isSubtask ? 10 : 11, color: row.done ? '#475569' : '#cbd5e1', textDecoration: row.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{row.label}</span>
                    {row.owner && (
                      <span style={{ fontSize: 8, color: '#2dd4bf', background: 'rgba(45,212,191,0.12)', padding: '0 3px', borderRadius: 3, lineHeight: '14px', flexShrink: 0 }}>{row.owner}</span>
                    )}
                  </div>

                  {/* Bar area */}
                  <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                    {hasBar ? (
                      row.segments.map((seg, si) => {
                        const startPct = dayToPercent(seg.start)
                        const endPct = dayToPercent(seg.end)
                        const widthPct = Math.max(endPct - startPct, 1.5)
                        const isLast = si === row.segments.length - 1
                        return (
                          <div key={si} style={{
                            position: 'absolute',
                            left: `${startPct}%`,
                            width: `${widthPct}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: row.isSubtask ? 8 : 12,
                            borderRadius: 4,
                            background: row.done ? 'rgba(99,102,241,0.25)' : `${row.color}33`,
                            border: `1px solid ${row.done ? 'rgba(99,102,241,0.35)' : `${row.color}66`}`,
                            boxShadow: row.done ? 'none' : `0 0 8px ${row.color}22`,
                          }}
                          title={row.fromSchedule ? `Scheduled: ${seg.start.getDate()}/${seg.start.getMonth() + 1} – ${seg.end.getDate()}/${seg.end.getMonth() + 1}` : undefined}>
                            {/* Progress fill */}
                            {row.done && (
                              <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: 'rgba(99,102,241,0.4)' }} />
                            )}
                            {/* Deadline marker — only on the final segment of deadline-based rows */}
                            {row.hasDeadline && isLast && (
                              <div style={{ position: 'absolute', right: -1, top: -2, bottom: -2, width: 3, borderRadius: 2, background: row.color }} />
                            )}
                          </div>
                        )
                      })
                    ) : (
                      /* ── FIX #5: Tasks without deadlines get a dashed placeholder bar at today ── */
                      <div style={{
                        position: 'absolute',
                        left: `${Math.max(todayPct - 4, 0)}%`,
                        width: `${Math.min(8, 100 - todayPct + 4)}%`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: row.isSubtask ? 6 : 10,
                        borderRadius: 3,
                        border: '1px dashed rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 7, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>NO DATE</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
