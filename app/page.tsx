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
import { QuickCapture } from '@/components/dashboard/quick-capture'
import { FocusTimer } from '@/components/dashboard/focus-timer'
import { DailyShutdown } from '@/components/dashboard/daily-shutdown'
import { PROJECTS, LT_GOALS, TOP_PRIO_TASKS, DAY_EVENTS, Project } from '@/lib/data'
import type { TaskMeta, DeadlineEvent } from '@/lib/task-meta'
import { loadTaskMeta, saveTaskMeta, loadProjectDone, saveProjectDone, loadCapturedTasks, saveCapturedTasks } from '@/lib/task-meta'
import { IconMoon, IconChartBar } from '@tabler/icons-react'
import { WeeklyAnalytics } from '@/components/dashboard/weekly-analytics'

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

  /* ── Quick capture (persisted) ── */
  const [captured, setCaptured] = useState<string[]>([])
  useEffect(() => { setCaptured(loadCapturedTasks()) }, [])
  useEffect(() => { saveCapturedTasks(captured) }, [captured])
  const addCapture = useCallback((text: string) => setCaptured(prev => [text, ...prev]), [])
  const removeCapture = useCallback((idx: number) => setCaptured(prev => prev.filter((_, i) => i !== idx)), [])

  /* ── Task modal ── */
  const [modalTask, setModalTask] = useState<{ key: string; label: string } | null>(null)
  const openModal = useCallback((key: string, label: string) => setModalTask({ key, label }), [])
const [showAnalytics, setShowAnalytics] = useState(false)

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

  /* ── Daily shutdown ── */
  const [showShutdown, setShowShutdown] = useState(false)

  /* ── Time stats ── */
  const timeStats = useMemo(() => {
    let plannedMin = 0
    let totalTodayTasks = 0
    let doneTodayTasks = 0

    // Count Top Prio tasks
    TOP_PRIO_TASKS.forEach(section => {
      section.tasks.forEach(task => {
        totalTodayTasks++
        if (task.done) doneTodayTasks++
        const meta = taskMeta[`prio-${task.id}`]
        if (meta?.timeEstimate) plannedMin += meta.timeEstimate
      })
    })

    // Count tasks with today deadline
    const todayStr = new Date().toISOString().slice(0, 10)
    Object.entries(taskMeta).forEach(([key, m]) => {
      if (m.deadline === todayStr && !key.startsWith('prio-')) {
        if (m.timeEstimate) plannedMin += m.timeEstimate
      }
    })

    // Meeting time from static events
    let meetingMin = 0
    DAY_EVENTS.forEach(ev => { meetingMin += (ev.end - ev.hour) * 60 })

    const availableMin = 480 - meetingMin // 8h day minus meetings
    const overloaded = plannedMin > availableMin

    return { plannedMin, availableMin, meetingMin, overloaded, totalTodayTasks, doneTodayTasks }
  }, [taskMeta])

  const fmtTime = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-background p-5 font-sans">
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

          {/* Right side: time stats + shutdown button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Time bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '6px 14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
            }}>
              <TimeStatBadge label="Planned" value={fmtTime(timeStats.plannedMin)}
                color={timeStats.overloaded ? '#fb7185' : '#818cf8'} />
             <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />
              <TimeStatBadge label="Meetings" value={fmtTime(timeStats.meetingMin)} color="#fbbf24" />
              {timeStats.overloaded && (
                <span style={{
                  fontSize: 8, fontWeight: 700, color: '#fb7185', background: 'rgba(244,63,94,0.15)',
                  padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Overloaded
                </span>
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


        <QuickCapture captured={captured} onAdd={addCapture} onRemove={removeCapture} />
      </header>

      <div className="grid grid-cols-[196px_minmax(0,0.75fr)_minmax(0,1fr)] gap-3 items-start">
        <div className="flex flex-col gap-3">
          <TopPrioCard taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} />
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

function TimeStatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600 }}>{label}</div>
    </div>
  )
}