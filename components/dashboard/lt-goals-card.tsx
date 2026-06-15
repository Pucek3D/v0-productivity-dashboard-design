'use client'
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { LT_GOALS, statusStyle, Project } from '@/lib/data'
import { TaskActions } from './task-actions'
import { EditableLabel } from './editable-label'
import { IconStar, IconBookmark, IconGripVertical, IconPlus, IconTrash, IconChevronRight } from '@tabler/icons-react'
import { computeStatus, type TaskMeta } from '@/lib/task-meta'
import { SubtaskPreview } from './subtask-preview'
import { closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ClientDnd } from './client-dnd'
import { useMounted } from '@/lib/use-mounted'

const COLORS = ['#10b981', '#f59e0b', '#06b6d4', '#a78bfa', '#f472b6', '#fb7185', '#818cf8', '#34d399']

function MetaBadges({ meta }: { meta?: TaskMeta }) {
  if (!meta) return null; const b: React.ReactNode[] = []
  if (meta.priority) { const c = meta.priority === 'high' ? '#fb7185' : meta.priority === 'medium' ? '#fbbf24' : '#94a3b8'; b.push(<span key="p" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{meta.priority.slice(0, 3)}</span>) }
  if (meta.recurring) b.push(<span key="r" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{String(meta.recurring).slice(0, 3)}</span>)
  if ((meta as any).schedule?.ongoing) b.push(<span key="on" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>ongoing</span>)
  if ((meta as any).schedule?.weeks?.length) b.push(<span key="w" style={{ fontSize: 8, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>W{(meta as any).schedule.weeks[0]}-W{(meta as any).schedule.weeks[(meta as any).schedule.weeks.length - 1]}</span>)
  if (meta.timeEstimate) b.push(<span key="t" style={{ fontSize: 8, fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{meta.timeEstimate >= 60 ? `${meta.timeEstimate / 60}h` : `${meta.timeEstimate}m`}</span>)
  return b.length ? <span className="inline-flex items-center gap-0.5 flex-wrap">{b}</span> : null
}

function EditableText({ value, onChange, className, style }: any) {
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(value); const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing]); useEffect(() => { setDraft(value) }, [value])
  if (editing) return <input ref={ref} value={draft} onChange={(e: any) => setDraft(e.target.value)} onBlur={() => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }} onKeyDown={(e: any) => { if (e.key === 'Enter') { setEditing(false); if (draft.trim()) onChange(draft.trim()) } if (e.key === 'Escape') { setEditing(false); setDraft(value) } }} className={className} style={{ ...style, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '0 4px', outline: 'none', width: '100%' }} onClick={(e: any) => e.stopPropagation()} />
  return <span className={className} style={{ ...style, cursor: 'text' }} onDoubleClick={(e: any) => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

interface Props {
  projectDone: Record<string, boolean>; toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number; taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void; openModal: (k: string, l: string) => void
  starToPrio: (t: string, c: 'work' | 'home') => void; isTaskStarred?: (t: string) => boolean
  bookmarkToOther?: (t: string, c: 'work' | 'home') => void; isTaskBookmarked?: (t: string) => boolean
  starSubtaskToPrio?: (t: string, d?: Partial<TaskMeta>) => void; bookmarkSubtaskToOther?: (t: string, d?: Partial<TaskMeta>) => void
  hideTask?: (k: string) => void; hiddenTasks?: Set<string>
  nameOverrides?: Record<string, string>; onRename?: (key: string, newName: string) => void
}

export type LtGoalsHandle = { addTask: (goalKey: string, text: string) => void }

export const LtGoalsCard = forwardRef<LtGoalsHandle, Props>(function LtGoalsCard({ projectDone, toggleProjectTask, getProjectCompletion, taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, starSubtaskToPrio, bookmarkSubtaskToOther, nameOverrides, onRename }: Props, ref) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [extraGoals, setExtraGoals] = useState<Project[]>([])
  const [deletedGoals, setDeletedGoals] = useState<Set<string>>(new Set())
  const [goalOrder, setGoalOrder] = useState<string[]>([])
  const [goalNames, setGoalNames] = useState<Record<string, string>>({})
  const [taskOrders, setTaskOrders] = useState<Record<string, number[]>>({})
  // Tasks appended to a goal from the calendar's "Create task" flow. They are
  // merged into each goal's `tasks` array at render time, so they reuse the
  // existing index-based toggle / rename / star / modal machinery.
  const [extraGoalTasks, setExtraGoalTasks] = useState<Record<string, string[]>>({})

  useImperativeHandle(ref, () => ({
    addTask: (goalKey: string, text: string) => {
      const t = text.trim(); if (!t) return
      setExtraGoalTasks(p => ({ ...p, [goalKey]: [...(p[goalKey] || []), t] }))
    },
  }))

  // In-card "+ Task" — mirrors Active projects; appends a new task to the goal.
  const addGoalTask = (goalKey: string) => setExtraGoalTasks(p => ({ ...p, [goalKey]: [...(p[goalKey] || []), 'New task'] }))

  const allGoals = [...LT_GOALS, ...extraGoals]
    .filter(g => !deletedGoals.has(g.key))
    .map(g => extraGoalTasks[g.key]?.length ? { ...g, tasks: [...g.tasks, ...extraGoalTasks[g.key]] } : g)
  const orderedGoals = (() => { if (!goalOrder.length) return allGoals; const o: Project[] = []; goalOrder.forEach(k => { const g = allGoals.find(p => p.key === k); if (g) o.push(g) }); allGoals.forEach(g => { if (!goalOrder.includes(g.key)) o.push(g) }); return o })()

  const handleGoalDragEnd = (e: DragEndEvent) => { const { active, over } = e; if (!over || active.id === over.id) return; const keys = orderedGoals.map(g => g.key); const oi = keys.indexOf(String(active.id)); const ni = keys.indexOf(String(over.id)); if (oi >= 0 && ni >= 0) setGoalOrder(arrayMove(keys, oi, ni)) }

  return (
    <div className="card-base halo-teal">
      <div className="section-header header-teal px-4 py-3"><div className="flex items-center justify-between"><span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Long-Term Goals</span><button onClick={() => setExtraGoals(p => [...p, { key: `ltg-${Date.now()}`, name: 'New Goal', color: COLORS[Math.floor(Math.random() * COLORS.length)], status: 'planning', next: '', tasks: [], doneTasks: [] }])} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5"><IconPlus size={13} /></button></div></div>
      <div className="p-3">
        <ClientDnd sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGoalDragEnd}>
          <SortableContext items={orderedGoals.map(g => g.key)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 gap-2.5">
              {orderedGoals.map(goal => <SortableGoal key={goal.key} goal={goal} displayName={goalNames[goal.key] || goal.name}
                projectDone={projectDone} toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion}
                isExpanded={!!expanded[goal.key]} toggleExpand={k => setExpanded(p => ({ ...p, [k]: !p[k] }))}
                taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal}
                starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther}
                onDelete={() => setDeletedGoals(p => new Set([...p, goal.key]))}
                onRename={(n: string) => setGoalNames(p => ({ ...p, [goal.key]: n }))}
                onAddTask={() => addGoalTask(goal.key)}
                taskOrders={taskOrders}
                nameOverrides={nameOverrides} onRenameTask={onRename}
                reorderTasks={(gk: string, oi: number, ni: number, tl: any[]) => setTaskOrders(p => ({ ...p, [gk]: arrayMove(tl.map((t: any) => t.originalIdx), oi, ni) }))} />)}
            </div>
          </SortableContext>
        </ClientDnd>
      </div>
    </div>
  )
})

function SortableGoal(props: any) {
  const mounted = useMounted()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.goal.key })
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}><GoalTile {...props} dragHandleProps={mounted ? { ...attributes, ...listeners } : {}} /></div>
}

function GoalTile({ goal, displayName, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand, taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, starSubtaskToPrio, bookmarkSubtaskToOther, onDelete, onRename, onAddTask, dragHandleProps, taskOrders, reorderTasks, nameOverrides, onRenameTask }: any) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const pct = getProjectCompletion(goal)
  const autoStatus = computeStatus(goal, projectDone, taskMeta, 'proj')
  const style = statusStyle(autoStatus, goal.color)

  const indexedTasks = goal.tasks.map((task: string, i: number) => ({ task, originalIdx: i, done: !!projectDone[`${goal.key}-task-${i}`] }))
  const customOrder = taskOrders[goal.key]
  let ordered = customOrder ? customOrder.map((idx: number) => indexedTasks.find((t: any) => t.originalIdx === idx)).filter(Boolean) : [...indexedTasks].sort((a: any, b: any) => Number(a.done) - Number(b.done))
  if (customOrder) indexedTasks.forEach((t: any) => { if (!customOrder.includes(t.originalIdx)) ordered.push(t) })
  const visible = isExpanded ? ordered : ordered.slice(0, 3)
  const hiddenCount = ordered.length - 3 + goal.doneTasks.length

  const handleTaskDragEnd = (e: DragEndEvent) => {
    const { active, over } = e; if (!over || active.id === over.id) return
    const oi = visible.findIndex((t: any) => t.originalIdx === Number(active.id))
    const ni = visible.findIndex((t: any) => t.originalIdx === Number(over.id))
    if (oi >= 0 && ni >= 0) reorderTasks(goal.key, oi, ni, visible)
  }

  return (
    <div className="tile-base relative">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${goal.color} 0%, ${goal.color}60 55%, transparent 100%)`, boxShadow: `0 0 8px ${goal.color}80` }} />
      <div className="p-2.5">
        <div className="flex items-center gap-1 mb-1">
          {dragHandleProps && <span {...dragHandleProps} className="flex-shrink-0 cursor-grab opacity-40 hover:opacity-100"><IconGripVertical size={11} className="text-slate-600" /></span>}
          <EditableText value={displayName} onChange={onRename} className="font-display text-[14px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight flex-1 min-w-0" />
          <button onClick={onDelete} className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/5"><IconTrash size={13} /></button>
        </div>
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="flex items-center gap-1.5"><span className="w-[5px] h-[5px] rounded-full" style={{ background: style.text }} /><span className="text-[9px] font-semibold uppercase tracking-[0.10em]" style={{ color: style.text }}>{autoStatus}</span></span>
          <span className="font-display text-[18px] tabular leading-none" style={{ color: goal.color }}>{pct}%</span>
        </div>
        <div className="border-t border-white/5 pt-1 mt-1">
          <ClientDnd sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
            <SortableContext items={visible.map((t: any) => t.originalIdx)} strategy={verticalListSortingStrategy}>
              {visible.map((t: any) => {
                const tk = `proj-${goal.key}-${t.originalIdx}`; const meta = taskMeta[tk]
                const label = nameOverrides?.[tk] ?? (meta as any)?.label ?? t.task
                return <SortableGoalTask key={t.originalIdx} id={t.originalIdx} task={label} done={t.done} tk={tk} meta={meta}
                  onToggle={() => toggleProjectTask(goal.key, 'task', t.originalIdx)} openModal={openModal}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} onRename={(n: string) => onRenameTask?.(tk, n)} />
              })}
            </SortableContext>
          </ClientDnd>
        </div>
        <div className="flex items-center justify-between mt-1">
          {hiddenCount > 0 ? <div className="flex items-center gap-1 cursor-pointer text-slate-500 hover:text-[#14b8a6] transition-colors" onClick={() => toggleExpand(goal.key)}><span className="text-[9px] font-semibold uppercase tracking-[0.10em]">{isExpanded ? 'Less' : `+${hiddenCount} more`}</span><span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span></div> : <span />}
          <button onClick={onAddTask} className="flex items-center gap-1 text-slate-500 hover:text-[#14b8a6] transition-colors"><IconPlus size={10} /><span className="text-[9px] font-semibold uppercase tracking-[0.08em]">Task</span></button>
        </div>
      </div>
    </div>
  )
}

function SortableGoalTask({ id, task, done, tk, meta, onToggle, openModal, taskMeta, updateTaskMeta, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, starSubtaskToPrio, bookmarkSubtaskToOther, onRename }: any) {
  const mounted = useMounted()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const dndProps = mounted ? { ...attributes, ...listeners } : {}
  const subs: any[] = meta?.subtasks || []
  const hasSubs = subs.length > 0
  const doneSubs = subs.filter(s => s.done).length
  // Show the full subtask branch by default so the tree is visible; collapsible per task.
  const [subOpen, setSubOpen] = useState(true)
  const toggleSubDone = (sid: string) => updateTaskMeta(tk, { subtasks: subs.map(s => s.id === sid ? { ...s, done: !s.done } : s) })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <div {...dndProps} className="flex items-center gap-1.5 py-0.5 cursor-grab active:cursor-grabbing select-none group" onClick={() => openModal(tk, task)}>
        <div onPointerDown={(e: any) => e.stopPropagation()} onClick={(e: any) => { e.stopPropagation(); onToggle() }} className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center cursor-pointer ${done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>{done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}</div>
        <EditableLabel value={task} onRename={(n: string) => onRename?.(n)} className={`text-[12px] leading-[1.35] break-words min-w-0 flex-1 ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`} />
        {hasSubs && (
          <button onPointerDown={(e: any) => e.stopPropagation()} onClick={(e: any) => { e.stopPropagation(); setSubOpen(o => !o) }} className="flex items-center gap-0.5 flex-shrink-0 cursor-pointer text-slate-500 hover:text-[#14b8a6]" title={subOpen ? 'Collapse subtasks' : 'Expand subtasks'}>
            <IconChevronRight size={10} className={`transition-transform ${subOpen ? 'rotate-90' : ''}`} />
            <span className="text-[8px] font-bold tabular leading-none">{doneSubs}/{subs.length}</span>
          </button>
        )}
        <span className="inline-flex items-center gap-0.5 flex-shrink-0" onClick={(e: any) => e.stopPropagation()}>
          <TaskActions taskKey={tk} taskLabel={task} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
          <button className={`bg-transparent border-none cursor-pointer p-0 ${isTaskStarred?.(task) ? 'order-last' : ''}`} onClick={() => starToPrio(task, 'work')}><IconStar size={11} className={isTaskStarred?.(task) ? 'fill-yellow-500 text-yellow-500' : 'icon-on-hover text-slate-500 hover:text-amber-400'} /></button>
          {bookmarkToOther && <button className={`bg-transparent border-none cursor-pointer p-0 ${isTaskBookmarked?.(task) ? 'order-last' : ''}`} onClick={() => bookmarkToOther(task, 'work')} title={isTaskBookmarked?.(task) ? 'Added to Other to-dos' : 'Add to Other to-dos'}><IconBookmark size={11} className={isTaskBookmarked?.(task) ? 'fill-indigo-400 text-indigo-400' : 'icon-on-hover text-slate-500 hover:text-indigo-300'} /></button>}
        </span>
      </div>
      {meta && <div className="pl-[28px] mb-0.5"><MetaBadges meta={meta} /></div>}
      {hasSubs && subOpen && (
        <div className="ml-[7px] pl-[10px] border-l border-white/10">
          {subs.map(sub => (
            <SubtaskPreview key={sub.id} sub={sub} pl="pl-0" onToggleDone={() => toggleSubDone(sub.id)} isTaskStarred={isTaskStarred} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} />
          ))}
        </div>
      )}
    </div>
  )
}
