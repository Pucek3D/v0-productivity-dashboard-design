'use client'
import { useState, useRef, useEffect } from 'react'
import { LT_GOALS, statusStyle, Project } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconStar, IconGripVertical, IconPlus, IconTrash } from '@tabler/icons-react'
import { computeStatus, type TaskMeta } from '@/lib/task-meta'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const GOAL_COLORS = ['#10b981', '#f59e0b', '#06b6d4', '#a78bfa', '#f472b6', '#fb7185', '#818cf8', '#34d399']
function randomColor() { return GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)] }

/* ── Editable text ── */
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

interface LtGoalsCardProps {
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

export function LtGoalsCard({
  projectDone, toggleProjectTask, getProjectCompletion,
  taskMeta, updateTaskMeta, openModal, starToPrio,
  isTaskStarred, hideTask, hiddenTasks,
}: LtGoalsCardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [extraGoals, setExtraGoals] = useState<Project[]>([])
  const [deletedGoals, setDeletedGoals] = useState<Set<string>>(new Set())
  const [goalOrder, setGoalOrder] = useState<string[]>([])
  const [goalNames, setGoalNames] = useState<Record<string, string>>({})
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const allGoals = [...LT_GOALS, ...extraGoals].filter(g => !deletedGoals.has(g.key))
  const orderedGoals = (() => {
    if (goalOrder.length === 0) return allGoals
    const ordered: Project[] = []
    goalOrder.forEach(key => { const g = allGoals.find(p => p.key === key); if (g) ordered.push(g) })
    allGoals.forEach(g => { if (!goalOrder.includes(g.key)) ordered.push(g) })
    return ordered
  })()

  const addGoal = () => {
    setExtraGoals(prev => [...prev, {
      key: `ltg-${Date.now()}`, name: 'New Goal', color: randomColor(),
      status: 'planning', next: 'Define goal', tasks: [], doneTasks: [],
    }])
  }

  const deleteGoal = (key: string) => setDeletedGoals(prev => new Set([...prev, key]))
  const renameGoal = (key: string, name: string) => setGoalNames(prev => ({ ...prev, [key]: name }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const keys = orderedGoals.map(g => g.key)
    const oi = keys.indexOf(String(active.id))
    const ni = keys.indexOf(String(over.id))
    if (oi >= 0 && ni >= 0) setGoalOrder(arrayMove(keys, oi, ni))
  }

  return (
    <div className="card-base halo-teal">
      <div className="section-header header-teal px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Long-Term Goals</span>
          <button onClick={addGoal} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
            <IconPlus size={13} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedGoals.map(g => g.key)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 gap-2.5">
              {orderedGoals.map(goal => (
                <SortableGoal key={goal.key} goal={goal} displayName={goalNames[goal.key] || goal.name}
                  projectDone={projectDone} toggleProjectTask={toggleProjectTask}
                  getProjectCompletion={getProjectCompletion}
                  isExpanded={!!expanded[goal.key]} toggleExpand={toggleExpand}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal}
                  starToPrio={starToPrio} isTaskStarred={isTaskStarred}
                  onDelete={() => deleteGoal(goal.key)}
                  onRename={(name) => renameGoal(goal.key, name)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

function SortableGoal(props: {
  goal: Project; displayName: string
  projectDone: Record<string, boolean>; toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number
  isExpanded: boolean; toggleExpand: (k: string) => void
  taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void
  isTaskStarred?: (text: string) => boolean
  onDelete: () => void; onRename: (name: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.goal.key })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <GoalTile {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function GoalTile({
  goal, displayName, projectDone, toggleProjectTask, getProjectCompletion,
  isExpanded, toggleExpand, taskMeta, updateTaskMeta, openModal, starToPrio,
  isTaskStarred, onDelete, onRename, dragHandleProps,
}: {
  goal: Project; displayName: string
  projectDone: Record<string, boolean>; toggleProjectTask: (k: string, t: 'task' | 'done', i: number) => void
  getProjectCompletion: (p: Project) => number
  isExpanded: boolean; toggleExpand: (k: string) => void
  taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio: (text: string, category: 'work' | 'home') => void
  isTaskStarred?: (text: string) => boolean
  onDelete: () => void; onRename: (name: string) => void
  dragHandleProps?: Record<string, any>
}) {
  const pct = getProjectCompletion(goal)
  const autoStatus = computeStatus(goal, projectDone, taskMeta, 'proj')
  const style = statusStyle(autoStatus, goal.color)

  const indexedTasks = goal.tasks.map((task, i) => ({
    task, originalIdx: i, done: !!projectDone[`${goal.key}-task-${i}`],
  }))
  const sorted = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))
  const visible = isExpanded ? sorted : sorted.slice(0, 3)
  const hiddenCount = sorted.length - 3 + goal.doneTasks.length
  const nextLabel = sorted.find(t => !t.done)?.task ?? goal.next

  return (
    <div className="tile-base relative">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${goal.color} 0%, ${goal.color}60 55%, transparent 100%)`, boxShadow: `0 0 8px ${goal.color}80` }} />
      <div className="p-2.5">
        <div className="flex items-start gap-1">
          {dragHandleProps && (
            <span {...dragHandleProps} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={e => e.stopPropagation()}>
              <IconGripVertical size={11} className="text-slate-600" />
            </span>
          )}
          <EditableText value={displayName} onChange={onRename}
            className="font-display text-[14px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight flex-1 min-w-0" />
          <button onClick={onDelete} className="icon-on-hover flex-shrink-0 bg-transparent border-none cursor-pointer p-0">
            <IconTrash size={12} className="text-slate-600 hover:text-rose-400" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-1 mb-1.5 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: style.text }} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em]" style={{ color: style.text }}>{autoStatus}</span>
          </span>
          <span className="font-display text-[18px] tabular leading-none" style={{ color: goal.color }}>{pct}%</span>
        </div>

        <div className="text-[10px] text-slate-500 mb-1 truncate font-medium">→ {nextLabel}</div>

        <div className="border-t border-white/5 pt-1 mt-1">
          {visible.map(t => (
            <div key={t.originalIdx} className="flex items-start gap-1 py-0.5 cursor-pointer select-none group" onClick={() => openModal(`proj-${goal.key}-${t.originalIdx}`, t.task)}>
              <div onClick={e => { e.stopPropagation(); toggleProjectTask(goal.key, 'task', t.originalIdx) }}
                className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${t.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>
                {t.done && <span className="text-indigo-300 text-[6.5px] font-bold leading-none">✓</span>}
              </div>
              <span className={`text-[12px] leading-[1.35] break-words min-w-0 flex-1 ${t.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{t.task}</span>
              <span className="inline-flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <TaskActions taskKey={`proj-${goal.key}-${t.originalIdx}`} taskLabel={t.task} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
                <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0" onClick={() => starToPrio(t.task, 'work')}>
                  <IconStar size={10} className={isTaskStarred?.(t.task) ? 'fill-yellow-500 text-yellow-500' : 'text-slate-500 hover:text-amber-400'} />
                </button>
              </span>
            </div>
          ))}
        </div>

        {hiddenCount > 0 && (
          <div className="flex items-center gap-1 mt-1 cursor-pointer text-slate-500 hover:text-[#14b8a6] transition-colors" onClick={() => toggleExpand(goal.key)}>
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em]">{isExpanded ? 'Less' : `+${hiddenCount} more`}</span>
            <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        )}
      </div>
    </div>
  )
}
