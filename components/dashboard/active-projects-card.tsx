'use client'

import { useState } from 'react'
import { PROJECTS, statusStyle, type Project } from '@/lib/data'

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
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {PROJECTS.map(project => (
          <ProjectTile
            key={project.key}
            project={project}
            projectDone={projectDone}
            toggleProjectTask={toggleProjectTask}
            completion={getProjectCompletion(project)}
            isExpanded={expanded[project.key] || false}
            onToggleExpand={() => toggleExpand(project.key)}
          />
        ))}
      </div>
    </div>
  )
}

function ProjectTile({
  project,
  projectDone,
  toggleProjectTask,
  completion,
  isExpanded,
  onToggleExpand,
}: {
  project: Project
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  completion: number
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const style = statusStyle(project.status, project.color)
  const visibleTasks = project.tasks.slice(0, 2)
  const hiddenTasks = project.tasks.slice(2)
  const hasMore = hiddenTasks.length > 0 || project.doneTasks.length > 0

  return (
    <div
      className="border border-gray-100 rounded-lg p-[7px] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ borderLeftWidth: 3, borderLeftColor: project.color }}
    >
      <span className="text-[10.5px] font-bold text-gray-900 block truncate mb-0.5">
        {project.name}
      </span>
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[8.5px] font-bold rounded-full px-1.5 py-0.5 whitespace-nowrap"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {project.status}
        </span>
      </div>
      <div className="flex items-center gap-1 mb-0.5">
        <div className="flex-1 h-[3px] bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${completion}%`, backgroundColor: project.color }}
          />
        </div>
        <span className="text-[9px] font-bold text-gray-400 flex-shrink-0">{completion}%</span>
      </div>
      <div className="text-[8.5px] text-gray-400 truncate mb-0.5">
        Next: {project.next}
      </div>

      {/* Visible tasks */}
      <div className="border-t border-gray-50 pt-0.5 mt-0.5">
        {visibleTasks.map((task, i) => {
          const isDone = projectDone[`${project.key}-task-${i}`] || false
          return (
            <TaskRow
              key={i}
              text={task}
              done={isDone}
              onToggle={() => toggleProjectTask(project.key, 'task', i)}
            />
          )
        })}
      </div>

      {/* Expandable section */}
      {hasMore && (
        <>
          {isExpanded && (
            <div className="pt-0.5">
              {hiddenTasks.map((task, i) => {
                const isDone = projectDone[`${project.key}-task-${i + 2}`] || false
                return (
                  <TaskRow
                    key={`hidden-${i}`}
                    text={task}
                    done={isDone}
                    onToggle={() => toggleProjectTask(project.key, 'task', i + 2)}
                  />
                )
              })}
              {project.doneTasks.map((task, i) => {
                const isDone = projectDone[`${project.key}-done-${i}`] !== false
                return (
                  <TaskRow
                    key={`done-${i}`}
                    text={task}
                    done={isDone}
                    onToggle={() => toggleProjectTask(project.key, 'done', i)}
                  />
                )
              })}
            </div>
          )}
          <div
            className="flex items-center gap-0.5 mt-0.5 cursor-pointer"
            onClick={onToggleExpand}
          >
            <span className="text-[8.5px] text-[#a78bfa] font-bold">
              {isExpanded ? 'Show less' : `+${hiddenTasks.length + project.doneTasks.length} more`}
            </span>
            <span className={`text-[8.5px] text-[#a78bfa] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function TaskRow({ text, done, onToggle }: { text: string; done: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex items-start gap-1.5 py-0.5 cursor-pointer select-none"
      onClick={onToggle}
    >
      <div
        className={`w-[11px] h-[11px] rounded-sm border-[1.5px] flex-shrink-0 flex items-center justify-center mt-0.5 ${
          done ? 'bg-[#c4b5fd] border-[#c4b5fd]' : 'border-gray-200'
        }`}
      >
        {done && <span className="text-[7px] font-extrabold text-[#5b21b6]">✓</span>}
      </div>
      <span className={`text-[9.5px] leading-[1.3] ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
        {text}
      </span>
    </div>
  )
}
