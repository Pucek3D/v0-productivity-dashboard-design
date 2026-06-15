'use client'
import { useState, useEffect, useMemo } from 'react'
import { LT_GOALS } from '@/lib/data'
import type { TaskMeta } from '@/lib/task-meta'

const DISPLAY_FONT: React.CSSProperties = { fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 700, letterSpacing: '-0.025em' }
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ── FIX #7: Same ISO week function as task-modal ──
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

interface Props {
  taskMeta?: Record<string, TaskMeta>
}

export function LtGoalsCalendar({ taskMeta = {} }: Props) {
  const [view, setView] = useState<'gantt' | 'month'>('gantt')
  const [today, setToday] = useState({ m: 5, y: 2026 })
  useEffect(() => { const n = new Date(); setToday({ m: n.getMonth(), y: n.getFullYear() }) }, [])

  // ── FIX: ISO week calculation ──
  const currentWeek = getISOWeekNumber(new Date())

  // Always start at the CURRENT week's Monday and walk 6 weeks forward.
  // Each entry carries the ISO week number plus a day/month label (matching
  // the projects Gantt header, e.g. W25 / 15/6).
  const weeksInView = useMemo(() => {
    const start = new Date()
    const dayOfWeek = start.getDay() || 7
    start.setDate(start.getDate() - (dayOfWeek - 1)) // back to this week's Monday
    const weeks: { week: number; date: string }[] = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i * 7)
      weeks.push({ week: getISOWeekNumber(d), date: `${d.getDate()}/${d.getMonth() + 1}` })
    }
    return weeks
  }, [today])

  // Build goal schedule data from taskMeta
  const goalSchedules = useMemo(() => {
    return LT_GOALS.map(goal => {
      const allWeeks = new Set<number>()
      let hasOngoing = false

      goal.tasks.forEach((_, i) => {
        const tk = `proj-${goal.key}-task-${i}`
        const meta = taskMeta[tk]
        if (!meta) return
        const sched = (meta as any).schedule
        if (sched?.ongoing) hasOngoing = true
        if (sched?.weeks) sched.weeks.forEach((w: number) => allWeeks.add(w))
      })

      return { key: goal.key, name: goal.name, color: goal.color, weeks: [...allWeeks].sort((a, b) => a - b), ongoing: hasOngoing }
    })
  }, [taskMeta])

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
    boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.10)' : 'none',
    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '10px',
    textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px',
  })

  return (
    <div className="card-base halo-teal">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px', background: 'linear-gradient(90deg, transparent 0%, #14b8a6 25%, #14b8a6 75%, transparent 100%)', boxShadow: '0 0 12px rgba(20,184,166,0.6)', zIndex: 2 }} />
      <div style={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}>
        <div className="flex justify-between items-center">
          <span style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Long-Term Goals Calendar</span>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
            <button onClick={() => setView('gantt')} style={toggleBtn(view === 'gantt')}>Gantt</button>
            <button onClick={() => setView('month')} style={toggleBtn(view === 'month')}>Month</button>
          </div>
        </div>
      </div>

      <div className="px-3.5 py-3">
        <div className="mb-2.5">
          <span style={{ ...DISPLAY_FONT, fontSize: 20, color: '#fff' }}>{MONTH_NAMES[today.m]} </span>
          <span style={{ ...DISPLAY_FONT, fontSize: 20, color: '#64748b' }}>{today.y}</span>
        </div>

        {view === 'gantt' ? (
          <>
            {/* Week headers — W## with day/month below, like the projects Gantt */}
            <div style={{ display: 'flex', marginBottom: 6, paddingLeft: 80 }}>
              {weeksInView.map(w => (
                <div key={w.week} style={{ flex: 1, textAlign: 'center', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: w.week === currentWeek ? '#fb7185' : '#94a3b8', textTransform: 'uppercase' }}>W{w.week}</div>
                  <div style={{ fontSize: 8, fontWeight: 500, color: w.week === currentWeek ? '#fb7185' : '#64748b' }}>{w.date}</div>
                </div>
              ))}
            </div>

            {/* Goal bars */}
            {goalSchedules.map(goal => (
              <div key={goal.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 72, fontSize: 10, fontWeight: 700, color: goal.color, textTransform: 'uppercase', textAlign: 'right', flexShrink: 0 }}>{goal.name}</span>
                <div style={{ flex: 1, display: 'flex', gap: 2 }}>
                  {weeksInView.map(w => {
                    const isActive = goal.ongoing || goal.weeks.includes(w.week)
                    const isCurrent = w.week === currentWeek
                    return (
                      <div key={w.week} style={{
                        flex: 1, height: 16, borderRadius: 4,
                        background: isActive ? `${goal.color}40` : 'rgba(255,255,255,0.03)',
                        border: isActive ? `1px solid ${goal.color}60` : '1px solid rgba(255,255,255,0.04)',
                        boxShadow: isActive ? `0 0 6px ${goal.color}30` : 'none',
                        position: 'relative',
                      }}>
                        {isCurrent && <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 2, background: '#fb7185', borderRadius: 1 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingLeft: 80 }}>
              <span style={{ fontSize: 8, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(129,140,248,0.4)', border: '1px solid rgba(129,140,248,0.6)' }} /> Scheduled
              </span>
              <span style={{ fontSize: 8, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} /> Not set
              </span>
              <span style={{ fontSize: 8, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 2, height: 8, background: '#fb7185', borderRadius: 1 }} /> Today
              </span>
            </div>
          </>
        ) : (
          /* Month view — shows which goals are active each week */
          <div>
            {goalSchedules.map(goal => (
              <div key={goal.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ width: 72, fontSize: 10, fontWeight: 700, color: goal.color, textTransform: 'uppercase', textAlign: 'right', flexShrink: 0 }}>{goal.name}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 4, background: goal.ongoing ? `${goal.color}30` : goal.weeks.length > 0 ? `${goal.color}20` : 'rgba(255,255,255,0.03)', border: goal.ongoing || goal.weeks.length > 0 ? `1px solid ${goal.color}40` : '1px solid rgba(255,255,255,0.04)' }}>
                  {goal.ongoing && <div style={{ height: '100%', borderRadius: 3, background: `${goal.color}40` }} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
