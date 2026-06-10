'use client'

import { useState, useCallback } from 'react'
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
  // Track done states for projects (keyed by project key + task index)
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
    <div className="min-h-screen bg-white p-3.5 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-3.5 pb-3 border-b-[1.5px] border-[#ede9fe]">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-tight">
            <span className="text-[#7c3aed]">{"Kornelia's"}</span>{' '}
            <span className="text-[#111827]">op system</span>
          </h1>
        Tuesday <span className="mx-2 text-[#d6d3d1]">·</span> 26 May 2026
          </p>
        </div>
        <button className="bg-[#7c3aed] text-white border-none rounded-lg px-3.5 py-[7px] text-xs font-bold cursor-pointer hover:bg-[#6d28d9] transition-colors">
          + Quick add
        </button>
      </header>

      {/* 3-column grid */}
      <div className="grid grid-cols-[196px_minmax(0,0.75fr)_minmax(0,1fr)] gap-[11px] items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-[11px]">
          <TopPrioCard />
          <MessagesCard />
          <KpisCard />
        </div>

        {/* CENTER COLUMN */}
        <div className="flex flex-col gap-[11px]">
          <EventCalendar />
          <LtGoalsCalendar />
          <ProgressOverview 
            projectDone={projectDone} 
            getProjectCompletion={getProjectCompletion} 
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-[11px]">
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
