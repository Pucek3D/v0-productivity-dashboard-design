'use client'
import { useState, useCallback, useEffect } from 'react'
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

export default function Dashboard() {
  // Dynamic header date — hydrates to real today after mount
  const [headerDate, setHeaderDate] = useState({
    weekday: 'Tuesday',
    day: 26,
    month: 'May',
    year: 2026,
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

  return (
    <div className="min-h-screen bg-background p-5 font-sans">
      <header className="flex items-end justify-between mb-6 pb-5 border-b border-[#e7e5e0]">
        <div>
          <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.025em] text-shadow-display">
            <span className="text-[#4338ca]">Kornelia&rsquo;s</span>{' '}
            <span className="text-[#0a0a0a]">op system</span>
          </h1>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-[#a8a29e] font-medium mt-3">
            {headerDate.weekday} <span className="mx-2 text-[#d6d3d1]">·</span> {headerDate.day} {headerDate.month} {headerDate.year}
          </p>
        </div>
        <button className="bg-[#4338ca] text-white rounded-lg px-4 py-2 text-[11px] font-semibold tracking-wider uppercase cursor-pointer hover:bg-[#3730a3] transition-colors shadow-[0_1px_2px_rgba(67,56,202,0.22),0_4px_12px_rgba(67,56,202,0.18)] text-shadow-on-color">
          + Quick add
        </button>
      </header>

      <div className="grid grid-cols-[196px_minmax(0,0.75fr)_minmax(0,1fr)] gap-3 items-start">
        <div className="flex flex-col gap-3">
          <TopPrioCard />
          <MessagesCard />
          <KpisCard />
        </div>
        <div className="flex flex-col gap-3">
          <EventCalendar />
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
          />
          <OtherTodoCard />
          <LtGoalsCard
            projectDone={projectDone}
            toggleProjectTask={toggleProjectTask}
            getProjectCompletion={getProjectCompletion}
          />
        </div>
      </div>
    </div>
  )
}