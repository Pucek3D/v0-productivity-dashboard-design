'use client'

import { useState } from 'react'
import { PROJECTS, pastel, statusStyle, Project } from '@/lib/data'

interface ActiveProjectsCardProps {
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  getProjectCompletion: (project: Project) => number
}

export function ActiveProjectsCard({ projectDone, toggleProjectTask, getProjectCompletion }: ActiveProjectsCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#7c3aed] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
          Active projects
        </span>
      </div>
      <div className="p-2 px-2.5">
        <div className="grid grid-cols-2 gap-1.5">
          {PROJECTS.map(project => {
            const pct = getProjectCompletion(project)
            const style = statusStyle(project.status, project.color)
            const isExpanded = expanded[project.key]
            const visibleTasks = project.tasks.slice(0, 2)
            const hiddenTasks = project.tasks.slice(2)
            const hasMore = hiddenTasks.length > 0 || project.doneTasks.length > 0

            return (
              <div
                key={project.key}
                className="border border-[#f3f4f6] rounded-lg p-[7px_7px_5px] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                style={{ borderLeftWidth: '3px', borderLeftColor: pastel(project.color, 0.42) }}
              >
                <span className="text-[10.5px] font-bold text-[#111827] whitespace-nowrap overflow-hidden text-ellipsis block mb-0.5">
                  {project.name}
                </span>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[8.5px] font-bold rounded-full px-[5px] py-px whitespace-nowrap"
                    style={{ background: style.bg, color: style.text }}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="flex-1 h-[3px] bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: pastel(project.color, 0.42) }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[#9ca3af] flex-shrink-0">{pct}%</span>
                </div>
                <div className="text-[8.5px] text-[#9ca3af] mb-[3px] whitespace-nowrap overflow-hidden text-ellipsis">
                  → {project.next}
                </div>

                {/* Visible tasks */}
                <div className="border-t border-[#f9fafb] pt-[3px] mt-0.5">
                  {visibleTasks.map((task, i) => {
                    const isDone = projectDone[`${project.key}-task-${i}`]
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-[5px] py-0.5 cursor-pointer select-none"
                        onClick={() => toggleProjectTask(project.key, 'task', i)}
                      >
                        <div
                          className={`w-[11px] h-[11px] rounded-sm border-[1.5px] flex-shrink-0 flex items-center justify-center mt-[1px] ${
                            isDone ? 'bg-[#c4b5fd] border-[#c4b5fd]' : 'border-[#e5e7eb]'
                          }`}
                        >
                          {isDone && <span className="text-[#5b21b6] text-[7px] font-extrabold">✓</span>}
                        </div>
                        <span className={`text-[9.5px] leading-[1.3] ${isDone ? 'text-[#9ca3af] line-through' : 'text-[#111827]'}`}>
                          {task}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Hidden tasks (expandable) */}
                {isExpanded && (
                  <div className="pt-0.5">
                    {hiddenTasks.map((task, i) => {
                      const idx = i + 2
                      const isDone = projectDone[`${project.key}-task-${idx}`]
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-[5px] py-0.5 cursor-pointer select-none"
                          onClick={() => toggleProjectTask(project.key, 'task', idx)}
                        >
                          <div
                            className={`w-[11px] h-[11px] rounded-sm border-[1.5px] flex-shrink-0 flex items-center justify-center mt-[1px] ${
                              isDone ? 'bg-[#c4b5fd] border-[#c4b5fd]' : 'border-[#e5e7eb]'
                            }`}
                          >
                            {isDone && <span className="text-[#5b21b6] text-[7px] font-extrabold">✓</span>}
                          </div>
                          <span className={`text-[9.5px] leading-[1.3] ${isDone ? 'text-[#9ca3af] line-through' : 'text-[#111827]'}`}>
                            {task}
                          </span>
                        </div>
                      )
                    })}
                    {project.doneTasks.map((task, i) => {
                      const isDone = projectDone[`${project.key}-done-${i}`] !== false
                      return (
                        <div
                          key={`done-${i}`}
                          className="flex items-start gap-[5px] py-0.5 cursor-pointer select-none"
                          onClick={() => toggleProjectTask(project.key, 'done', i)}
                        >
                          <div
                            className={`w-[11px] h-[11px] rounded-sm border-[1.5px] flex-shrink-0 flex items-center justify-center mt-[1px] ${
                              isDone ? 'bg-[#c4b5fd] border-[#c4b5fd]' : 'border-[#e5e7eb]'
                            }`}
                          >
                            {isDone && <span className="text-[#5b21b6] text-[7px] font-extrabold">✓</span>}
                          </div>
                          <span className={`text-[9.5px] leading-[1.3] ${isDone ? 'text-[#9ca3af] line-through' : 'text-[#111827]'}`}>
                            {task}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Expand toggle */}
                {hasMore && (
                  <div
                    className="flex items-center gap-[3px] mt-[3px] cursor-pointer"
                    onClick={() => toggleExpand(project.key)}
                  >
                    <span className="text-[8.5px] text-[#a78bfa] font-bold">
                      {isExpanded ? 'Show less' : `+${hiddenTasks.length + project.doneTasks.length} more`}
                    </span>
                    <span className={`text-[8.5px] text-[#a78bfa] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
