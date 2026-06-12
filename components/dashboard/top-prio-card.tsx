'use client'
import { TOP_PRIO_TASKS } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconGripVertical, IconTrash } from '@tabler/icons-react'
import type { TaskMeta } from '@/lib/task-meta'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TopPrioCardProps {
  tasks: typeof TOP_PRIO_TASKS
  setTasks: React.Dispatch<React.SetStateAction<typeof TOP_PRIO_TASKS>>
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  onTaskToggle?: (text: string, done: boolean) => void
}

export function TopPrioCard({ tasks, setTasks, taskMeta, updateTaskMeta, openModal, onTaskToggle }: TopPrioCardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const toggleTask = (sectionIdx: number, taskIdx: number) => {
    setTasks(prev => {
      const n = [...prev]; const s = { ...n[sectionIdx] }; const tl = [...s.tasks]
      const newDone = !tl[taskIdx].done
      tl[taskIdx] = { ...tl[taskIdx], done: newDone }
      s.tasks = tl; n[sectionIdx] = s
      if (onTaskToggle) onTaskToggle(tl[taskIdx].text, newDone)
      return n
    })
  }

  const deleteTask = (sectionIdx: number, taskIdx: number) => {
    setTasks(prev => {
      const n = [...prev]; const s = { ...n[sectionIdx] }
      s.tasks = s.tasks.filter((_, i) => i !== taskIdx)
      n[sectionIdx] = s; return n
    })
  }

  const handleDragEnd = (sectionIdx: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setTasks(prev => {
      const n = [...prev]; const s = { ...n[sectionIdx] }
      const oi = s.tasks.findIndex(t => t.id === active.id)
      const ni = s.tasks.findIndex(t => t.id === over.id)
      s.tasks = arrayMove([...s.tasks], oi, ni); n[sectionIdx] = s; return n
    })
  }

  return (
    <div className="card-base halo-black">
      <div className="section-header header-black px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Top prio today</span>
      </div>
      <div className="px-3.5 py-3">
        {tasks.map((section, si) => (
          <div key={section.section}>
            <div className="text-[12px] font-semibold text-white flex items-center gap-2 uppercase tracking-[0.08em]" style={{ marginTop: si > 0 ? '14px' : '0', marginBottom: '6px' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: section.color, boxShadow: `0 0 6px ${section.color}` }} />
              {section.section}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(si, e)}>
              <SortableContext items={section.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {section.tasks.map((task, ti) => (
                  <SortableTask key={task.id} task={task}
                    onToggle={() => toggleTask(si, ti)} onOpen={() => openModal(`prio-${task.id}`, task.text)}
                    onDelete={() => deleteTask(si, ti)}
                    taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>
    </div>
  )
}

function SortableTask({ task, onToggle, onOpen, onDelete, taskMeta, updateTaskMeta }: {
  task: { id: string; text: string; done: boolean }
  onToggle: () => void; onOpen: () => void; onDelete: () => void
  taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-start gap-2 py-[3px] cursor-pointer select-none group" onClick={onOpen}>
      <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={e => e.stopPropagation()}>
        <IconGripVertical size={10} className="text-slate-600" />
      </span>
      <div onClick={e => { e.stopPropagation(); onToggle() }}
        className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${task.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5 group-hover:border-slate-400'}`}>
        {task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
      </div>
      <span className={`text-[12.5px] leading-[1.35] flex-1 ${task.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.text}</span>
      <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
        <TaskActions taskKey={`prio-${task.id}`} taskLabel={task.text} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
        <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onDelete}>
          <IconTrash size={11} className="text-slate-500 hover:text-rose-400" />
        </button>
      </span>
    </div>
  )
}