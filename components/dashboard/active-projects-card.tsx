'use client'
import { useState } from 'react'
import { PROJECTS, statusStyle, Project } from '@/lib/data'

interface ActiveProjectsCardProps {
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  getProjectCompletion: (project: Project) => number
}

export function ActiveProjectsCard({ projectDone, toggleProjectTask, getProjectCompletion }: ActiveProjectsCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="card-base halo-indigo">
      <div className="section-header header-indigo px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Active projects
        </span>
      </div>
      <div className="p-2.5">
        <div className="grid grid-cols-2 gap-2">
          {PROJECTS.map(project => {
            const pct = getProjectCompletion(project)
            const style = statusStyle(project.status, project.color)
            const isExpanded = expanded[project.key]

            // Build indexed list, sort: undone first, done sink to bottom
            const indexedTasks = project.tasks.map((task, originalIdx) => ({
              task,
              originalIdx,
              done: !!projectDone[`${project.key}-task-${originalIdx}`],
            }))
            const sortedTasks = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))

            const visibleTasks = sortedTasks.slice(0, 3)
            const hiddenTasks = sortedTasks.slice(3)
            const hasMore = hiddenTasks.length > 0 || project.doneTasks.length > 0

            // "→" line shows next undone task dynamically (fallback to project.next from data)
            const nextLabel = sortedTasks.find(t => !t.done)?.task ?? project.next

            return (
              <div
                key={project.key}
                className="bg-white border border-[#f0efeb] rounded-lg p-2 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_20px_rgba(0,0,0,0.04)]"
                style={{ borderLeft: `3px solid ${project.color}` }}
              >
                <div className="font-display text-[16px] tracking-tight text-[#0a0a0a] whitespace-nowrap overflow-hidden text-ellipsis text-shadow-soft leading-tight">
                  {project.name}
                </div>
                <div className="flex items-center justify-between mt-1 mb-1.5">
                  <span
                    className="text-[8.5px] font-semibold rounded-full px-1.5 py-[1px] uppercase tracking-[0.08em] whitespace-nowrap"
                    style={{ background: style.bg, color: style.text }}
                  >
                    {project.status}
                  </span>
                  <span className="font-display text-[14px] tabular text-shadow-soft leading-none" style={{ color: project.color }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-[3px] bg-[#f5f5f1] rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: project.color }}
                  />
                </div>
                <div className="text-[10px] text-[#a8a29e] mb-1 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                  → {nextLabel}
                </div>

                <div className="border-t border-[#f5f5f1] pt-1 mt-1">
                  <div className="grid grid-cols-3 gap-1">
                    {visibleTasks.map(t => (
                      <div
                        key={t.originalIdx}
                        className="flex items-start gap-1 py-0.5 cursor-pointer select-none"
                        onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)}
                      >
                        <div className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${
                          t.done ? 'bg-[#c7d2fe] border-[#c7d2fe]' : 'border-[#d6d3d1] bg-white'
                        }`}>
                          {t.done && <span className="text-[#3730a3] text-[6.5px] font-bold leading-none">✓</span>}
                        </div>
                        <span className={`text-[9px] leading-[1.2] ${t.done ? 'text-[#a8a29e] line-through' : 'text-[#0a0a0a]'}`}>
                          {t.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-0.5">
                    <div className="grid grid-cols-3 gap-1">
                      {hiddenTasks.map(t => (
                        <div
                          key={t.originalIdx}
                          className="flex items-start gap-1 py-0.5 cursor-pointer select-none"
                          onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)}
                        >
                          <div className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${
                            t.done ? 'bg-[#c7d2fe] border-[#c7d2fe]' : 'border-[#d6d3d1] bg-white'
                          }`}>
                            {t.done && <span className="text-[#3730a3] text-[6.5px] font-bold leading-none">✓</span>}
                          </div>
                          <span className={`text-[9px] leading-[1.2] ${t.done ? 'text-[#a8a29e] line-through' : 'text-[#0a0a0a]'}`}>
                            {t.task}
                          </span>
                        </div>
                      ))}
                      {project.doneTasks.map((task, i) => {
                        const isDone = projectDone[`${project.key}-done-${i}`] !== false
                        return (
                          <div
                            key={`done-${i}`}
                            className="flex items-start gap-1 py-0.5 cursor-pointer select-none"
                            onClick={() => toggleProjectTask(project.key, 'done', i)}
                          >
                            <div className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${
                              isDone ? 'bg-[#c7d2fe] border-[#c7d2fe]' : 'border-[#d6d3d1] bg-white'
                            }`}>
                              {isDone && <span className="text-[#3730a3] text-[6.5px] font-bold leading-none">✓</span>}
                            </div>
                            <span className={`text-[9px] leading-[1.2] ${isDone ? 'text-[#a8a29e] line-through' : 'text-[#0a0a0a]'}`}>
                              {task}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {hasMore && (
                  <div
                    className="flex items-center gap-1 mt-1 cursor-pointer text-[#a8a29e] hover:text-[#4338ca] transition-colors"
                    onClick={() => toggleExpand(project.key)}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-[0.10em]">
                      {isExpanded ? 'Show less' : `+${hiddenTasks.length + project.doneTasks.length} more`}
                    </span>
                    <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
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