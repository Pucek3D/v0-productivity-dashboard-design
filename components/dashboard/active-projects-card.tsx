'use client'
import { useState } from 'react'
import { PROJECTS, statusStyle, Project } from '@/lib/data'
import { TaskActions } from './task-actions'
import type { TaskMeta } from '@/lib/task-meta'
import { computeStatus } from '@/lib/task-meta'
import { computeStatus } from '@/lib/task-meta'

interface ActiveProjectsCardProps {
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  getProjectCompletion: (project: Project) => number
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
}

export function ActiveProjectsCard({ projectDone, toggleProjectTask, getProjectCompletion, taskMeta, updateTaskMeta }: ActiveProjectsCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const workProjects = PROJECTS.filter(p => (p.category ?? 'work') === 'work')
  const homeProjects = PROJECTS.filter(p => p.category === 'home')

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">
          Active projects
        </span>
      </div>
      <div className="p-3">
        <SectionHeader label="Work" color="#818cf8" count={workProjects.length} />
        <div className="grid grid-cols-2 gap-2.5">
          {workProjects.map(project => (
            <ProjectTile key={project.key} project={project} projectDone={projectDone}
              toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
              isExpanded={!!expanded[project.key]} toggleExpand={toggleExpand}
              taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
          ))}
        </div>
        {homeProjects.length > 0 && (
          <>
            <div className="mt-5">
              <SectionHeader label="Home" color="#2dd4bf" count={homeProjects.length} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {homeProjects.map(project => (
                <ProjectTile key={project.key} project={project} projectDone={projectDone}
                  toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
                  isExpanded={!!expanded[project.key]} toggleExpand={toggleExpand}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
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
    <div className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2.5 flex items-center gap-1.5" style={{ color }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
      <span className="text-slate-500 font-normal ml-0.5">({count})</span>
    </div>
  )
}

function ProjectTile({
  project, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand,
  taskMeta, updateTaskMeta,
}: {
  project: Project
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  getProjectCompletion: (project: Project) => number
  isExpanded: boolean
  toggleExpand: (key: string) => void
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
}) {
  const pct = getProjectCompletion(project)
 const autoStatus = computeStatus(project, projectDone, taskMeta, 'proj')
const style = statusStyle(autoStatus, project.color)
const isUrgent = autoStatus.includes('Today') || autoStatus.includes('🔥')

  const indexedTasks = project.tasks.map((task, originalIdx) => ({
    task, originalIdx, done: !!projectDone[`${project.key}-task-${originalIdx}`],
  }))
  const sortedTasks = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))

  const visibleTasks = sortedTasks.slice(0, 3)
  const hiddenTasks = sortedTasks.slice(3)
  const hasMore = hiddenTasks.length > 0 || project.doneTasks.length > 0
  const nextLabel = sortedTasks.find(t => !t.done)?.task ?? project.next

  return (
    <div className="tile-base relative">
      <div className="h-[2px] w-full" style={{
        background: `linear-gradient(90deg, ${project.color} 0%, ${project.color}60 55%, transparent 100%)`,
        boxShadow: `0 0 8px ${project.color}80`,
      }} />
      <div className="p-2.5">
        <div className="font-display text-[15px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
          {project.name}
        </div>

        <div className="flex items-center justify-between mt-1.5 mb-2 gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${isUrgent ? 'pulse-soft' : ''}`}
              style={{ background: style.text, boxShadow: `0 0 6px ${style.text}` }} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em] truncate" style={{ color: style.text }}>
              {autoStatus}
            </span>
          </span>
          <span className="font-display text-[22px] tabular leading-none flex-shrink-0" style={{
            color: project.color,
            textShadow: `0 0 16px ${project.color}aa, 0 0 32px ${project.color}55`,
          }}>
            {pct}%
          </span>
        </div>

        <div className="h-[4px] bg-white/5 rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)`,
            boxShadow: `0 0 6px ${project.color}80`,
          }} />
        </div>

        <div className="text-[10px] text-slate-500 mb-1 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
          → {nextLabel}
        </div>

        <div className="border-t border-white/5 pt-1 mt-1">
          <div className="grid grid-cols-3 gap-1">
            {visibleTasks.map(t => (
              <TaskItem key={t.originalIdx} task={t.task} done={t.done}
                onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)}
                taskKey={`proj-${project.key}-${t.originalIdx}`}
                taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
            ))}
          </div>
        </div>

        {isExpanded && (
          <div className="pt-0.5">
            <div className="grid grid-cols-3 gap-1">
              {hiddenTasks.map(t => (
                <TaskItem key={t.originalIdx} task={t.task} done={t.done}
                  onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)}
                  taskKey={`proj-${project.key}-${t.originalIdx}`}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
              ))}
              {project.doneTasks.map((task, i) => {
                const isDone = projectDone[`${project.key}-done-${i}`] !== false
                return <TaskItem key={`done-${i}`} task={task} done={isDone}
                  onClick={() => toggleProjectTask(project.key, 'done', i)}
                  taskKey={`proj-${project.key}-done-${i}`}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
              })}
            </div>
          </div>
        )}

        {hasMore && (
          <div className="flex items-center gap-1 mt-1 cursor-pointer text-slate-500 hover:text-[#818cf8] transition-colors"
            onClick={() => toggleExpand(project.key)}>
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

function TaskItem({ task, done, onClick, taskKey, taskMeta, updateTaskMeta }: {
  task: string; done: boolean; onClick: () => void
  taskKey: string; taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
}) {
  return (
    <div className="flex items-start gap-1 py-0.5 cursor-pointer select-none group" onClick={onClick}>
      <div className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${
        done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'
      }`}>
        {done && <span className="text-indigo-300 text-[6.5px] font-bold leading-none">✓</span>}
      </div>
      <span className={`text-[11px] leading-[1.3] ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
        {task}
      </span>
      <TaskActions taskKey={taskKey} taskLabel={task} taskMeta={taskMeta}
        updateTaskMeta={updateTaskMeta} compact />
    </div>
  )
}