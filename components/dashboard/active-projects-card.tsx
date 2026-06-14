'use client'
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { PROJECTS, statusStyle, Project } from '@/lib/data'
import { TaskActions } from './task-actions'
import { EditableLabel } from './editable-label'
import { IconStar, IconBookmark, IconGripVertical, IconPlus, IconTrash, IconChartBar } from '@tabler/icons-react'
import { computeStatus, type TaskMeta } from '@/lib/task-meta'
import { SubtaskPreview } from './subtask-preview'
import { closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ClientDnd } from './client-dnd'
import { useMounted } from '@/lib/use-mounted'

const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb7185', '#38bdf8', '#a78bfa', '#f97316', '#14b8a6', '#e879f9']

function MetaBadges({ meta }: { meta?: TaskMeta }) {
  if (!meta) return null; const b: React.ReactNode[] = []
  if (meta.priority) { const c = meta.priority === 'high' ? '#fb7185' : meta.priority === 'medium' ? '#fbbf24' : '#94a3b8'; b.push(<span key="p" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{meta.priority.slice(0, 3)}</span>) }
  if (meta.recurring) b.push(<span key="r" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{String(meta.recurring).slice(0, 3)}</span>)
  if (meta.timeEstimate) b.push(<span key="t" style={{ fontSize: 8, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{meta.timeEstimate >= 60 ? `${meta.timeEstimate / 60}h` : `${meta.timeEstimate}m`}</span>)
  return b.length ? <>{b}</> : null
}

function EditableText({ value, onChange, className, style }: any) {
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(value); const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing]); useEffect(() => { setDraft(value) }, [value])
  if (editing) return <input ref={ref} value={draft} onChange={(e: any) => setDraft(e.target.value)} onBlur={() => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }} onKeyDown={(e: any) => { if (e.key === 'Enter') { setEditing(false); if (draft.trim()) onChange(draft.trim()) } if (e.key === 'Escape') { setEditing(false); setDraft(value) } }} className={className} style={{ ...style, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '0 4px', outline: 'none', width: '100%' }} onClick={(e: any) => e.stopPropagation()} />
  return <span className={className} style={{ ...style, cursor: 'text' }} onDoubleClick={(e: any) => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

/* Custom task type — has stable ID for drag */
type CustomTask = { id: string; text: string; done: boolean }

interface Props {
  projectDone: Record<string, boolean>; toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number; taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void; openModal: (k: string, l: string) => void
  starToPrio: (t: string, c: 'work' | 'home') => void; isTaskStarred?: (t: string) => boolean
  bookmarkToOther?: (t: string, c: 'work' | 'home') => void; isTaskBookmarked?: (t: string) => boolean
  starSubtaskToPrio?: (t: string, d?: Partial<TaskMeta>) => void; bookmarkSubtaskToOther?: (t: string, d?: Partial<TaskMeta>) => void
  hideTask?: (k: string) => void; hiddenTasks?: Set<string>
  onToggleGantt?: (pk: string) => void; activeGanttProjects?: Set<string>
  nameOverrides?: Record<string, string>; onRename?: (key: string, newName: string) => void
  onRemoveLinked?: (text: string) => void
}

export type ActiveProjectsHandle = { addTask: (projectKey: string, text: string) => void }

export const ActiveProjectsCard = forwardRef<ActiveProjectsHandle, Props>(function ActiveProjectsCard({ projectDone, toggleProjectTask, getProjectCompletion, taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, starSubtaskToPrio, bookmarkSubtaskToOther, hideTask, hiddenTasks, onToggleGantt, activeGanttProjects, nameOverrides, onRename, onRemoveLinked }: Props, ref) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [taskOrders, setTaskOrders] = useState<Record<string, number[]>>({})
  const [extraProjects, setExtraProjects] = useState<Project[]>([])
  const [projectOrder, setProjectOrder] = useState<string[]>([])
  const [deletedProjects, setDeletedProjects] = useState<Set<string>>(new Set())
  const [customTasks, setCustomTasks] = useState<Record<string, CustomTask[]>>({})
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})

  const all = [...PROJECTS, ...extraProjects].filter(p => !deletedProjects.has(p.key))
  const ordered = (() => { if (!projectOrder.length) return all; const o: Project[] = []; projectOrder.forEach(k => { const p = all.find(x => x.key === k); if (p) o.push(p) }); all.forEach(p => { if (!projectOrder.includes(p.key)) o.push(p) }); return o })()
  const workProjects = ordered.filter(p => (p.category ?? 'work') === 'work')
  const homeProjects = ordered.filter(p => p.category === 'home')

  const handleDrag = (e: DragEndEvent) => { const { active, over } = e; if (!over || active.id === over.id) return; const keys = ordered.map(p => p.key); const oi = keys.indexOf(String(active.id)); const ni = keys.indexOf(String(over.id)); if (oi >= 0 && ni >= 0) setProjectOrder(arrayMove(keys, oi, ni)) }

  const addProject = (category: 'work' | 'home') => {
    setExtraProjects(p => [...p, { key: `c-${Date.now()}`, name: 'New Project', color: COLORS[Math.floor(Math.random() * COLORS.length)], status: 'planning', next: '', tasks: [], doneTasks: [], category }])
  }

  const addCustomTask = (projectKey: string, text = 'New task') => {
    setCustomTasks(p => ({ ...p, [projectKey]: [...(p[projectKey] || []), { id: `ct-${Date.now()}`, text, done: false }] }))
  }

  // Imperative handle: lets the calendar's "Create task" flow append a task to a
  // chosen project. Re-uses the same custom-task store as the in-card + button.
  useImperativeHandle(ref, () => ({ addTask: (projectKey: string, text: string) => addCustomTask(projectKey, text) }))

  const deleteCustomTask = (projectKey: string, taskId: string) => {
    const ct = (customTasks[projectKey] || []).find(t => t.id === taskId)
    if (ct) { const ctk = `proj-${projectKey}-custom-${ct.id}`; onRemoveLinked?.(nameOverrides?.[ctk] ?? ct.text) }
    setCustomTasks(p => ({ ...p, [projectKey]: (p[projectKey] || []).filter(t => t.id !== taskId) }))
  }

  const toggleCustomTask = (projectKey: string, taskId: string) => {
    setCustomTasks(p => ({ ...p, [projectKey]: (p[projectKey] || []).map(t => t.id === taskId ? { ...t, done: !t.done } : t) }))
  }

  const renameCustomTask = (projectKey: string, taskId: string, text: string) => {
    setCustomTasks(p => ({ ...p, [projectKey]: (p[projectKey] || []).map(t => t.id === taskId ? { ...t, text } : t) }))
    // Propagate to any synced surface (e.g. a starred Top Prio copy)
    onRename?.(`proj-${projectKey}-custom-${taskId}`, text)
  }

  const reorderCustomTasks = (projectKey: string, e: DragEndEvent) => {
    const { active, over } = e; if (!over || active.id === over.id) return
    setCustomTasks(p => {
      const tasks = [...(p[projectKey] || [])]
      const oi = tasks.findIndex(t => t.id === active.id); const ni = tasks.findIndex(t => t.id === over.id)
      return oi >= 0 && ni >= 0 ? { ...p, [projectKey]: arrayMove(tasks, oi, ni) } : p
    })
  }

  const renderSection = (projects: Project[], label: string, color: string, category: 'work' | 'home') => (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase flex items-center gap-1.5" style={{ color }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />{label}<span className="text-slate-500 font-normal ml-0.5">({projects.length})</span>
        </div>
        <button onClick={() => addProject(category)} className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:text-white/70 flex items-center gap-1 transition-colors"><IconPlus size={10} />Project</button>
      </div>
      <ClientDnd sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDrag}>
        <SortableContext items={projects.map(p => p.key)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-2.5">
            {projects.map(project => <SortableProjectWrap key={project.key} project={project} projectDone={projectDone} toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion} isExpanded={!!expanded[project.key]} toggleExpand={k => setExpanded(p => ({ ...p, [k]: !p[k] }))} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} hideTask={hideTask} hiddenTasks={hiddenTasks} taskOrders={taskOrders} reorderTasks={(pk: string, o: number, n: number, tl: any[]) => { setTaskOrders(p => ({ ...p, [pk]: arrayMove(tl.map((t: any) => t.originalIdx), o, n) })) }} onDelete={() => { project.tasks.forEach((t, i) => onRemoveLinked?.(nameOverrides?.[`proj-${project.key}-${i}`] ?? t)); (customTasks[project.key] || []).forEach(ct => onRemoveLinked?.(nameOverrides?.[`proj-${project.key}-custom-${ct.id}`] ?? ct.text)); setDeletedProjects(p => new Set([...p, project.key])) }} onRename={(n: string) => setProjectNames(p => ({ ...p, [project.key]: n }))} displayName={projectNames[project.key] || project.name} customTasks={customTasks[project.key] || []} onAddCustomTask={() => addCustomTask(project.key)} onDeleteCustomTask={(tid: string) => deleteCustomTask(project.key, tid)} onToggleCustomTask={(tid: string) => toggleCustomTask(project.key, tid)} onReorderCustomTasks={(e: DragEndEvent) => reorderCustomTasks(project.key, e)} onRenameCustomTask={(tid: string, n: string) => renameCustomTask(project.key, tid, n)} onToggleGantt={onToggleGantt} isGanttActive={activeGanttProjects?.has(project.key) || false} nameOverrides={nameOverrides} onRenameTask={onRename} />)}
          </div>
        </SortableContext>
      </ClientDnd>
      {projects.length === 0 && <div className="text-[10px] text-slate-600 text-center py-4 italic border border-dashed border-white/5 rounded-lg">No {label.toLowerCase()} projects yet. Click + Project to add one.</div>}
    </>
  )

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3"><div className="flex items-center justify-between"><span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Active projects</span></div></div>
      <div className="p-3">
        {renderSection(workProjects, 'Work', '#818cf8', 'work')}
        {/* Home — ALWAYS visible */}
        <div className="mt-4">{renderSection(homeProjects, 'Home', '#2dd4bf', 'home')}</div>
      </div>
    </div>
  )
})

function SortableProjectWrap(props: any) {
  const mounted = useMounted()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.project.key })
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}><ProjectTile {...props} dragHandleProps={mounted ? { ...attributes, ...listeners } : {}} /></div>
}

function ProjectTile({ project, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand, taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, starSubtaskToPrio, bookmarkSubtaskToOther, hideTask, hiddenTasks, taskOrders, reorderTasks, onDelete, onRename, displayName, customTasks, onAddCustomTask, onDeleteCustomTask, onToggleCustomTask, onReorderCustomTasks, dragHandleProps, onToggleGantt, isGanttActive, nameOverrides, onRenameTask, onRenameCustomTask }: any) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const pct = getProjectCompletion(project)
  const autoStatus = computeStatus(project, projectDone, taskMeta, 'proj')
  const style = statusStyle(autoStatus, project.color)
  const category = project.category ?? 'work'

  const indexedTasks = project.tasks.map((task: string, i: number) => ({ task, originalIdx: i, done: !!projectDone[`${project.key}-task-${i}`] }))
  const customOrder = taskOrders[project.key]
  let orderedTasks = customOrder ? customOrder.map((idx: number) => indexedTasks.find((t: any) => t.originalIdx === idx)).filter(Boolean) : [...indexedTasks].sort((a: any, b: any) => Number(a.done) - Number(b.done))
  if (customOrder) indexedTasks.forEach((t: any) => { if (!customOrder.includes(t.originalIdx)) orderedTasks.push(t) })
  const filtered = hiddenTasks ? orderedTasks.filter((t: any) => !hiddenTasks.has(`proj-${project.key}-${t.originalIdx}`)) : orderedTasks
  const visible = isExpanded ? filtered : filtered.slice(0, 3)
  const visibleCustom: CustomTask[] = isExpanded ? customTasks : customTasks.slice(0, Math.max(0, 3 - visible.length))
  const hiddenCount = Math.max(0, filtered.length - 3) + Math.max(0, customTasks.length - visibleCustom.length) + project.doneTasks.length

  return (
    <div className="tile-base relative">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${project.color} 0%, ${project.color}60 55%, transparent 100%)`, boxShadow: `0 0 8px ${project.color}80` }} />
      <div className="p-2.5">
        <div className="flex items-center gap-1 mb-1">
          {dragHandleProps && <span {...dragHandleProps} className="flex-shrink-0 cursor-grab opacity-40 hover:opacity-100" onClick={(e: any) => e.stopPropagation()}><IconGripVertical size={12} className="text-slate-500" /></span>}
          <EditableText value={displayName} onChange={onRename} className="font-display text-[14px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight flex-1 min-w-0" />
          {onToggleGantt && <button onClick={() => onToggleGantt(project.key)} className={`flex-shrink-0 p-1 rounded transition-colors ${isGanttActive ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'}`}><IconChartBar size={13} /></button>}
          <button onClick={onDelete} className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-colors"><IconTrash size={13} /></button>
        </div>
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="flex items-center gap-1.5"><span className="w-[5px] h-[5px] rounded-full" style={{ background: style.text, boxShadow: `0 0 6px ${style.text}` }} /><span className="text-[9px] font-semibold uppercase tracking-[0.10em] truncate" style={{ color: style.text }}>{autoStatus}</span></span>
          <span className="font-display text-[20px] tabular leading-none flex-shrink-0" style={{ color: project.color }}>{pct}%</span>
        </div>
        <div className="border-t border-white/5 pt-1 mt-1">
          {/* Regular tasks — sortable */}
          <ClientDnd sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => { const { active, over } = e; if (!over || active.id === over.id) return; const oi = visible.findIndex((t: any) => t.originalIdx === Number(active.id)); const ni = visible.findIndex((t: any) => t.originalIdx === Number(over.id)); if (oi >= 0 && ni >= 0) reorderTasks(project.key, oi, ni, visible) }}>
            <SortableContext items={visible.map((t: any) => t.originalIdx)} strategy={verticalListSortingStrategy}>
              {visible.map((t: any) => {
                const tk = `proj-${project.key}-${t.originalIdx}`; const meta = taskMeta[tk]; const firstSub = meta?.subtasks?.find((s: any) => !s.done)
                const label = nameOverrides?.[tk] ?? (meta as any)?.label ?? t.task
                return <div key={t.originalIdx}>
                  <TaskRow id={t.originalIdx} task={label} done={t.done} onClick={() => toggleProjectTask(project.key, 'task', t.originalIdx)} onOpen={() => openModal(tk, label)} onStar={() => starToPrio(label, category)} isStarred={isTaskStarred ? isTaskStarred(label) : false} onBookmark={bookmarkToOther ? () => bookmarkToOther(label, category) : undefined} isBookmarked={isTaskBookmarked ? isTaskBookmarked(label) : false} taskKey={tk} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} onDelete={() => hideTask?.(tk)} meta={meta} onRename={(n: string) => onRenameTask?.(tk, n)} />
                  {firstSub && <SubtaskPreview sub={firstSub} pl="pl-[24px]" onToggleDone={() => { const subs = (meta?.subtasks || []).map((s: any) => s.id === firstSub.id ? { ...s, done: true } : s); updateTaskMeta(tk, { subtasks: subs }) }} isTaskStarred={isTaskStarred} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} />}
                </div>
              })}
            </SortableContext>
          </ClientDnd>

          {/* Custom tasks — ALSO sortable with stable IDs */}
          {visibleCustom.length > 0 && (
            <ClientDnd sensors={sensors} collisionDetection={closestCenter} onDragEnd={onReorderCustomTasks}>
              <SortableContext items={visibleCustom.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {visibleCustom.map(ct => {
                  const ctk = `proj-${project.key}-custom-${ct.id}`; const cmeta = taskMeta[ctk]; const cSub = cmeta?.subtasks?.find((s: any) => !s.done)
                  // Resolve display name through nameOverrides so a rename made
                  // from the modal title (which only writes overrides) sticks.
                  const ctText = nameOverrides?.[ctk] ?? ct.text
                  return <div key={ct.id}>
                    <SortableCustomTask ct={ct} ctText={ctText} ctk={ctk} cmeta={cmeta} category={category}
                      onToggle={() => onToggleCustomTask(ct.id)} onDelete={() => onDeleteCustomTask(ct.id)}
                      openModal={openModal} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta}
                      starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} onRename={(n: string) => onRenameCustomTask?.(ct.id, n)} />
                    {cSub && <SubtaskPreview sub={cSub} pl="pl-[24px]" onToggleDone={() => { const subs = (cmeta?.subtasks || []).map((s: any) => s.id === cSub.id ? { ...s, done: true } : s); updateTaskMeta(ctk, { subtasks: subs }) }} isTaskStarred={isTaskStarred} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} />}
                  </div>
                })}
              </SortableContext>
            </ClientDnd>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <button onClick={onAddCustomTask} className="flex items-center gap-1 text-slate-500 hover:text-[#818cf8] transition-colors"><IconPlus size={10} /><span className="text-[9px] font-semibold uppercase tracking-[0.08em]">Task</span></button>
          {hiddenCount > 0 && <div className="flex items-center gap-1 cursor-pointer text-slate-500 hover:text-[#818cf8] transition-colors" onClick={() => toggleExpand(project.key)}><span className="text-[9px] font-semibold uppercase tracking-[0.10em]">{isExpanded ? 'Less' : `+${hiddenCount}`}</span><span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span></div>}
        </div>
      </div>
    </div>
  )
}

/* Sortable custom task */
function SortableCustomTask({ ct, ctText, ctk, cmeta, category, onToggle, onDelete, openModal, taskMeta, updateTaskMeta, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, onRename }: any) {
  const mounted = useMounted()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ct.id })
  const dndProps = mounted ? { ...attributes, ...listeners } : {}
  const label = ctText ?? ct.text
  return (
    <div ref={setNodeRef} {...dndProps} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="py-0.5 cursor-grab active:cursor-grabbing select-none group" onClick={() => openModal(ctk, label)}>
      <div className="flex items-center gap-1.5">
        <div onClick={(e: any) => { e.stopPropagation(); onToggle() }} className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center ${ct.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>{ct.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}</div>
        <EditableLabel value={label} onRename={(n: string) => onRename?.(n)} className={`text-[12.5px] leading-[1.35] flex-1 min-w-0 truncate ${ct.done ? 'text-slate-500 line-through' : 'text-slate-200'}`} />
        <span className="inline-flex items-center gap-0.5 flex-shrink-0" onClick={(e: any) => e.stopPropagation()}>
          <TaskActions taskKey={ctk} taskLabel={label} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
          <button onClick={() => starToPrio(label, category)} className={`bg-transparent border-none cursor-pointer p-0 leading-none ${isTaskStarred?.(label) ? 'order-last' : ''}`}><IconStar size={11} className={isTaskStarred?.(label) ? 'fill-yellow-500 text-yellow-500' : 'icon-on-hover text-slate-500 hover:text-amber-400'} /></button>
          {bookmarkToOther && <button onClick={() => bookmarkToOther(label, category)} className={`bg-transparent border-none cursor-pointer p-0 leading-none ${isTaskBookmarked?.(label) ? 'order-last' : ''}`} title={isTaskBookmarked?.(label) ? 'Added to Other to-dos' : 'Add to Other to-dos'}><IconBookmark size={11} className={isTaskBookmarked?.(label) ? 'fill-indigo-400 text-indigo-400' : 'icon-on-hover text-slate-500 hover:text-indigo-300'} /></button>}
          <button onClick={(e: any) => { e.stopPropagation(); onDelete() }} className="icon-on-hover bg-transparent border-none cursor-pointer p-0"><IconTrash size={10} className="text-slate-500 hover:text-rose-400" /></button>
        </span>
      </div>
      {cmeta && <div className="pl-[28px] mt-0.5 mb-0.5"><MetaBadges meta={cmeta} /></div>}
    </div>
  )
}

/* Regular task row */
function TaskRow({ id, task, done, onClick, onOpen, onStar, isStarred, onBookmark, isBookmarked, taskKey, taskMeta, updateTaskMeta, onDelete, meta, onRename }: any) {
  const mounted = useMounted()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const dndProps = mounted ? { ...attributes, ...listeners } : {}
  return (
    <div ref={setNodeRef} {...dndProps} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} className="py-0.5 cursor-grab active:cursor-grabbing select-none group" onClick={onOpen}>
      <div className="flex items-center gap-1.5">
        <div onClick={(e: any) => { e.stopPropagation(); onClick() }} className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center ${done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>{done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}</div>
        <EditableLabel value={task} onRename={(n: string) => onRename?.(n)} className={`text-[12.5px] leading-[1.35] break-words min-w-0 flex-1 ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`} />
        <span className="inline-flex items-center gap-0.5 flex-shrink-0" onClick={(e: any) => e.stopPropagation()}>
          <TaskActions taskKey={taskKey} taskLabel={task} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
          <button className={`bg-transparent border-none cursor-pointer p-0 leading-none ${isStarred ? 'order-last' : ''}`} onClick={(e: any) => { e.stopPropagation(); onStar() }}><IconStar size={12} className={isStarred ? 'fill-yellow-500 text-yellow-500' : 'icon-on-hover text-slate-500 hover:text-amber-400'} /></button>
          {onBookmark && <button className={`bg-transparent border-none cursor-pointer p-0 leading-none ${isBookmarked ? 'order-last' : ''}`} onClick={(e: any) => { e.stopPropagation(); onBookmark() }} title={isBookmarked ? 'Added to Other to-dos' : 'Add to Other to-dos'}><IconBookmark size={12} className={isBookmarked ? 'fill-indigo-400 text-indigo-400' : 'icon-on-hover text-slate-500 hover:text-indigo-300'} /></button>}
          {onDelete && <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onDelete}><IconTrash size={10} className="text-slate-500 hover:text-rose-400" /></button>}
        </span>
      </div>
      {meta && <div className="pl-[28px] mt-0.5"><MetaBadges meta={meta} /></div>}
    </div>
  )
}
