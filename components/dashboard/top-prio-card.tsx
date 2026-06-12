'use client'
import { useState } from 'react'
import { TOP_PRIO_TASKS } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconStar, IconGripVertical } from '@tabler/icons-react'
import type { TaskMeta } from '@/lib/task-meta'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TopPrioCardProps {
  tasks: typeof TOP_PRIO_TASKS
  setTasks: React.Dispatch<React.SetStateAction<typeof TOP_PRIO_TASKS>>
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
  openModal: (key: string, label: string) => void
}

export function TopPrioCard({ tasks, setTasks, taskMeta, updateTaskMeta, openModal }: TopPrioCardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const toggleTask = (sectionIdx: number, taskIdx: number) => {
    setTasks(prev => {
      const newTasks = [...prev]
      const section = { ...newTasks[sectionIdx] }
      const taskList = [...section.tasks]
      taskList[taskIdx] = { ...taskList[taskIdx], done: !taskList[taskIdx].done }
      section.tasks = taskList
      newTasks[sectionIdx] = section
      return newTasks
    })
  }

  const handleDragEnd = (sectionIdx: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setTasks(prev => {
      const newTasks = [...prev]
      const section = { ...newTasks[sectionIdx] }
      const oldIdx = section.tasks.findIndex(t => t.id === active.id)
      const newIdx = section.tasks.findIndex(t => t.id === over.id)
      section.tasks = arrayMove([...section.tasks], oldIdx, newIdx)
      newTasks[sectionIdx] = section
      return newTasks
    })
  }

  return (
    <div className="card-base halo-black">
      <div className="section-header header-black px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">
          Top prio today
        </span>
      </div>
      <div className="px-3.5 py-3">
        {tasks.map((section, sectionIdx) => (
          <div key={section.section}>
            <div className="text-[12px] font-semibold text-white flex items-center gap-2 uppercase tracking-[0.08em]"
              style={{ marginTop: sectionIdx > 0 ? '14px' : '0', marginBottom: '6px' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: section.color, boxShadow: `0 0 6px ${section.color}` }} />
              {section.section}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(sectionIdx, e)}>
              <SortableContext items={section.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {section.tasks.map((task, taskIdx) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(sectionIdx, taskIdx)}
                    onOpen={() => openModal(`prio-${task.id}`, task.text)}
                    taskMeta={taskMeta}
                    updateTaskMeta={updateTaskMeta}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>
    </div>
  )
}

function SortableTask({ task, onToggle, onOpen, taskMeta, updateTaskMeta }: {
  task: { id: string; text: string; done: boolean; priority: string }
  onToggle: () => void
  onOpen: () => void
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as any,
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-start gap-2 py-[3px] cursor-pointer select-none group"
      onClick={onOpen}>
      {/* Drag handle */}
      <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab"
        onClick={e => e.stopPropagation()}>
        <IconGripVertical size={10} className="text-slate-600" />
      </span>
      {/* Checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${
          task.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5 group-hover:border-slate-400'
        }`}>
        {task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
      </div>
      {/* Text */}
      <span className={`text-[12.5px] leading-[1.35] flex-1 ${task.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
        {task.text}
      </span>
      <TaskActions taskKey={`prio-${task.id}`} taskLabel={task.text}
        taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
    </div>
  )
}