'use client'
import { useState, useRef, useEffect } from 'react'
import { PROJECTS, statusStyle, Project } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconStar, IconGripVertical, IconPlus, IconTrash } from '@tabler/icons-react'
import { computeStatus, type TaskMeta } from '@/lib/task-meta'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PROJECT_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#38bdf8', '#a78bfa', '#f97316', '#14b8a6', '#e879f9']
function randomColor() { return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)] }

/* ── Inline editable text ── */
function EditableText({ value, onChange, className, style }: {
  value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])
  if (editing) {
    return <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }}
      onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); if (draft.trim()) onChange(draft.trim()) } if (e.key === 'Escape') { setEditing(false); setDraft(value) } }}
      className={className} style={{ ...style, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '0 4px', outline: 'none', width: '100%' }}
      onClick={e => e.stopPropagation()} />
  }
  return <span className={className} style={{ ...style, cursor: 'text' }} onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

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
}

export function ActiveProjectsCard({
  projectDone, toggleProjectTask, getProjectCompletion,
  taskMeta, updateTaskMeta, openModal, starToPrio,
  isTaskStarred, hideTask, hiddenTasks,
}: ActiveProjectsCardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [taskOrders, setTaskOrders] = useState<Record<string, number[]>>({})
  const [extraProjects, setExtraProjects] = useState<Project[]>([])
  const [projectOrder, setProjectOrder] = useState<string[]>([])
  const [deletedProjects, setDeletedProjects] = useState<Set<string>>(new Set())
  const [customTasks, setCustomTasks] = useState<Record<string, string[]>>({})
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const reorderTasks = (projectKey: string, oldIdx: number, newIdx: number, taskList: { originalIdx: number }[]) => {
    const ids = taskList.map(t => t.originalIdx)
    const reordered = arrayMove(ids, oldIdx, newIdx)
    setTaskOrders(prev => ({ ...prev, [projectKey]: reordered }))
  }

  const allProjects = [...PROJECTS, ...extraProjects].filter(p => !deletedProjects.has(p.key))

  // Apply custom order if set
  const orderedProjects = (() => {
    if (projectOrder.length === 0) return allProjects
    const ordered: Project[] = []
    projectOrder.forEach(key => {
      const p = allProjects.find(pr => pr.key === key)
      if (p) ordered.push(p)
    })
    allProjects.forEach(p => { if (!projectOrder.includes(p.key)) ordered.push(p) })
    return ordered
  })()

  const workProjects = orderedProjects.filter(p => (p.category ?? 'work') === 'work')
  const homeProjects = orderedProjects.filter(p => p.category === 'home')

  const handleAddProject = () => {
    const newProj: Project = {
      key: `custom-${Date.now()}`, name: 'New Project', color: randomColor(),
      status: 'planning', next: 'Define scope', tasks: [], doneTasks: [], category: 'work',
    }
    setExtraProjects(prev => [...prev, newProj])
  }

  const deleteProject = (key: string) => setDeletedProjects(prev => new Set([...prev, key]))

  const renameProject = (key: string, name: string) => setProjectNames(prev => ({ ...prev, [key]: name }))

  const addTaskToProject = (projectKey: string) => {
    setCustomTasks(prev => ({
      ...prev,
      [projectKey]: [...(prev[projectKey] || []), `New task ${Date.now()}`],
    }))
  }

  const deleteCustomTask = (projectKey: string, idx: number) => {
    setCustomTasks(prev => {
      const tasks = [...(prev[projectKey] || [])]
      tasks.splice(idx, 1)
      return { ...prev, [projectKey]: tasks }
    })
  }

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const allKeys = orderedProjects.map(p => p.key)
    const oldIdx = allKeys.indexOf(String(active.id))
    const newIdx = allKeys.indexOf(String(over.id))
    if (oldIdx >= 0 && newIdx >= 0) {
      setProjectOrder(arrayMove(allKeys, oldIdx, newIdx))
    }
  }

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Active projects</span>
          <button onClick={handleAddProject} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
            <IconPlus size={13} />
          </button>
        </div>
      </div>
      <div className="p-3">
        {workProjects.length > 0 && (
          <>
            <SectionHeader label="Work" color="#818cf8" count={workProjects.length} />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
              <SortableContext items={workProjects.map(p => p.key)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-2.5">
                  {workProjects.map(project => (
                    <SortableProject key={project.key} project={project} projectDone={projectDone}
                      toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
                      isExpanded={!!expanded[project.key]} toggleExpand={toggleExpand}
                      taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal}
                      starToPrio={starToPrio} isTaskStarred={isTaskStarred}
                      hideTask={hideTask} hiddenTasks={hiddenTasks}
                      taskOrders={taskOrders} reorderTasks={reorderTasks}
                      onDelete={() => deleteProject(project.key)}
                      onRename={(name) => renameProject(project.key, name)}
                      displayName={projectNames[project.key] || project.name}
                      customTasks={customTasks[project.key] || []}
                      onAddTask={() => addTaskToProject(project.key)}
                      onDeleteCustomTask={(i) => deleteCustomTask(project.key, i)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
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
                  taskOrders={taskOrders} reorderTasks={reorderTasks}
                  onDelete={() => deleteProject(project.key)}
                  onRename={(name) => renameProject(project.key, name)}
                  displayName={projectNames[project.key] || project.name}
                  customTasks={customTasks[project.key] || []}
                  onAddTask={() => addTaskToProject(project.key)}
                  onDeleteCustomTask={(i) => deleteCustomTask(project.key, i)} />
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

/* ── Sortable project wrapper ── */
function SortableProject(props: Parameters<typeof ProjectTile>[0] & { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.project.key })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 20 : 'auto' as any }}>
      <ProjectTile {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

/* ── Project tile ── */
function ProjectTile({
  project, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand,
  taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, hideTask, hiddenTasks,
  taskOrders, reorderTasks, onDelete, onRename, displayName, customTasks, onAddTask, onDeleteCustomTask,
  dragHandleProps,
}: {
  project: Project; projectDone: Record<string, boolean>
  toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number
  isExpanded: boolean; toggleExpand: (k: string) => void
  taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void
  isTaskStarred?: (text: string) => boolean
  hideTask?: (k: string) => void; hiddenTasks?: Set<string>
  taskOrders: Record<string, number[]>
  reorderTasks: (pk: string, o: number, n: number, tl: { originalIdx: number }[]) => void
  onDelete: () => void; onRename: (name: string) => void; displayName: string
  customTasks: string[]; onAddTask: () => void; onDeleteCustomTask: (i: number) => void
  dragHandleProps?: Record<string, any>
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const pct = getProjectCompletion(project)
  const autoStatus = computeStatus(project, projectDone, taskMeta, 'proj')
  const style = statusStyle(autoStatus, project.color)
  const isUrgent = autoStatus.includes('Today') || autoStatus.includes('🔥')
  const category = project.category ?? 'work'

  const indexedTasks = project.tasks.map((task, originalIdx) => ({
    task, originalIdx, done: !!projectDone[`${project.key}-task-${originalIdx}`],
  }))

  const customOrder = taskOrders[project.key]
  let orderedTasks: typeof indexedTasks
  if (customOrder) {
    orderedTasks = customOrder.map(idx => indexedTasks.find(t => t.originalIdx === idx)).filter(Boolean) as typeof indexedTasks
    indexedTasks.forEach(t => { if (!customOrder.includes(t.originalIdx)) orderedTasks.push(t) })
  } else {
    orderedTasks = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))
  }

  const filteredTasks = hiddenTasks ? orderedTasks.filter(t => !hiddenTasks.has(`proj-${project.key}-${t.originalIdx}`)) : orderedTasks
  const visibleTasks = filteredTasks.slice(0, 3)
  const hiddenCount = filteredTasks.slice(3).length + project.doneTasks.length + customTasks.length
  const hasMore = hiddenCount > 0
  const nextLabel = filteredTasks.find(t => !t.done)?.task ?? project.next
  const allVisibleTasks = isExpanded ? filteredTasks : visibleTasks

  const handleDragEnd = (taskList: typeof indexedTasks) => (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = taskList.findIndex(t => t.originalIdx === Number(active.id))
    const newIdx = taskList.findIndex(t => t.originalIdx === Number(over.id))
    if (oldIdx >= 0 && newIdx >= 0) reorderTasks(project.key, oldIdx, newIdx, taskList)
  }

  return (
    <div className="tile-base relative group/tile">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${project.color} 0%, ${project.color}60 55%, transparent 100%)`, boxShadow: `0 0 8px ${project.color}80` }} />
      <div className="p-2.5">
        {/* Header with drag handle + name + delete */}
        <div className="flex items-start gap-1">
          {dragHandleProps && (
            <span {...dragHandleProps} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={e => e.stopPropagation()}>
              <IconGripVertical size={11} className="text-slate-600" />
            </span>
          )}
          <EditableText value={displayName} onChange={onRename}
            className="font-display text-[15px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight flex-1 min-w-0" />
          <button onClick={onDelete} className="icon-on-hover flex-shrink-0 bg-transparent border-none cursor-pointer p-0">
            <IconTrash size={12} className="text-slate-600 hover:text-rose-400" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5 mb-2 gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${isUrgent ? 'pulse-soft' : ''}`} style={{ background: style.text, boxShadow: `0 0 6px ${style.text}` }} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em] truncate" style={{ color: style.text }}>{autoStatus}</span>
          </span>
          <span className="font-display text-[22px] tabular leading-none flex-shrink-0" style={{ color: project.color, textShadow: `0 0 16px ${project.color}aa` }}>{pct}%</span>
        </div>
        <div className="h-[4px] bg-white/5 rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)`, boxShadow: `0 0 6px ${project.color}80` }} />
        </div>
        <div className="text-[10px] text-slate-500 mb-1 whitespace-nowrap overflow-hidden text-ellipsis font-medium">→ {nextLabel}</div>

        <div className="border-t border-white/5 pt-1 mt-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(allVisibleTasks)}>
            <SortableContext items={allVisibleTasks.map(t => t.originalIdx)} strategy={verticalListSortingStrategy}>
              {allVisibleTasks.map(t => (
                <TaskItem key={t.originalIdx} id={t.originalIdx} task={t.task} done={t.done}
                  onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)}
                  onOpen={() => openModal(`proj-${project.key}-${t.originalIdx}`, t.task)}
                  onStar={() => starToPrio(t.task, category)}
                  isStarred={isTaskStarred ? isTaskStarred(t.task) : false}
                  taskKey={`proj-${project.key}-${t.originalIdx}`}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta}
                  onDelete={() => hideTask?.(`proj-${project.key}-${t.originalIdx}`)} />
              ))}
            </SortableContext>
          </DndContext>

          {/* Custom tasks added by user */}
          {(isExpanded ? customTasks : customTasks.slice(0, 1)).map((task, i) => (
            <div key={`custom-${i}`} className="flex items-start gap-1 py-0.5 group">
              <div className="w-2.5 h-2.5 rounded-[2.5px] border border-slate-600 bg-white/5 flex-shrink-0 mt-[2px]" />
              <span className="text-[12.5px] leading-[1.35] text-slate-200 flex-1 min-w-0">{task}</span>
              <button onClick={() => onDeleteCustomTask(i)} className="icon-on-hover bg-transparent border-none cursor-pointer p-0">
                <IconTrash size={10} className="text-slate-500 hover:text-rose-400" />
              </button>
            </div>
          ))}

          {isExpanded && project.doneTasks.map((task, i) => {
            const isDone = projectDone[`${project.key}-done-${i}`] !== false
            return (
              <div key={`done-${i}`} className="flex items-start gap-1 py-0.5 cursor-pointer select-none group" onClick={() => openModal(`proj-${project.key}-done-${i}`, task)}>
                <div onClick={e => { e.stopPropagation(); toggleProjectTask(project.key, 'done', i) }}
                  className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${isDone ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>
                  {isDone && <span className="text-indigo-300 text-[6.5px] font-bold leading-none">✓</span>}
                </div>
                <span className={`text-[12.5px] leading-[1.35] break-words min-w-0 ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task}</span>
              </div>
            )
          })}
        </div>

        {/* Add task + show more */}
        <div className="flex items-center justify-between mt-1">
          <button onClick={onAddTask} className="flex items-center gap-1 text-slate-500 hover:text-[#818cf8] transition-colors">
            <IconPlus size={10} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em]">Add task</span>
          </button>
          {hasMore && (
            <div className="flex items-center gap-1 cursor-pointer text-slate-500 hover:text-[#818cf8] transition-colors" onClick={() => toggleExpand(project.key)}>
              <span className="text-[9px] font-semibold uppercase tracking-[0.10em]">{isExpanded ? 'Less' : `+${hiddenCount}`}</span>
              <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Task item with actions in one wrapping line ── */
function TaskItem({ id, task, done, onClick, onOpen, onStar, isStarred, taskKey, taskMeta, updateTaskMeta, onDelete }: {
  id: number; task: string; done: boolean; onClick: () => void; onOpen: () => void; onStar: () => void
  isStarred: boolean; taskKey: string; taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void; onDelete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const meta = taskMeta[taskKey]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 'auto' as any }}
      className="py-0.5 cursor-pointer select-none group" onClick={onOpen}>
      <div className="flex items-start gap-1">
        <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={e => e.stopPropagation()}>
          <IconGripVertical size={9} className="text-slate-600" />
        </span>
        <div onClick={e => { e.stopPropagation(); onClick() }}
          className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>
          {done && <span className="text-indigo-300 text-[6.5px] font-bold leading-none">✓</span>}
        </div>
        <span className={`text-[12.5px] leading-[1.35] break-words min-w-0 flex-1 ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task}</span>
      </div>

      {/* Actions row — calendar/owner/star/trash in one wrapping line */}
      <div className="flex items-center gap-1 ml-[22px] mt-0.5 flex-wrap" onClick={e => e.stopPropagation()}>
        <TaskActions taskKey={taskKey} taskLabel={task} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
        <button className="bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onStar}>
          <IconStar size={11} className={isStarred ? 'fill-yellow-500 text-yellow-500' : 'icon-on-hover text-slate-500 hover:text-amber-400'}
            style={isStarred ? { filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' } : {}} />
        </button>
        {onDelete && (
          <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onDelete}>
            <IconTrash size={10} className="text-slate-500 hover:text-rose-400" />
          </button>
        )}
      </div>
    </div>
  )
}
