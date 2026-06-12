'use client'
import { useState } from 'react'
import { PROJECTS, statusStyle, Project } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconStar, IconGripVertical, IconPlus } from '@tabler/icons-react'
import { computeStatus, type TaskMeta } from '@/lib/task-meta'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/* ─── badge helpers (shared pattern) ─── */
function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null
  const map: Record<string, { bg: string; text: string; border: string }> = {
    high: { bg: 'rgba(251,113,133,0.15)', text: '#fb7185', border: 'rgba(251,113,133,0.30)' },
    medium: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.30)' },
    low: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.30)' },
  }
  const s = map[priority] || map.low
  return (
    <span style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 3, padding: '0px 3px', lineHeight: '14px', whiteSpace: 'nowrap' }}>
      {priority.slice(0, 4).toUpperCase()}
    </span>
  )
}

function RecurringBadge({ recurring }: { recurring?: string | null }) {
  if (!recurring) return null
  const map: Record<string, { bg: string; text: string; border: string }> = {
    daily: { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: 'rgba(168,85,247,0.30)' },
    weekly: { bg: 'rgba(34,211,238,0.15)', text: '#22d3ee', border: 'rgba(34,211,238,0.30)' },
    monthly: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.30)' },
  }
  const s = map[recurring] || map.weekly
  return (
    <span style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 3, padding: '0px 3px', lineHeight: '14px', whiteSpace: 'nowrap' }}>
      {recurring.slice(0, 3).toUpperCase()}
    </span>
  )
}

/* ─── random color for new projects ─── */
const PROJECT_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#38bdf8', '#a78bfa', '#f97316', '#14b8a6', '#e879f9']
function randomColor() { return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)] }

/* ─── main interface ─── */
interface ActiveProjectsCardProps {
  projectDone: Record<string, boolean>
  toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void
  isTaskStarred?: (text: string) => boolean
  hideTask?: (k: string) => void
  hiddenTasks?: Set<string>
  onAddProject?: (project: Project) => void
}

export function ActiveProjectsCard({
  projectDone, toggleProjectTask, getProjectCompletion,
  taskMeta, updateTaskMeta, openModal, starToPrio,
  isTaskStarred, hideTask, hiddenTasks,
  onAddProject,
}: ActiveProjectsCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [taskOrders, setTaskOrders] = useState<Record<string, number[]>>({})
  const [extraProjects, setExtraProjects] = useState<Project[]>([])
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const reorderTasks = (projectKey: string, oldIdx: number, newIdx: number, taskList: { originalIdx: number }[]) => {
    const ids = taskList.map(t => t.originalIdx)
    const reordered = arrayMove(ids, oldIdx, newIdx)
    setTaskOrders(prev => ({ ...prev, [projectKey]: reordered }))
  }

  const allProjects = [...PROJECTS, ...extraProjects]
  const workProjects = allProjects.filter(p => (p.category ?? 'work') === 'work')
  const homeProjects = allProjects.filter(p => p.category === 'home')

  const handleAddProject = () => {
    const newProj: Project = {
      key: `custom-${Date.now()}`,
      name: 'New Project',
      color: randomColor(),
      status: 'planning',
      next: 'Define scope',
      tasks: [],
      doneTasks: [],
      category: 'work',
    }
    setExtraProjects(prev => [...prev, newProj])
    if (onAddProject) onAddProject(newProj)
  }

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Active projects</span>
          <button onClick={handleAddProject}
            className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
            <IconPlus size={13} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <SectionHeader label="Work" color="#818cf8" count={workProjects.length} />
        <div className="grid grid-cols-2 gap-2.5">
          {workProjects.map(project => (
            <ProjectTile key={project.key} project={project} projectDone={projectDone}
              toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
              isExpanded={!!expanded[project.key]} toggleExpand={toggleExpand}
              taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal}
              starToPrio={starToPrio} isTaskStarred={isTaskStarred}
              hideTask={hideTask} hiddenTasks={hiddenTasks}
              taskOrders={taskOrders} reorderTasks={reorderTasks} />
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
                  starToPrio={starToPrio} isTaskStarred={isTaskStarred}
                  hideTask={hideTask} hiddenTasks={hiddenTasks}
                  taskOrders={taskOrders} reorderTasks={reorderTasks} />
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
  taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, hideTask, hiddenTasks,
  taskOrders, reorderTasks,
}: {
  project: Project; projectDone: Record<string, boolean>
  toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number
  isExpanded: boolean; toggleExpand: (k: string) => void
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void
  isTaskStarred?: (text: string) => boolean
  hideTask?: (k: string) => void
  hiddenTasks?: Set<string>
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

  const customOrder = taskOrders[project.key]
  let orderedTasks: typeof indexedTasks
  if (customOrder) {
    orderedTasks = customOrder
      .map(idx => indexedTasks.find(t => t.originalIdx === idx))
      .filter(Boolean) as typeof indexedTasks
    indexedTasks.forEach(t => {
      if (!customOrder.includes(t.originalIdx)) orderedTasks.push(t)
    })
  } else {
    orderedTasks = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))
  }

  // filter hidden tasks
  const filteredTasks = hiddenTasks
    ? orderedTasks.filter(t => !hiddenTasks.has(`proj-${project.key}-${t.originalIdx}`))
    : orderedTasks

  const visibleTasks = filteredTasks.slice(0, 3)
  const hiddenCount = filteredTasks.slice(3).length + project.doneTasks.length
  const hasMore = hiddenCount > 0
  const nextLabel = filteredTasks.find(t => !t.done)?.task ?? project.next

  const handleDragEnd = (taskList: typeof indexedTasks) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = taskList.findIndex(t => t.originalIdx === Number(active.id))
    const newIdx = taskList.findIndex(t => t.originalIdx === Number(over.id))
    if (oldIdx >= 0 && newIdx >= 0) reorderTasks(project.key, oldIdx, newIdx, taskList)
  }

  const allVisibleTasks = isExpanded ? filteredTasks : visibleTasks

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
                  isStarred={isTaskStarred ? isTaskStarred(t.task) : false}
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
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em]">{isExpanded ? 'Show less' : `+${hiddenCount} more`}</span>
            <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── sortable task item — star UNDER owner line, badges visible ─── */
function SortableTaskItem({ id, task, done, onClick, onOpen, onStar, isStarred, taskKey, taskMeta, updateTaskMeta }: {
  id: number; task: string; done: boolean; onClick: () => void; onOpen: () => void; onStar: () => void
  isStarred: boolean
  taskKey: string; taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const meta = taskMeta[taskKey]

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

      <div className="flex flex-col min-w-0 flex-1 gap-0">
        <span className={`text-[12.5px] leading-[1.35] break-words min-w-0 ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task}</span>

        {/* badges + star row — UNDER task text */}
        <div className="flex items-center gap-1 mt-0.5">
          <PriorityBadge priority={meta?.priority} />
          <RecurringBadge recurring={meta?.recurring} />
          {meta?.owner && (
            <span style={{ fontSize: 7, fontWeight: 500, color: '#2dd4bf', background: 'rgba(45,212,191,0.12)',
              padding: '0px 3px', borderRadius: 3, lineHeight: '14px' }}>{meta.owner}</span>
          )}
        </div>
      </div>

      <span className="flex flex-col items-end gap-0 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
        <TaskActions taskKey={taskKey} taskLabel={task} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
        {/* Star — always yellow when starred, below actions */}
        <button className="bg-transparent border-none cursor-pointer p-0 leading-none mt-0.5" onClick={onStar}>
          <IconStar size={11}
            className={isStarred ? 'fill-yellow-500 text-yellow-500' : 'icon-on-hover text-slate-500 hover:text-amber-400'}
            style={isStarred ? { filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' } : {}} />
        </button>
      </span>
    </div>
  )
}
