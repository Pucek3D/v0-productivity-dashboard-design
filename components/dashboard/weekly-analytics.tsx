'use client'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconTrendingUp, IconFlame, IconClock } from '@tabler/icons-react'
import { PROJECTS, LT_GOALS, TOP_PRIO_TASKS, Project } from '@/lib/data'
import type { TaskMeta } from '@/lib/task-meta'

interface WeeklyAnalyticsProps {
  onClose: () => void
  projectDone: Record<string, boolean>
  taskMeta: Record<string, TaskMeta>
  getProjectCompletion: (project: Project) => number
}

export function WeeklyAnalytics({ onClose, projectDone, taskMeta, getProjectCompletion }: WeeklyAnalyticsProps) {
  const stats = useMemo(() => {
    const projects = [...PROJECTS, ...LT_GOALS]

    // Per-project stats
    const projectStats = projects.map(p => {
      const pct = getProjectCompletion(p)
      let done = 0
      let total = p.tasks.length + p.doneTasks.length
      p.tasks.forEach((_, i) => { if (projectDone[`${p.key}-task-${i}`]) done++ })
      p.doneTasks.forEach((_, i) => { if (projectDone[`${p.key}-done-${i}`] !== false) done++ })

      // Time estimated
      let timeMin = 0
      const prefix = PROJECTS.includes(p) ? 'proj' : 'goal'
      p.tasks.forEach((_, i) => {
        const meta = taskMeta[`${prefix}-${p.key}-${i}`]
        if (meta?.timeEstimate) timeMin += meta.timeEstimate
      })

      return { name: p.name, color: p.color, pct, done, total, timeMin }
    })

    // Totals
    const totalDone = projectStats.reduce((s, p) => s + p.done, 0)
    const totalTasks = projectStats.reduce((s, p) => s + p.total, 0)
    const totalTime = projectStats.reduce((s, p) => s + p.timeMin, 0)
    const avgPct = projectStats.length > 0 ? Math.round(projectStats.reduce((s, p) => s + p.pct, 0) / projectStats.length) : 0

    // Top 5 by completion
    const topProjects = [...projectStats].sort((a, b) => b.pct - a.pct).slice(0, 5)

    // Time distribution (top 5 with time)
    const timeProjects = [...projectStats].filter(p => p.timeMin > 0).sort((a, b) => b.timeMin - a.timeMin).slice(0, 5)
    const maxTime = Math.max(...timeProjects.map(p => p.timeMin), 1)

    // At risk count
    const atRisk = projectStats.filter(p => p.pct < 20 && p.total > 0).length

    return { projectStats, totalDone, totalTasks, totalTime, avgPct, topProjects, timeProjects, maxTime, atRisk }
  }, [projectDone, taskMeta, getProjectCompletion])

  const fmtTime = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 10001, width: 520, maxHeight: '85vh', overflowY: 'auto',
        background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 24,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconTrendingUp size={20} color="#818cf8" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Weekly Review</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <IconX size={16} color="#64748b" />
          </button>
        </div>

        {/* Hero stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          <HeroStat label="Avg completion" value={`${stats.avgPct}%`} color="#818cf8" />
          <HeroStat label="Tasks done" value={`${stats.totalDone}/${stats.totalTasks}`} color="#2dd4bf" />
          <HeroStat label="Time estimated" value={fmtTime(stats.totalTime)} color="#fbbf24" />
          <HeroStat label="At risk" value={String(stats.atRisk)} color={stats.atRisk > 0 ? '#fb7185' : '#2dd4bf'} />
        </div>

        {/* Project completion ranking */}
        <SectionLabel>Project completion</SectionLabel>
        <div style={{ marginBottom: 20 }}>
          {stats.topProjects.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', width: 100, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${p.pct}%`, borderRadius: 3,
                  background: `linear-gradient(90deg, ${p.color}, ${p.color}cc)`,
                  boxShadow: `0 0 6px ${p.color}60`,
                  transition: 'width 0.5s',
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color, width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {p.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Time distribution */}
        {stats.timeProjects.length > 0 && (
          <>
            <SectionLabel>Time distribution</SectionLabel>
            <div style={{ marginBottom: 20 }}>
              {stats.timeProjects.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', width: 100, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(p.timeMin / stats.maxTime) * 100}%`, borderRadius: 3,
                      background: p.color, transition: 'width 0.5s',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtTime(p.timeMin)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* All projects table */}
        <SectionLabel>All projects</SectionLabel>
        <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ ...TH, textAlign: 'left', paddingLeft: 10 }}>Project</th>
                <th style={TH}>Done</th>
                <th style={TH}>Total</th>
                <th style={TH}>%</th>
                <th style={{ ...TH, textAlign: 'right', paddingRight: 10 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.projectStats.map(p => (
                <tr key={p.name} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '6px 10px', color: '#e2e8f0', fontWeight: 600 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: p.color, marginRight: 6, verticalAlign: 'middle' }} />
                    {p.name}
                  </td>
                  <td style={{ ...TD }}>{p.done}</td>
                  <td style={{ ...TD }}>{p.total}</td>
                  <td style={{ ...TD, color: p.pct >= 50 ? '#2dd4bf' : p.pct > 0 ? '#fbbf24' : '#475569' }}>{p.pct}%</td>
                  <td style={{ ...TD, textAlign: 'right', paddingRight: 10 }}>{p.timeMin > 0 ? fmtTime(p.timeMin) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>,
    document.body
  )
}

const TH: React.CSSProperties = { padding: '8px 6px', color: '#64748b', fontWeight: 600, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: 'center' }
const TD: React.CSSProperties = { padding: '6px', textAlign: 'center', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }

function HeroStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 8 }}>{children}</div>
}