'use client'
import { useState } from 'react'
import { TOP_PRIO_TASKS } from '@/lib/data'
import { TaskActions } from './task-actions'
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import type { TaskMeta } from '@/lib/task-meta'

interface TopPrioCardProps {
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
  openModal: (key: string, label: string) => void
}

export function TopPrioCard({ taskMeta, updateTaskMeta, openModal }: TopPrioCardProps) {
  const [tasks, setTasks] = useState(TOP_PRIO_TASKS)

  const toggleTask = (sectionIdx: number, taskIdx: number) => {
    setTasks(prev => {
      const newTasks = [...prev]
      const section = { ...newTasks[sectionIdx] }
      const taskList = [...section.tasks]
      taskList[taskIdx] = { ...taskList[taskIdx], done: !taskList[taskIdx].done }
      taskList.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
      section.tasks = taskList
      newTasks[sectionIdx] = section
      return newTasks
    })
  }

  const moveTask = (sectionIdx: number, taskIdx: number, direction: -1 | 1) => {
    setTasks(prev => {
      const newTasks = [...prev]
      const section = { ...newTasks[sectionIdx] }
      const taskList = [...section.tasks]
      const newIdx = taskIdx + direction
      if (newIdx < 0 || newIdx >= taskList.length) return prev
      ;[taskList[taskIdx], taskList[newIdx]] = [taskList[newIdx], taskList[taskIdx]]
      section.tasks = taskList
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
            {section.tasks.map((task, taskIdx) => (
              <div key={task.id}
                className="flex items-start gap-2 py-[3px] cursor-pointer select-none group"
                onClick={() => openModal(`prio-${task.id}`, task.text)}>
                <div
                  onClick={(e) => { e.stopPropagation(); toggleTask(sectionIdx, taskIdx) }}
                  className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${
                    task.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5 group-hover:border-slate-400'
                  }`}>
                  {task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
                </div>
                <span className={`text-[12.5px] leading-[1.35] flex-1 ${task.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {task.text}
                </span>
                <TaskActions taskKey={`prio-${task.id}`} taskLabel={task.text}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
                {/* Reorder arrows — visible on hover */}
                <span className="flex flex-col gap-0 icon-on-hover flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => moveTask(sectionIdx, taskIdx, -1)}
                    className="bg-transparent border-none cursor-pointer p-0 leading-none"
                    style={{ opacity: taskIdx === 0 ? 0.2 : 1 }}>
                    <IconArrowUp size={10} className="text-slate-500 hover:text-slate-300" />
                  </button>
                  <button onClick={() => moveTask(sectionIdx, taskIdx, 1)}
                    className="bg-transparent border-none cursor-pointer p-0 leading-none"
                    style={{ opacity: taskIdx === section.tasks.length - 1 ? 0.2 : 1 }}>
                    <IconArrowDown size={10} className="text-slate-500 hover:text-slate-300" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}