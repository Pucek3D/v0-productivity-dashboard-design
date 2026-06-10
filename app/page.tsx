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
import { PROJECTS, LT_GOALS, Project } from '@/lib/data'
import type { TaskMeta, DeadlineEvent } from '@/lib/task-meta'

export default function Dashboard() {
  /* ── Header date ── */
  const [headerDate, setHeaderDate] = useState({
    weekday: 'Tuesday', day: 26, month: 'May', year: 2026,
  })
  useEffect(() => {
    const now = new Date()
    setHeaderDate({
      weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
      day: now.getDate(),
      month: now.toLocaleDateString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    })
  }, [])

  /* ── Project done state ── */
  const [projectDone, setProjectDone] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    ;[...PROJECTS, ...LT_GOALS].forEach(p => {
      p.doneTasks.forEach((_, i) => {
        initial[`${p.key}-done-${i}`] = true
      })
    })
    return initial
  })

  const toggleProjectTask = useCallback((projectKey: string, taskType: 'task' | 'done', index: number) => {
    const key = taskType === 'done' ? `${projectKey}-done-${index}` : `${projectKey}-task-${index}`
    setProjectDone(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const getProjectCompletion = useCallback((project: Project) => {
    const totalTasks = project.tasks.length + project.doneTasks.length
    if (totalTasks === 0) return 0
    let doneCount = 0
    project.tasks.forEach((_, i) => {
      if (projectDone[`${project.key}-task-${i}`]) doneCount++
    })
    project.doneTasks.forEach((_, i) => {
      if (projectDone[`${project.key}-done-${i}`] !== false) doneCount++
    })
    return Math.round((doneCount / totalTasks) * 100)
  }, [projectDone])

  /* ── Task metadata (deadlines + owners) ── */
  const [taskMeta, setTaskMeta] = useState<Record<string, TaskMeta>>({})

  const updateTaskMeta = useCallback((key: string, updates: Partial<TaskMeta>) => {
    setTaskMeta(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }))
  }, [])

  const deadlineEvents: DeadlineEvent[] = useMemo(() => {
    return Object.entries(taskMeta)
      .filter(([, m]) => m.deadline)
      .map(([, m]) => ({ date: m.deadline!, label: m.label || 'Task', color: '#818cf8' }))
  }, [taskMeta])

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-background p-5 font-sans">
      <header className="flex items-end justify-between mb-6 pb-5 border-b border-white/5">
        <div>
          <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.025em] text-shadow-display">
            <span className="text-[#818cf8] glow-text-indigo">Kornelia&rsquo;s</span>{' '}
            <span className="text-white">op system</span>
          </h1>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-slate-500 font-medium mt-3">
            {headerDate.weekday} <span className="mx-2 text-slate-600">·</span> {headerDate.day} {headerDate.month} {headerDate.year}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[196px_minmax(0,0.75fr)_minmax(0,1fr)] gap-3 items-start">
        <div className="flex flex-col gap-3">
          <TopPrioCard taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
          <MessagesCard />
          <KpisCard />
        </div>
        <div className="flex flex-col gap-3">
          <EventCalendar deadlineEvents={deadlineEvents} />
          <LtGoalsCalendar />
          <ProgressOverview
            projectDone={projectDone}
            getProjectCompletion={getProjectCompletion}
          />
        </div>
        <div className="flex flex-col gap-3">
          <ActiveProjectsCard
            projectDone={projectDone}
            toggleProjectTask={toggleProjectTask}
            getProjectCompletion={getProjectCompletion}
            taskMeta={taskMeta}
            updateTaskMeta={updateTaskMeta}
          />
          <OtherTodoCard taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
          <LtGoalsCard
            projectDone={projectDone}
            toggleProjectTask={toggleProjectTask}
            getProjectCompletion={getProjectCompletion}
            taskMeta={taskMeta}
            updateTaskMeta={updateTaskMeta}
          />
        </div>
      </div>
    </div>
  )
}