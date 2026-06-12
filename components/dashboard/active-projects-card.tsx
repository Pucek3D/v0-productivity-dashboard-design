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
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PROJECT_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#38bdf8', '#a78bfa', '#f97316', '#14b8a6', '#e879f9']
function randomColor() { return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)] }

/* ── Meta badges (priority/recurring/estimate) ── */
function MetaBadges({ meta }: { meta?: TaskMeta }) {
  if (!meta) return null
  const badges: React.ReactNode[] = []
  if (meta.priority) {
    const c = meta.priority === 'high' ? '#fb7185' : meta.priority === 'medium' ? '#fbbf24' : '#94a3b8'
    badges.push(<span key="p" style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>{meta.priority.slice(0,3)}</span>)
  }
  if (meta.recurring) {
    badges.push(<span key="r" style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>{String(meta.recurring).slice(0,3)}</span>)
  }
  if (meta.timeEstimate) {
    badges.push(<span key="t" style={{ fontSize: 7, fontWeight: 600, color: '#64748b', background: 'rgba(255,255,255,0.05)', borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>{meta.timeEstimate >= 60 ? `${meta.timeEstimate/60}h` : `${meta.timeEstimate}m`}</span>)
  }
  if (badges.length === 0) return null
  return <>{badges}</>
}

/* ── Editable text ── */
function EditableText({ value, onChange, className, style }: { value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])
  if (editing) return <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }} onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); if (draft.trim()) onChange(draft.trim()) } if (e.key === 'Escape') { setEditing(false); setDraft(value) } }} className={className} style={{ ...style, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '0 4px', outline: 'none', width: '100%' }} onClick={e => e.stopPropagation()} />
  return <span className={className} style={{ ...style, cursor: 'text' }} onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

interface ActiveProjectsCardProps {
  projectDone: Record<string, boolean>; toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number; taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void; openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void; isTaskStarred?: (text: string) => boolean
  hideTask?: (k: string) => void; hiddenTasks?: Set<string>
}

export function ActiveProjectsCard({ projectDone, toggleProjectTask, getProjectCompletion, taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, hideTask, hiddenTasks }: ActiveProjectsCardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [taskOrders, setTaskOrders] = useState<Record<string, number[]>>({})
  const [extraProjects, setExtraProjects] = useState<Project[]>([])
  const [projectOrder, setProjectOrder] = useState<string[]>([])
  const [deletedProjects, setDeletedProjects] = useState<Set<string>>(new Set())
  const [customTasks, setCustomTasks] = useState<Record<string, string[]>>({})
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})

  const reorderTasks = (pk: string, o: number, n: number, tl: { originalIdx: number }[]) => { const ids = tl.map(t => t.originalIdx); setTaskOrders(prev => ({ ...prev, [pk]: arrayMove(ids, o, n) })) }
  const allProjects = [...PROJECTS, ...extraProjects].filter(p => !deletedProjects.has(p.key))
  const orderedProjects = (() => { if (!projectOrder.length) return allProjects; const o: Project[] = []; projectOrder.forEach(k => { const p = allProjects.find(pr => pr.key === k); if (p) o.push(p) }); allProjects.forEach(p => { if (!projectOrder.includes(p.key)) o.push(p) }); return o })()
  const workProjects = orderedProjects.filter(p => (p.category ?? 'work') === 'work')
  const homeProjects = orderedProjects.filter(p => p.category === 'home')

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event; if (!over || active.id === over.id) return
    const keys = orderedProjects.map(p => p.key); const oi = keys.indexOf(String(active.id)); const ni = keys.indexOf(String(over.id))
    if (oi >= 0 && ni >= 0) setProjectOrder(arrayMove(keys, oi, ni))
  }

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Active projects</span>
          <button onClick={() => setExtraProjects(prev => [...prev, { key: `custom-${Date.now()}`, name: 'New Project', color: randomColor(), status: 'planning', next: 'Define scope', tasks: [], doneTasks: [], category: 'work' }])}
            className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5"><IconPlus size={13} /></button>
        </div>
      </div>
      <div className="p-3">
        {workProjects.length > 0 && <>
          <div className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-2 flex items-center gap-1.5" style={{ color: '#818cf8' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#818cf8', boxShadow: '0 0 8px #818cf8' }} />Work<span className="text-slate-500 font-normal ml-0.5">({workProjects.length})</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
            <SortableContext items={workProjects.map(p => p.key)} strategy={verticalListSortingStrategy}>
              {/* SINGLE COLUMN — stacked vertically */}
              <div className="flex flex-col gap-2">
                {workProjects.map(project => (
                  <SortableProjectWrap key={project.key} project={project} projectDone={projectDone}
                    toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
                    isExpanded={!!expanded[project.key]} toggleExpand={(k) => setExpanded(p => ({...p,[k]:!p[k]}))}
                    taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal}
                    starToPrio={starToPrio} isTaskStarred={isTaskStarred} hideTask={hideTask} hiddenTasks={hiddenTasks}
                    taskOrders={taskOrders} reorderTasks={reorderTasks}
                    onDelete={() => setDeletedProjects(p => new Set([...p, project.key]))}
                    onRename={(n) => setProjectNames(p => ({...p,[project.key]:n}))}
                    displayName={projectNames[project.key] || project.name}
                    customTasks={customTasks[project.key] || []}
                    onAddTask={() => setCustomTasks(p => ({...p,[project.key]:[...(p[project.key]||[]),`New task`]}))}
                    onDeleteCustomTask={(i) => setCustomTasks(p => { const t = [...(p[project.key]||[])]; t.splice(i,1); return {...p,[project.key]:t} })} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>}
        {homeProjects.length > 0 && <>
          <div className="text-[11px] font-semibold tracking-[0.18em] uppercase mt-4 mb-2 flex items-center gap-1.5" style={{ color: '#2dd4bf' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2dd4bf', boxShadow: '0 0 8px #2dd4bf' }} />Home<span className="text-slate-500 font-normal ml-0.5">({homeProjects.length})</span>
          </div>
          <div className="flex flex-col gap-2">
            {homeProjects.map(project => (
              <ProjectTile key={project.key} project={project} projectDone={projectDone} toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion} isExpanded={!!expanded[project.key]} toggleExpand={(k) => setExpanded(p => ({...p,[k]:!p[k]}))} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} hideTask={hideTask} hiddenTasks={hiddenTasks} taskOrders={taskOrders} reorderTasks={reorderTasks} onDelete={() => setDeletedProjects(p => new Set([...p, project.key]))} onRename={(n) => setProjectNames(p => ({...p,[project.key]:n}))} displayName={projectNames[project.key] || project.name} customTasks={customTasks[project.key] || []} onAddTask={() => setCustomTasks(p => ({...p,[project.key]:[...(p[project.key]||[]),`New task`]}))} onDeleteCustomTask={(i) => setCustomTasks(p => { const t = [...(p[project.key]||[])]; t.splice(i,1); return {...p,[project.key]:t} })} />
            ))}
          </div>
        </>}
      </div>
    </div>
  )
}

function SortableProjectWrap(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.project.key })
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
    <ProjectTile {...props} dragHandleProps={{ ...attributes, ...listeners }} />
  </div>
}

function ProjectTile({ project, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand, taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, hideTask, hiddenTasks, taskOrders, reorderTasks, onDelete, onRename, displayName, customTasks, onAddTask, onDeleteCustomTask, dragHandleProps }: any) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const pct = getProjectCompletion(project)
  const autoStatus = computeStatus(project, projectDone, taskMeta, 'proj')
  const style = statusStyle(autoStatus, project.color)
  const isUrgent = autoStatus.includes('Today') || autoStatus.includes('🔥')
  const category = project.category ?? 'work'

  const indexedTasks = project.tasks.map((task: string, i: number) => ({ task, originalIdx: i, done: !!projectDone[`${project.key}-task-${i}`] }))
  const customOrder = taskOrders[project.key]
  let orderedTasks = customOrder ? customOrder.map((idx: number) => indexedTasks.find((t: any) => t.originalIdx === idx)).filter(Boolean) : [...indexedTasks].sort((a: any, b: any) => Number(a.done) - Number(b.done))
  if (customOrder) indexedTasks.forEach((t: any) => { if (!customOrder.includes(t.originalIdx)) orderedTasks.push(t) })
  const filteredTasks = hiddenTasks ? orderedTasks.filter((t: any) => !hiddenTasks.has(`proj-${project.key}-${t.originalIdx}`)) : orderedTasks
  const visible = isExpanded ? filteredTasks : filteredTasks.slice(0, 3)
  const hiddenCount = filteredTasks.length - 3 + project.doneTasks.length + customTasks.length
  const nextLabel = filteredTasks.find((t: any) => !t.done)?.task ?? project.next

  return (
    <div className="tile-base relative">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${project.color} 0%, ${project.color}60 55%, transparent 100%)`, boxShadow: `0 0 8px ${project.color}80` }} />
      <div className="p-2.5">
        <div className="flex items-start gap-1">
          {dragHandleProps && <span {...dragHandleProps} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={(e: any) => e.stopPropagation()}><IconGripVertical size={11} className="text-slate-600" /></span>}
          <EditableText value={displayName} onChange={onRename} className="font-display text-[15px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight flex-1 min-w-0" />
          <button onClick={onDelete} className="icon-on-hover flex-shrink-0 bg-transparent border-none cursor-pointer p-0"><IconTrash size={12} className="text-slate-600 hover:text-rose-400" /></button>
        </div>
        <div className="flex items-center justify-between mt-1.5 mb-1.5 gap-2">
          <span className="flex items-center gap-1.5"><span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${isUrgent ? 'pulse-soft' : ''}`} style={{ background: style.text, boxShadow: `0 0 6px ${style.text}` }} /><span className="text-[9px] font-semibold uppercase tracking-[0.10em] truncate" style={{ color: style.text }}>{autoStatus}</span></span>
          <span className="font-display text-[20px] tabular leading-none flex-shrink-0" style={{ color: project.color }}>{pct}%</span>
        </div>
        <div className="text-[10px] text-slate-500 mb-1 truncate font-medium">→ {nextLabel}</div>

        <div className="border-t border-white/5 pt-1 mt-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => { const { active, over } = e; if (!over || active.id === over.id) return; const oi = visible.findIndex((t: any) => t.originalIdx === Number(active.id)); const ni = visible.findIndex((t: any) => t.originalIdx === Number(over.id)); if (oi >= 0 && ni >= 0) reorderTasks(project.key, oi, ni, visible) }}>
            <SortableContext items={visible.map((t: any) => t.originalIdx)} strategy={verticalListSortingStrategy}>
              {visible.map((t: any) => {
                const taskKey = `proj-${project.key}-${t.originalIdx}`
                const meta = taskMeta[taskKey]
                return <SortableTaskRow key={t.originalIdx} id={t.originalIdx} task={t.task} done={t.done}
                  onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)}
                  onOpen={() => openModal(taskKey, t.task)}
                  onStar={() => starToPrio(t.task, category)}
                  isStarred={isTaskStarred ? isTaskStarred(t.task) : false}
                  taskKey={taskKey} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta}
                  onDelete={() => hideTask?.(taskKey)} meta={meta} />
              })}
            </SortableContext>
          </DndContext>
          {(isExpanded ? customTasks : customTasks.slice(0, 1)).map((task: string, i: number) => (
            <div key={`c-${i}`} className="flex items-start gap-1 py-0.5 group">
              <div className="w-2.5 h-2.5 rounded-[2.5px] border border-slate-600 bg-white/5 flex-shrink-0 mt-[2px]" />
              <span className="text-[12.5px] leading-[1.35] text-slate-200 flex-1">{task}</span>
              <button onClick={() => onDeleteCustomTask(i)} className="icon-on-hover bg-transparent border-none cursor-pointer p-0"><IconTrash size={10} className="text-slate-500 hover:text-rose-400" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-1">
          <button onClick={onAddTask} className="flex items-center gap-1 text-slate-500 hover:text-[#818cf8] transition-colors"><IconPlus size={10} /><span className="text-[9px] font-semibold uppercase tracking-[0.08em]">Add task</span></button>
          {hiddenCount > 0 && <div className="flex items-center gap-1 cursor-pointer text-slate-500 hover:text-[#818cf8] transition-colors" onClick={() => toggleExpand(project.key)}><span className="text-[9px] font-semibold uppercase tracking-[0.10em]">{isExpanded ? 'Less' : `+${hiddenCount}`}</span><span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span></div>}
        </div>
      </div>
    </div>
  )
}

function SortableTaskRow({ id, task, done, onClick, onOpen, onStar, isStarred, taskKey, taskMeta, updateTaskMeta, onDelete, meta }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="py-0.5 cursor-pointer select-none group" onClick={onOpen}>
      <div className="flex items-start gap-1">
        <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={(e: any) => e.stopPropagation()}><IconGripVertical size={9} className="text-slate-600" /></span>
        <div onClick={(e: any) => { e.stopPropagation(); onClick() }} className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>{done && <span className="text-indigo-300 text-[6.5px] font-bold leading-none">✓</span>}</div>
        <span className={`text-[12.5px] leading-[1.35] break-words min-w-0 flex-1 ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task}</span>
      </div>
      {/* Actions + badges — one wrapping line */}
      <div className="flex items-center gap-1 ml-[22px] mt-0.5 flex-wrap" onClick={(e: any) => e.stopPropagation()}>
        <TaskActions taskKey={taskKey} taskLabel={task} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
        <MetaBadges meta={meta} />
        <button className="bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onStar}>
          <IconStar size={11} className={isStarred ? 'fill-yellow-500 text-yellow-500' : 'icon-on-hover text-slate-500 hover:text-amber-400'} style={isStarred ? { filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' } : {}} />
        </button>
        {onDelete && <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onDelete}><IconTrash size={10} className="text-slate-500 hover:text-rose-400" /></button>}
      </div>
    </div>
  )
}
