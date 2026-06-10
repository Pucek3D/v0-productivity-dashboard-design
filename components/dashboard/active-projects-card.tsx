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

  const workProjects = PROJECTS.filter(p => (p.category ?? 'work') === 'work')
  const homeProjects = PROJECTS.filter(p => p.category === 'home')

  return (
    <div className="card-base halo-indigo">
      <div className="section-header header-indigo px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Active projects
        </span>
      </div>
      <div className="p-2.5">
        <SectionHeader label="Work" color="#4338ca" count={workProjects.length} />
        <div className="grid grid-cols-2 gap-2">
          {workProjects.map(project => (
            <ProjectTile
              key={project.key}
              project={project}
              projectDone={projectDone}
              toggleProjectTask={toggleProjectTask}
              getProjectCompletion={getProjectCompletion}
              isExpanded={!!expanded[project.key]}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>

        {homeProjects.length > 0 && (
          <>
            <div className="mt-5">
              <SectionHeader label="Home" color="#047857" count={homeProjects.length} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {homeProjects.map(project => (
                <ProjectTile
                  key={project.key}
                  project={project}
                  projectDone={projectDone}
                  toggleProjectTask={toggleProjectTask}
                  getProjectCompletion={getProjectCompletion}
                  isExpanded={!!expanded[project.key]}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ label, color, count }: { label: string; color: string; count: number }) {
  return (
    <div
      className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2.5 flex items-center gap-1.5"
      style={{ color }}
    >
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
      <span className="text-[#a8a29e] font-normal ml-0.5">({count})</span>
    </div>
  )
}

function ProjectTile({
  project, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand,
}: {
  project: Project
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  getProjectCompletion: (project: Project) => number
  isExpanded: boolean
  toggleExpand: (key: string) => void
}) {
  const pct = getProjectCompletion(project)
  const style = statusStyle(project.status, project.color)
  const isUrgent = project.status.includes('Today') || project.status.includes('🔥')

  const indexedTasks = project.tasks.map((task, originalIdx) => ({
    task,
    originalIdx,
    done: !!projectDone[`${project.key}-task-${originalIdx}`],
  }))
  const sortedTasks = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))

  const visibleTasks = sortedTasks.slice(0, 3)
  const hiddenTasks = sortedTasks.slice(3)
  const hasMore = hiddenTasks.length > 0 || project.doneTasks.length > 0
  const nextLabel = sortedTasks.find(t => !t.done)?.task ?? project.next

  return (
    <div className="bg-white border border-[#f0efeb] rounded-lg overflow-hidden relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.04)]">
      {/* Top accent gradient bar */}
      <div
        className="h-[2.5px] w-full"
        style={{ background: `linear-gradient(90deg, ${project.color} 0%, ${project.color}60 55%, transparent 100%)` }}
      />

      <div className="p-2">
        <div className="font-display text-[16px] tracking-tight text-[#0a0a0a] whitespace-nowrap overflow-hidden text-ellipsis text-shadow-soft leading-tight">
          {project.name}
        </div>

        <div className="flex items-center justify-between mt-1 mb-2 gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <span
              className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${isUrgent ? 'pulse-soft' : ''}`}
              style={{ background: style.text }}
            />
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em] truncate" style={{ color: style.text }}>
              {project.status}
            </span>
          </span>
          <span
            className="font-display text-[22px] tabular leading-none flex-shrink-0"
            style={{
              color: project.color,
              textShadow: `0 0 16px ${project.color}40, 0 1px 2px rgba(0,0,0,0.04)`,
            }}
          >
            {pct}%
          </span>
        </div>

        <div className="h-[4px] bg-[#f5f5f1] rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: project.color }} />
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
    </div>
  )
}