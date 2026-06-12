'use client'
import { TOP_PRIO_TASKS } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconGripVertical, IconTrash, IconPlus, IconStar } from '@tabler/icons-react'
import type { TaskMeta } from '@/lib/task-meta'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  useDroppable, type DragEndEvent, DragOverlay, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'

/* ─── types ─── */
type PrioTask = { id: string; text: string; done: boolean; priority?: string }
type PrioSection = { section: string; color: string; tasks: PrioTask[] }

interface TopPrioCardProps {
  tasks: PrioSection[]
  setTasks: React.Dispatch<React.SetStateAction<PrioSection[]>>
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  onTaskToggle?: (text: string, done: boolean) => void
}

/* ─── badge helpers ─── */
function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority || priority === 'gray') return null
  const map: Record<string, { bg: string; text: string; border: string }> = {
    high: { bg: 'rgba(251,113,133,0.15)', text: '#fb7185', border: 'rgba(251,113,133,0.30)' },
    medium: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.30)' },
    yellow: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.30)' },
    low: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.30)' },
  }
  const s = map[priority] || map.low
  return (
    <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 3, padding: '0px 4px', lineHeight: '16px', whiteSpace: 'nowrap' }}>
      {priority === 'yellow' ? 'MED' : priority.slice(0, 4).toUpperCase()}
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
    <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 3, padding: '0px 4px', lineHeight: '16px', whiteSpace: 'nowrap' }}>
      {recurring.slice(0, 3).toUpperCase()}
    </span>
  )
}

/* ─── Quadrant labels ─── */
const QUADRANTS = [
  { key: 'Work', label: 'Work', color: '#818cf8', isOther: false },
  { key: 'Home', label: 'Home', color: '#a78bfa', isOther: false },
  { key: 'Other Work', label: 'Other', color: '#818cf8', isOther: true },
  { key: 'Other Home', label: 'Other', color: '#a78bfa', isOther: true },
] as const

/* ─── main ─── */
export function TopPrioCard({ tasks, setTasks, taskMeta, updateTaskMeta, openModal, onTaskToggle }: TopPrioCardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [activeTask, setActiveTask] = useState<PrioTask | null>(null)

  const getSection = (key: string) => tasks.find(s => s.section === key)

  const toggleTask = (sectionKey: string, taskIdx: number) => {
    setTasks(prev => {
      const n = [...prev]
      const si = n.findIndex(s => s.section === sectionKey)
      if (si < 0) return prev
      const s = { ...n[si] }; const tl = [...s.tasks]
      const newDone = !tl[taskIdx].done
      tl[taskIdx] = { ...tl[taskIdx], done: newDone }
      s.tasks = tl; n[si] = s
      if (onTaskToggle) onTaskToggle(tl[taskIdx].text, newDone)
      return n
    })
  }

  const deleteTask = (sectionKey: string, taskIdx: number) => {
    setTasks(prev => {
      const n = [...prev]
      const si = n.findIndex(s => s.section === sectionKey)
      if (si < 0) return prev
      const s = { ...n[si] }
      s.tasks = s.tasks.filter((_, i) => i !== taskIdx)
      n[si] = s; return n
    })
  }

  const addTask = (sectionKey: string) => {
    setTasks(prev => {
      const n = [...prev]
      const si = n.findIndex(s => s.section === sectionKey)
      if (si < 0) return prev
      const s = { ...n[si] }
      s.tasks = [...s.tasks, { id: `q${Date.now()}`, text: 'New task', done: false, priority: 'gray' }]
      n[si] = s; return n
    })
  }

  /* ─ cross-quadrant drag ─ */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    for (const section of tasks) {
      const found = section.tasks.find(t => t.id === active.id)
      if (found) { setActiveTask(found); break }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    // find source section & index
    let srcSection = '', srcIdx = -1
    for (const section of tasks) {
      const idx = section.tasks.findIndex(t => t.id === active.id)
      if (idx >= 0) { srcSection = section.section; srcIdx = idx; break }
    }
    if (!srcSection || srcIdx < 0) return

    // find dest section — over could be a task or a droppable quadrant
    let destSection = '', destIdx = -1
    for (const section of tasks) {
      const idx = section.tasks.findIndex(t => t.id === over.id)
      if (idx >= 0) { destSection = section.section; destIdx = idx; break }
    }

    // if over is a droppable area (quadrant key), not a task
    if (!destSection) {
      const overKey = String(over.id)
      if (tasks.find(s => s.section === overKey)) {
        destSection = overKey
        destIdx = tasks.find(s => s.section === overKey)!.tasks.length // append at end
      }
    }
    if (!destSection) return

    if (srcSection === destSection) {
      // same quadrant — reorder
      if (destIdx < 0) return
      setTasks(prev => {
        const n = [...prev]
        const si = n.findIndex(s => s.section === srcSection)
        const s = { ...n[si] }
        s.tasks = arrayMove([...s.tasks], srcIdx, destIdx)
        n[si] = s; return n
      })
    } else {
      // cross-quadrant — move task
      setTasks(prev => {
        const n = [...prev]
        const srcSi = n.findIndex(s => s.section === srcSection)
        const destSi = n.findIndex(s => s.section === destSection)
        if (srcSi < 0 || destSi < 0) return prev
        const srcS = { ...n[srcSi] }; const destS = { ...n[destSi] }
        const [movedTask] = srcS.tasks.splice(srcIdx, 1)
        const insertAt = destIdx >= 0 ? Math.min(destIdx, destS.tasks.length) : destS.tasks.length
        destS.tasks = [...destS.tasks.slice(0, insertAt), movedTask, ...destS.tasks.slice(insertAt)]
        n[srcSi] = srcS; n[destSi] = destS; return n
      })
    }
  }

  return (
    <div className="card-base halo-black">
      <div className="section-header header-black px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Top prio today</span>
      </div>
      <div className="px-3 py-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-2.5">
            {QUADRANTS.map(q => {
              const section = getSection(q.key)
              return (
                <Quadrant key={q.key} quadrantKey={q.key} label={q.label} color={q.color}
                  isOther={q.isOther} tasks={section?.tasks || []}
                  onToggle={(ti) => toggleTask(q.key, ti)}
                  onDelete={(ti) => deleteTask(q.key, ti)}
                  onAdd={() => addTask(q.key)}
                  openModal={openModal} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
              )
            })}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="bg-[#1e2438] border border-white/10 rounded-md px-2 py-1 text-[12px] text-slate-200 shadow-xl">
                {activeTask.text}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

/* ─── quadrant (droppable area) ─── */
function Quadrant({ quadrantKey, label, color, isOther, tasks, onToggle, onDelete, onAdd, openModal, taskMeta, updateTaskMeta }: {
  quadrantKey: string; label: string; color: string; isOther: boolean
  tasks: PrioTask[]
  onToggle: (i: number) => void; onDelete: (i: number) => void; onAdd: () => void
  openModal: (k: string, l: string) => void
  taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrantKey })

  return (
    <div ref={setNodeRef}
      className="rounded-lg p-2.5 border transition-colors"
      style={{
        background: isOver ? 'rgba(99,102,241,0.08)' : isOther ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
        borderColor: isOver ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
      }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: isOther ? `${color}66` : color, boxShadow: isOther ? 'none' : `0 0 6px ${color}` }} />
          <span className={`text-[10px] font-semibold tracking-[0.10em] uppercase ${isOther ? 'text-white/40' : 'text-white/80'}`}>
            {label}
          </span>
        </div>
        <button onClick={onAdd}
          className="w-4 h-4 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
          <IconPlus size={11} />
        </button>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task, ti) => (
          <SortableTask key={task.id} task={task} isOther={isOther}
            onToggle={() => onToggle(ti)} onOpen={() => openModal(`prio-${task.id}`, task.text)}
            onDelete={() => onDelete(ti)}
            taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
        ))}
      </SortableContext>

      {tasks.length === 0 && (
        <div className="text-[10px] text-slate-600 text-center py-2 italic">Drop tasks here</div>
      )}
    </div>
  )
}

/* ─── sortable task row ─── */
function SortableTask({ task, isOther, onToggle, onOpen, onDelete, taskMeta, updateTaskMeta }: {
  task: PrioTask; isOther: boolean
  onToggle: () => void; onOpen: () => void; onDelete: () => void
  taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const meta = taskMeta[`prio-${task.id}`]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-start gap-1.5 py-[3px] cursor-pointer select-none group" onClick={onOpen}>
      <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={e => e.stopPropagation()}>
        <IconGripVertical size={10} className="text-slate-600" />
      </span>

      {/* star — always yellow in Other quadrants */}
      <IconStar size={10} className={`mt-[3px] flex-shrink-0 ${
        isOther ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700'
      }`} />

      <div onClick={e => { e.stopPropagation(); onToggle() }}
        className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${
          task.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5 group-hover:border-slate-400'
        }`}>
        {task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
      </div>

      <span className={`text-[12px] leading-[1.35] flex-1 min-w-0 truncate ${
        task.done ? 'text-slate-500 line-through' : isOther ? 'text-slate-400' : 'text-slate-200'
      }`}>{task.text}</span>

      {/* badges */}
      <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
        <PriorityBadge priority={meta?.priority || task.priority} />
        <RecurringBadge recurring={meta?.recurring} />
        <TaskActions taskKey={`prio-${task.id}`} taskLabel={task.text} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
        <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onDelete}>
          <IconTrash size={11} className="text-slate-500 hover:text-rose-400" />
        </button>
      </span>
    </div>
  )
}
