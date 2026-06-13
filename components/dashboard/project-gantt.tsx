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

interface GanttRow {
  label: string
  owner?: string
  start?: Date
  end?: Date
  done: boolean
  isSubtask?: boolean
  color: string
  hasDeadline: boolean
}

export function ProjectGantt({ project, projectDone, taskMeta, onClose }: ProjectGanttProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = useMemo(() => {
    const result: GanttRow[] = []
    project.tasks.forEach((task, i) => {
      const key = `proj-${project.key}-task-${i}`
      const meta = taskMeta[key]
      const done = !!projectDone[`${project.key}-task-${i}`]
      const deadline = meta?.deadline ? new Date(meta.deadline + 'T00:00') : undefined
      // Task row
      result.push({
        label: task,
        owner: meta?.owner,
        start: deadline ? new Date(deadline.getTime() - 7 * 86400000) : undefined,
        end: deadline,
        done,
        color: project.color,
        hasDeadline: !!deadline,
      })
      // Subtask rows
      if (meta?.subtasks) {
        meta.subtasks.forEach(st => {
          const stDeadline = (st as any).deadline ? new Date((st as any).deadline + 'T00:00') : undefined
          result.push({
            label: st.text,
            owner: (st as any).owner,
            start: stDeadline ? new Date(stDeadline.getTime() - 3 * 86400000) : undefined,
            end: stDeadline,
            done: st.done,
            isSubtask: true,
            color: `${project.color}99`,
            hasDeadline: !!stDeadline,
          })
        })
      }
    })
    return result
  }, [project, projectDone, taskMeta])

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
    const labels: { label: string; pct: number }[] = []
    const d = new Date(minDate)
    d.setDate(d.getDate() - d.getDay() + 1) // start from Monday
    const MIN_GAP_PCT = 8 // minimum 8% gap between labels
    let lastPct = -100

    while (d <= maxDate) {
      if (d >= minDate) {
        const pct = dayToPercent(d)
        if (pct - lastPct >= MIN_GAP_PCT) {
          labels.push({
            label: `${d.getDate()}/${d.getMonth() + 1}`,
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
          <div className="text-center text-slate-500 text-[12px] py-6">No tasks with deadlines set. Open tasks and add deadlines to see the Gantt chart.</div>
        ) : (
          <div style={{ position: 'relative', minWidth: 600 }}>
            {/* Week headers */}
            <div style={{ height: 20, position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
              {weekLabels.map((w, i) => (
                <span key={i} style={{
                  position: 'absolute',
                  left: `${w.pct}%`,
                  fontSize: 9,
                  color: '#64748b',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                }}>{w.label}</span>
              ))}
            </div>

            {/* Today line */}
            <div style={{ position: 'absolute', left: `${todayPct}%`, top: 20, bottom: 0, width: 1.5, background: '#fb7185', boxShadow: '0 0 8px rgba(251,113,133,0.5)', zIndex: 5 }}>
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 8, fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Today</div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => {
              const hasBar = row.start && row.end
              const startPct = row.start ? dayToPercent(row.start) : 0
              const endPct = row.end ? dayToPercent(row.end) : 0
              const widthPct = Math.max(endPct - startPct, 2)

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
                      <div style={{
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
                      }}>
                        {/* Progress fill */}
                        {row.done && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: 'rgba(99,102,241,0.4)' }} />
                        )}
                        {/* Deadline marker */}
                        <div style={{ position: 'absolute', right: -1, top: -2, bottom: -2, width: 3, borderRadius: 2, background: row.color }} />
                      </div>
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
