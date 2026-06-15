'use client'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconUsers, IconBrain, IconTargetArrow, IconClock } from '@tabler/icons-react'
import { PROJECTS, LT_GOALS, KPI_CATEGORIES, KPI_DAYS, type Project, type KpiCategory } from '@/lib/data'
import type { TaskMeta } from '@/lib/task-meta'
import type { CustomMeeting } from '@/components/dashboard/event-calendar'

interface WeeklyAnalyticsProps {
  onClose: () => void
  projectDone: Record<string, boolean>
  taskMeta: Record<string, TaskMeta>
  getProjectCompletion: (project: Project) => number
  calendarMeetings?: CustomMeeting[]
}

const KPI_STORAGE_KEY = 'dashboard:kpis:v1'

// ── Current week, always starting Monday 00:01 CET (Europe/Warsaw wall-clock) ──
function getCurrentWeek(): { dates: string[]; todayIdx: number; rangeLabel: string } {
  const now = new Date()
  // Re-express "now" in CET/CEST wall-clock so the Monday boundary is correct
  // regardless of the viewer's own timezone.
  const cet = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }))
  const todayIdx = (cet.getDay() + 6) % 7 // Mon=0 … Sun=6
  const monday = new Date(cet)
  monday.setDate(cet.getDate() - todayIdx)
  monday.setHours(0, 1, 0, 0)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  const fmt = (ds: string) => new Date(ds + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })
  return { dates, todayIdx, rangeLabel: `${fmt(dates[0])} – ${fmt(dates[6])}` }
}

function loadKpis(): KpiCategory[] {
  if (typeof window === 'undefined') return KPI_CATEGORIES
  try {
    const raw = localStorage.getItem(KPI_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.length ? parsed : KPI_CATEGORIES
  } catch { return KPI_CATEGORIES }
}

function fmtTime(min: number): string {
  if (min <= 0) return '0h'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function ringColor(done: number, target: number): string {
  if (target <= 0 || done <= 0) return '#475569'
  const hue = Math.round(Math.min(1, done / target) * 140)
  return `hsl(${hue}, 78%, 52%)`
}

export function WeeklyAnalytics({ onClose, projectDone, taskMeta, getProjectCompletion, calendarMeetings = [] }: WeeklyAnalyticsProps) {
  const week = useMemo(getCurrentWeek, [])

  const stats = useMemo(() => {
    const weekSet = new Set(week.dates)
    const idxOf = (ds: string) => week.dates.indexOf(ds)

    let meetingMin = 0, meetingCount = 0, focusMin = 0, focusCount = 0
    const perDayMeeting = [0, 0, 0, 0, 0, 0, 0]
    const perDayFocus = [0, 0, 0, 0, 0, 0, 0]

    // Task-derived time: a timed entry (hour set) counts as a meeting; an
    // untimed entry with logged/estimated time counts as focused work.
    Object.values(taskMeta).forEach(m => {
      if (m.deadline && weekSet.has(m.deadline)) {
        const di = idxOf(m.deadline)
        if (m.hour !== undefined) {
          const dur = m.durationMin ?? 30
          meetingMin += dur; meetingCount++; if (di >= 0) perDayMeeting[di] += dur
        } else {
          const t = m.actualTime ?? m.timeEstimate ?? 0
          if (t > 0) { focusMin += t; focusCount++; if (di >= 0) perDayFocus[di] += t }
        }
      }
      ;(m.subtasks || []).forEach(st => {
        if (st.deadline && weekSet.has(st.deadline) && st.timeEstimate) {
          focusMin += st.timeEstimate; focusCount++
          const di = idxOf(st.deadline); if (di >= 0) perDayFocus[di] += st.timeEstimate
        }
      })
    })

    // Stand-alone calendar meetings (not tied to a task).
    calendarMeetings.forEach(cm => {
      const ds = `${cm.year}-${String(cm.month + 1).padStart(2, '0')}-${String(cm.day).padStart(2, '0')}`
      if (weekSet.has(ds)) {
        const dur = cm.durationMin ?? 30
        meetingMin += dur; meetingCount++
        const di = idxOf(ds); if (di >= 0) perDayMeeting[di] += dur
      }
    })

    const totalTime = meetingMin + focusMin
    const meetingPct = totalTime > 0 ? Math.round((meetingMin / totalTime) * 100) : 0
    const focusPct = totalTime > 0 ? 100 - meetingPct : 0
    const maxDay = Math.max(...perDayMeeting.map((m, i) => m + perDayFocus[i]), 1)

    // KPIs this week (done vs weekly target across all categories).
    const kpiCats = loadKpis()
    let kpiDone = 0, kpiTarget = 0
    const kpiRows: { label: string; color: string; done: number; target: number }[] = []
    kpiCats.forEach(c => c.kpis.forEach(k => {
      const done = (k.days || []).reduce((s: number, d: number) => s + (d ? 1 : 0), 0)
      const target = k.weeklyTarget ?? 7
      kpiDone += Math.min(done, target); kpiTarget += target
      kpiRows.push({ label: k.label, color: c.color, done, target })
    }))
    const kpiPct = kpiTarget > 0 ? Math.round((kpiDone / kpiTarget) * 100) : 0

    // Project completion (secondary) — top 5 by % across projects + goals.
    const projectStats = [...PROJECTS, ...LT_GOALS].map(p => ({ name: p.name, color: p.color, pct: getProjectCompletion(p) }))
    const topProjects = [...projectStats].sort((a, b) => b.pct - a.pct).slice(0, 5)

    return {
      meetingMin, meetingCount, focusMin, focusCount, totalTime, meetingPct, focusPct,
      perDayMeeting, perDayFocus, maxDay, kpiRows, kpiDone, kpiTarget, kpiPct, topProjects,
    }
  }, [week, taskMeta, calendarMeetings, getProjectCompletion])

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 10001, width: 540, maxHeight: '85vh', overflowY: 'auto',
        background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconClock size={20} color="#2dd4bf" />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Weekly Review</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: 600, letterSpacing: '0.04em' }}>
              {week.rangeLabel} · this week
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <IconX size={16} color="#64748b" />
          </button>
        </div>

        {/* Hero stats — time + KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          <HeroStat label="Meeting time" value={fmtTime(stats.meetingMin)} color="#818cf8" />
          <HeroStat label="Focus time" value={fmtTime(stats.focusMin)} color="#2dd4bf" />
          <HeroStat label="Meetings" value={String(stats.meetingCount)} color="#a78bfa" />
          <HeroStat label="KPIs hit" value={`${stats.kpiPct}%`} color={stats.kpiPct >= 60 ? '#2dd4bf' : '#fbbf24'} />
        </div>

        {/* Meetings vs Focus */}
        <SectionLabel>Meetings vs focused work</SectionLabel>
        {stats.totalTime > 0 ? (
          <>
            <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: `${stats.meetingPct}%`, background: '#818cf8', transition: 'width 0.5s' }} />
              <div style={{ width: `${stats.focusPct}%`, background: '#2dd4bf', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <Legend color="#818cf8" icon={<IconUsers size={11} />} label="Meetings" value={`${fmtTime(stats.meetingMin)} · ${stats.meetingPct}%`} />
              <Legend color="#2dd4bf" icon={<IconBrain size={11} />} label="Focus" value={`${fmtTime(stats.focusMin)} · ${stats.focusPct}%`} align="right" />
            </div>

            {/* Per-day stacked breakdown */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 64, marginBottom: 6 }}>
              {KPI_DAYS.map((d, i) => {
                const mh = (stats.perDayMeeting[i] / stats.maxDay) * 56
                const fh = (stats.perDayFocus[i] / stats.maxDay) * 56
                const isToday = i === week.todayIdx
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}
                      title={`${d}: ${fmtTime(stats.perDayMeeting[i])} meetings · ${fmtTime(stats.perDayFocus[i])} focus`}>
                      {fh > 0 && <div style={{ height: Math.max(fh, 2), background: '#2dd4bf', borderRadius: 2 }} />}
                      {mh > 0 && <div style={{ height: Math.max(mh, 2), background: '#818cf8', borderRadius: 2 }} />}
                    </div>
                    <span style={{ fontSize: 8, fontWeight: isToday ? 700 : 500, color: isToday ? '#2dd4bf' : '#475569' }}>{d}</span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <EmptyHint>No meetings or focus time logged this week yet. Add times/durations to tasks and calendar meetings to track them here.</EmptyHint>
        )}

        {/* KPIs this week */}
        <SectionLabel style={{ marginTop: 20 }}>KPIs this week</SectionLabel>
        {stats.kpiRows.length > 0 ? (
          <div style={{ marginBottom: 20 }}>
            {stats.kpiRows.map((k, i) => {
              const pct = k.target > 0 ? Math.min(1, k.done / k.target) : 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.label}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 3, background: ringColor(k.done, k.target), transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ringColor(k.done, k.target), width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {k.done}/{k.target}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyHint>No KPIs configured yet. Add some in the “KPIs to track” card.</EmptyHint>
        )}

        {/* Project completion (secondary) */}
        <SectionLabel>Project completion</SectionLabel>
        <div>
          {stats.topProjects.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${p.color}, ${p.color}cc)`, boxShadow: `0 0 6px ${p.color}60`, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color, width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  )
}

function HeroStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 8, ...style }}>{children}</div>
}

function Legend({ color, icon, label, value, align }: { color: string; icon: React.ReactNode; label: string; value: string; align?: 'right' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start', gap: 1 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{icon}{label}</span>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, color: '#64748b', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>{children}</div>
}
