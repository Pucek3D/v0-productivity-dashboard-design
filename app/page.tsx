'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { TopPrioCard } from '@/components/dashboard/top-prio-card'
import { MessagesCard } from '@/components/dashboard/messages-card'
import { KpisCard } from '@/components/dashboard/kpis-card'
import { EventCalendar } from '@/components/dashboard/event-calendar'
import { LtGoalsCalendar } from '@/components/dashboard/lt-goals-calendar'
import { ProgressOverview } from '@/components/dashboard/progress-overview'
import { ActiveProjectsCard } from '@/components/dashboard/active-projects-card'
import { OtherTodoCard } from '@/components/dashboard/other-todo-card'
import { LtGoalsCard } from '@/components/dashboard/lt-goals-card'
import { TaskModal } from '@/components/dashboard/task-modal'
import { FocusTimer } from '@/components/dashboard/focus-timer'
import { DailyShutdown } from '@/components/dashboard/daily-shutdown'
import { WeeklyAnalytics } from '@/components/dashboard/weekly-analytics'
import { PROJECTS, LT_GOALS, TOP_PRIO_TASKS, Project } from '@/lib/data'
import type { TaskMeta, DeadlineEvent } from '@/lib/task-meta'
import { loadTaskMeta, saveTaskMeta, loadProjectDone, saveProjectDone } from '@/lib/task-meta'
import { IconMoon, IconChartBar } from '@tabler/icons-react'

export default function Dashboard() {
  /* ── Header date ── */
  const [headerDate, setHeaderDate] = useState({ weekday: 'Tuesday', day: 26, month: 'May', year: 2026 })
  useEffect(() => {
    const now = new Date()
    setHeaderDate({
      weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
      day: now.getDate(),
      month: now.toLocaleDateString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    })
  }, [])

  /* ── Project done state (persisted) ── */
  const [projectDone, setProjectDone] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    ;[...PROJECTS, ...LT_GOALS].forEach(p => {
      p.doneTasks.forEach((_, i) => { initial[`${p.key}-done-${i}`] = true })
    })
    return initial
  })
  useEffect(() => { const saved = loadProjectDone(); if (saved) setProjectDone(saved) }, [])
  useEffect(() => { saveProjectDone(projectDone) }, [projectDone])

  const toggleProjectTask = useCallback((projectKey: string, taskType: 'task' | 'done', index: number) => {
    const key = taskType === 'done' ? `${projectKey}-done-${index}` : `${projectKey}-task-${index}`
    setProjectDone(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const getProjectCompletion = useCallback((project: Project) => {
    const totalTasks = project.tasks.length + project.doneTasks.length
    if (totalTasks === 0) return 0
    let doneCount = 0
    project.tasks.forEach((_, i) => { if (projectDone[`${project.key}-task-${i}`]) doneCount++ })
    project.doneTasks.forEach((_, i) => { if (projectDone[`${project.key}-done-${i}`] !== false) doneCount++ })
    return Math.round((doneCount / totalTasks) * 100)
  }, [projectDone])

  /* ── Task metadata (persisted) ── */
  const [taskMeta, setTaskMeta] = useState<Record<string, TaskMeta>>({})
  useEffect(() => { setTaskMeta(loadTaskMeta()) }, [])
  useEffect(() => { saveTaskMeta(taskMeta) }, [taskMeta])

  const updateTaskMeta = useCallback((key: string, updates: Partial<TaskMeta>) => {
    setTaskMeta(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }))
  }, [])

  /* ── Deadline events ── */
  const deadlineEvents: DeadlineEvent[] = useMemo(() => {
    return Object.entries(taskMeta)
      .filter(([, m]) => m.deadline)
      .map(([, m]) => ({ date: m.deadline!, label: m.label || 'Task', color: '#818cf8', hour: m.hour, minute: m.minute }))
  }, [taskMeta])

  /* ── Top Prio tasks (lifted state) ── */
  const [prioTasks, setPrioTasks] = useState(TOP_PRIO_TASKS)

  const addPrioTask = useCallback((text: string) => {
    setPrioTasks(prev => {
      const newTasks = [...prev]
      const otherIdx = newTasks.findIndex(s => s.section === 'Other')
      if (otherIdx >= 0) {
        const section = { ...newTasks[otherIdx] }
        section.tasks = [...section.tasks, { id: `q${Date.now()}`, text, done: false, priority: 'gray' as const }]
        newTasks[otherIdx] = section
      }
      return newTasks
    })
  }, [])

  /* ── Modals ── */
  const [modalTask, setModalTask] = useState<{ key: string; label: string } | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showShutdown, setShowShutdown] = useState(false)
  const [showPlanned, setShowPlanned] = useState(false)
  const [showMeetings, setShowMeetings] = useState(false)

  const openModal = useCallback((key: string, label: string) => setModalTask({ key, label }), [])

  /* ── Focus timer ── */
  const [focusTask, setFocusTask] = useState<{ key: string; label: string } | null>(null)

  const startFocus = useCallback((key: string, label: string) => {
    setFocusTask({ key, label })
  }, [])

  const stopFocus = useCallback((key: string, elapsedMinutes: number) => {
    if (elapsedMinutes > 0) {
      setTaskMeta(prev => {
        const existing = prev[key] || {}
        const prevActual = (existing as any).actualTime || 0
        return { ...prev, [key]: { ...existing, actualTime: prevActual + elapsedMinutes } }
      })
    }
  }, [])

  /* ── Time stats ── */
  const timeStats = useMemo(() => {
    let plannedMin = 0
    let totalTodayTasks = 0
    let doneTodayTasks = 0
    const plannedTasks: { label: string; time: number }[] = []
    const meetingEvents: { label: string; time: string }[] = []
    let meetingMin = 0

    const todayStr = new Date().toISOString().slice(0, 10)

    // Top Prio tasks
    prioTasks.forEach(section => {
      section.tasks.forEach(task => {
        totalTodayTasks++
        if (task.done) doneTodayTasks++
        const meta = taskMeta[`prio-${task.id}`]
        if (meta?.timeEstimate) {
          plannedMin += meta.timeEstimate
          plannedTasks.push({ label: task.text, time: meta.timeEstimate })
        }
      })
    })

    // Tasks with today deadline
    Object.entries(taskMeta).forEach(([key, m]) => {
      if (m.deadline === todayStr && !key.startsWith('prio-')) {
        if (m.timeEstimate) {
          plannedMin += m.timeEstimate
          plannedTasks.push({ label: m.label || key, time: m.timeEstimate })
        }
        if (m.hour !== undefined) {
          meetingMin += 60
          meetingEvents.push({
            label: m.label || key,
            time: `${m.hour.toString().padStart(2, '0')}:${(m.minute ?? 0).toString().padStart(2, '0')}`,
          })
        }
      }
    })

    const overloaded = plannedMin > 480

    return { plannedMin, meetingMin, overloaded, totalTodayTasks, doneTodayTasks, plannedTasks, meetingEvents }
  }, [taskMeta, prioTasks])

  const fmtTime = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-background p-5 font-sans">
      {/* Close dropdowns overlay */}
      {(showPlanned || showMeetings) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => { setShowPlanned(false); setShowMeetings(false) }} />
      )}

      {/* Focus Timer */}
      <FocusTimer task={focusTask} onStop={stopFocus} onClear={() => setFocusTask(null)} />

      <header className="mb-6 pb-5 border-b border-white/5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.025em] text-shadow-display">
              <span className="text-[#818cf8] glow-text-indigo">Kornelia&rsquo;s</span>{' '}
              <span className="text-white">op system</span>
            </h1>
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-slate-500 font-medium mt-3">
              {headerDate.weekday} <span className="mx-2 text-slate-600">·</span> {headerDate.day} {headerDate.month} {headerDate.year}
            </p>
          </div>

          {/* Right side: time stats + buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Time bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '6px 14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
            }}>
              {/* Planned */}
              <div style={{ position: 'relative' }}>
                <div onClick={() => { setShowPlanned(!showPlanned); setShowMeetings(false) }} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: timeStats.overloaded ? '#fb7185' : '#818cf8', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtTime(timeStats.plannedMin)}
                  </div>
                  <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600 }}>Planned</div>
                </div>
                {showPlanned && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    marginTop: 8, width: 240, background: '#131c2e',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100,
                  }}>
                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 6 }}>
                      Planned tasks ({timeStats.plannedTasks.length})
                    </div>
                    {timeStats.plannedTasks.length === 0 && (
                      <div style={{ fontSize: 11, color: '#334155', padding: '4px 0' }}>No time estimates set</div>
                    )}
                    {timeStats.plannedTasks.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < timeStats.plannedTasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <span style={{ fontSize: 11, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{t.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {t.time >= 60 ? `${t.time / 60}h` : `${t.time}m`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />

              {/* Meetings */}
              <div style={{ position: 'relative' }}>
                <div onClick={() => { setShowMeetings(!showMeetings); setShowPlanned(false) }} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtTime(timeStats.meetingMin)}
                  </div>
                  <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600 }}>Meetings</div>
                </div>
                {showMeetings && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    marginTop: 8, width: 240, background: '#131c2e',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100,
                  }}>
                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 6 }}>
                      Today&apos;s events ({timeStats.meetingEvents.length})
                    </div>
                    {timeStats.meetingEvents.length === 0 && (
                      <div style={{ fontSize: 11, color: '#334155', padding: '4px 0' }}>No timed events today</div>
                    )}
                    {timeStats.meetingEvents.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < timeStats.meetingEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <span style={{ fontSize: 11, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{t.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{t.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {timeStats.overloaded && (
                <>
                  <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{
                    fontSize: 8, fontWeight: 700, color: '#fb7185', background: 'rgba(244,63,94,0.15)',
                    padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    Overloaded
                  </span>
                </>
              )}
            </div>

            {/* Analytics button */}
            <button onClick={() => setShowAnalytics(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(45,212,191,0.10)', border: '1px solid rgba(45,212,191,0.20)',
              borderRadius: 10, cursor: 'pointer', color: '#2dd4bf', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <IconChartBar size={14} /> Weekly Review
            </button>

            {/* Shutdown button */}
            <button onClick={() => setShowShutdown(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)',
              borderRadius: 10, cursor: 'pointer', color: '#818cf8', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <IconMoon size={14} /> End of day
            </button>
          </div>
        </div>

        {/* Quick add to Top Prio */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '6px 12px',
        }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>+</span>
          <input
            placeholder="Add task to Top Prio — press Enter"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                addPrioTask((e.target as HTMLInputElement).value.trim());
                (e.target as HTMLInputElement).value = ''
              }
            }}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 12, color: '#e2e8f0', fontFamily: 'inherit',
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-[196px_minmax(0,0.75fr)_minmax(0,1fr)] gap-3 items-start">
        <div className="flex flex-col gap-3">
          <TopPrioCard tasks={prioTasks} setTasks={setPrioTasks} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} />
          <MessagesCard />
          <KpisCard />
        </div>
        <div className="flex flex-col gap-3">
          <EventCalendar deadlineEvents={deadlineEvents} />
          <LtGoalsCalendar />
          <ProgressOverview projectDone={projectDone} getProjectCompletion={getProjectCompletion} />
        </div>
        <div className="flex flex-col gap-3">
          <ActiveProjectsCard projectDone={projectDone} toggleProjectTask={toggleProjectTask}
            getProjectCompletion={getProjectCompletion} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} />
          <OtherTodoCard taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} />
          <LtGoalsCard projectDone={projectDone} toggleProjectTask={toggleProjectTask}
            getProjectCompletion={getProjectCompletion} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} />
        </div>
      </div>

      {/* Task Modal */}
      {modalTask && (
        <TaskModal
          taskKey={modalTask.key}
          taskLabel={modalTask.label}
          meta={taskMeta[modalTask.key] || {}}
          onUpdate={(updates) => updateTaskMeta(modalTask.key, updates)}
          onClose={() => setModalTask(null)}
          onStartFocus={startFocus}
        />
      )}

      {/* Daily Shutdown */}
      {showShutdown && (
        <DailyShutdown
          onClose={() => setShowShutdown(false)}
          tasksCompleted={timeStats.doneTodayTasks}
          tasksTotal={timeStats.totalTodayTasks}
        />
      )}

      {/* Weekly Analytics */}
      {showAnalytics && (
        <WeeklyAnalytics
          onClose={() => setShowAnalytics(false)}
          projectDone={projectDone}
          taskMeta={taskMeta}
          getProjectCompletion={getProjectCompletion}
        />
      )}
    </div>
  )
}