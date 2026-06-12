'use client'
import { useState } from 'react'
import { PROJECTS, statusStyle, Project } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconStar, IconGripVertical } from '@tabler/icons-react'
import { computeStatus, type TaskMeta } from '@/lib/task-meta'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ActiveProjectsCardProps {
  projectDone: Record<string, boolean>
  toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void
}

export function ActiveProjectsCard({ projectDone, toggleProjectTask, getProjectCompletion, taskMeta, updateTaskMeta, openModal, starToPrio }: ActiveProjectsCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [taskOrders, setTaskOrders] = useState<Record<string, number[]>>({})
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const reorderTasks = (projectKey: string, oldIdx: number, newIdx: number, taskList: { originalIdx: number }[]) => {
    const ids = taskList.map(t => t.originalIdx)
    const reordered = arrayMove(ids, oldIdx, newIdx)
    setTaskOrders(prev => ({ ...prev, [projectKey]: reordered }))
  }

  const workProjects = PROJECTS.filter(p => (p.category ?? 'work') === 'work')
  const homeProjects = PROJECTS.filter(p => p.category === 'home')

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Active projects</span>
      </div>
      <div className="p-3">
        <SectionHeader label="Work" color="#818cf8" count={workProjects.length} />
        <div className="grid grid-cols-2 gap-2.5">
          {workProjects.map(project => (
            <ProjectTile key={project.key} project={project} projectDone={projectDone}
              toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
              isExpanded={!!expanded[project.key]} toggleExpand={toggleExpand}
              taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal}
              starToPrio={starToPrio} taskOrders={taskOrders} reorderTasks={reorderTasks} />
          ))}
        </div>
        {homeProjects.length > 0 && (
          <>
            <div className="mt-5"><SectionHeader label="Home" color="#2dd4bf" count={homeProjects.length} /></div>
            <div className="grid grid-cols-2 gap-2.5">
              {homeProjects.map(project => (
                <ProjectTile key={project.key} project={project} projectDone={projectDone}
                  toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
                  isExpanded={!!expanded[project.key]} toggleExpand={toggleExpand}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal}
                  starToPrio={starToPrio} taskOrders={taskOrders} reorderTasks={reorderTasks} />
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
      {label}<span className="text-slate-500 font-normal ml-0.5">({count})</span>
    </div>
  )
}

function ProjectTile({
  project, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand,
  taskMeta, updateTaskMeta, openModal, starToPrio, taskOrders, reorderTasks,
}: {
  project: Project; projectDone: Record<string, boolean>
  toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number
  isExpanded: boolean; toggleExpand: (k: string) => void
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void
  taskOrders: Record<string, number[]>
  reorderTasks: (projectKey: string, oldIdx: number, newIdx: number, taskList: { originalIdx: number }[]) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const pct = getProjectCompletion(project)
  const autoStatus = computeStatus(project, projectDone, taskMeta, 'proj')
  const style = statusStyle(autoStatus, project.color)
  const isUrgent = autoStatus.includes('Today') || autoStatus.includes('🔥')
  const streak = Object.keys(projectDone).filter(k => k.startsWith(`${project.key}-`) && projectDone[k]).length
  const category = project.category ?? 'work'

  const indexedTasks = project.tasks.map((task, originalIdx) => ({
    task, originalIdx, done: !!projectDone[`${project.key}-task-${originalIdx}`],
  }))

  // Apply custom order if exists, otherwise sort done to bottom
  const customOrder = taskOrders[project.key]
  let orderedTasks: typeof indexedTasks
  if (customOrder) {
    orderedTasks = customOrder
      .map(idx => indexedTasks.find(t => t.originalIdx === idx))
      .filter(Boolean) as typeof indexedTasks
    // Add any tasks not in custom order
    indexedTasks.forEach(t => {
      if (!customOrder.includes(t.originalIdx)) orderedTasks.push(t)
    })
  } else {
    orderedTasks = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))
  }

  const visibleTasks = orderedTasks.slice(0, 3)
  const hiddenTasks = orderedTasks.slice(3)
  const hasMore = hiddenTasks.length > 0 || project.doneTasks.length > 0
  const nextLabel = orderedTasks.find(t => !t.done)?.task ?? project.next

  const handleDragEnd = (taskList: typeof indexedTasks) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = taskList.findIndex(t => t.originalIdx === Number(active.id))
    const newIdx = taskList.findIndex(t => t.originalIdx === Number(over.id))
    if (oldIdx >= 0 && newIdx >= 0) reorderTasks(project.key, oldIdx, newIdx, taskList)
  }

  const allVisibleTasks = isExpanded ? orderedTasks : visibleTasks

  return (
    <div className="tile-base relative">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${project.color} 0%, ${project.color}60 55%, transparent 100%)`, boxShadow: `0 0 8px ${project.color}80` }} />
      <div className="p-2.5">
        <div className="font-display text-[15px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{project.name}</div>
        <div className="flex items-center justify-between mt-1.5 mb-2 gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${isUrgent ? 'pulse-soft' : ''}`} style={{ background: style.text, boxShadow: `0 0 6px ${style.text}` }} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em] truncate" style={{ color: style.text }}>
              {autoStatus}
              {streak > 5 && <span style={{ fontSize: 8, fontWeight: 700, color: '#fbbf24', marginLeft: 4 }}>🔥{streak}</span>}
            </span>
          </span>
          <span className="font-display text-[22px] tabular leading-none flex-shrink-0" style={{ color: project.color, textShadow: `0 0 16px ${project.color}aa, 0 0 32px ${project.color}55` }}>{pct}%</span>
        </div>
        <div className="h-[4px] bg-white/5 rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)`, boxShadow: `0 0 6px ${project.color}80` }} />
        </div>
        <div className="text-[10px] text-slate-500 mb-1 whitespace-nowrap overflow-hidden text-ellipsis font-medium">→ {nextLabel}</div>

        <div className="border-t border-white/5 pt-1 mt-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(allVisibleTasks)}>
            <SortableContext items={allVisibleTasks.map(t => t.originalIdx)} strategy={verticalListSortingStrategy}>
              {allVisibleTasks.map(t => (
                <SortableTaskItem key={t.originalIdx} id={t.originalIdx} task={t.task} done={t.done}
                  onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)}
                  onOpen={() => openModal(`proj-${project.key}-${t.originalIdx}`, t.task)}
                  onStar={() => starToPrio(t.task, category)}
                  taskKey={`proj-${project.key}-${t.originalIdx}`}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
              ))}
            </SortableContext>
          </DndContext>

          {isExpanded && project.doneTasks.map((task, i) => {
            const isDone = projectDone[`${project.key}-done-${i}`] !== false
            return (
              <div key={`done-${i}`} className="flex items-start gap-1 py-0.5 cursor-pointer select-none group" onClick={() => openModal(`proj-${project.key}-done-${i}`, task)}>
                <div onClick={(e) => { e.stopPropagation(); toggleProjectTask(project.key, 'done', i) }}
                  className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${isDone ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>
                  {isDone && <span className="text-indigo-300 text-[6.5px] font-bold leading-none">✓</span>}
                </div>
                <span className={`text-[12.5px] leading-[1.35] break-words min-w-0 ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task}</span>
              </div>
            )
          })}
        </div>

        {hasMore && (
          <div className="flex items-center gap-1 mt-1 cursor-pointer text-slate-500 hover:text-[#818cf8] transition-colors" onClick={() => toggleExpand(project.key)}>
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em]">{isExpanded ? 'Show less' : `+${hiddenTasks.length + project.doneTasks.length} more`}</span>
            <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableTaskItem({ id, task, done, onClick, onOpen, onStar, taskKey, taskMeta, updateTaskMeta }: {
  id: number; task: string; done: boolean; onClick: () => void; onOpen: () => void; onStar: () => void
  taskKey: string; taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 'auto' as any }}
      className="flex items-start gap-1 py-0.5 cursor-pointer select-none group" onClick={onOpen}>
      <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={e => e.stopPropagation()}>
        <IconGripVertical size={9} className="text-slate-600" />
      </span>
      <div onClick={(e) => { e.stopPropagation(); onClick() }}
        className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>
        {done && <span className="text-indigo-300 text-[6.5px] font-bold leading-none">✓</span>}
      </div>
      <span className={`text-[12.5px] leading-[1.35] break-words min-w-0 ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task}</span>
      <span className="flex flex-col items-end gap-0 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
        <TaskActions taskKey={taskKey} taskLabel={task} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
        <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onStar}>
          <IconStar size={11} className="text-slate-500 hover:text-amber-400" />
        </button>
      </span>
    </div>
  )
}