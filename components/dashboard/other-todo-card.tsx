'use client'
import { useState } from 'react'
import { OTHER_TODOS } from '@/lib/data'
import { TaskActions } from './task-actions'
import type { TaskMeta } from '@/lib/task-meta'

interface OtherTodoCardProps {
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
  openModal: (key: string, label: string) => void
}

export function OtherTodoCard({ taskMeta, updateTaskMeta, openModal }: OtherTodoCardProps) {
  const [todos, setTodos] = useState(OTHER_TODOS)

  const toggleTask = (groupIdx: number, taskIdx: number) => {
    setTodos(prev => {
      const newTodos = [...prev]
      const group = { ...newTodos[groupIdx] }
      const tasks = [...group.tasks]
      tasks[taskIdx] = { ...tasks[taskIdx], done: !tasks[taskIdx].done }
      group.tasks = tasks
      newTodos[groupIdx] = group
      return newTodos
    })
  }

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">
          Other to-do
        </span>
      </div>
      <div className="px-3.5 py-3">
        {todos.map((group, groupIdx) => (
          <div key={group.group} className={groupIdx > 0 ? 'mt-3' : ''}>
            {groupIdx > 0 && <div className="h-px bg-white/5 mb-2" />}
            <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-[0.14em] flex items-center gap-1.5"
              style={{ color: group.color }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: group.color, boxShadow: `0 0 6px ${group.color}` }} />
              {group.group}
            </div>
            {group.tasks.map((task, taskIdx) => (
              <div key={task.id}
                className="flex items-start gap-2 py-[3px] cursor-pointer select-none group"
                onClick={() => toggleTask(groupIdx, taskIdx)}
                onDoubleClick={() => openModal(`todo-${task.id}`, task.text)}
              >
                <div className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${
                  task.done
                    ? 'bg-indigo-500/30 border-indigo-400'
                    : 'border-slate-600 bg-white/5 group-hover:border-slate-400'
                }`}>
                  {task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
                </div>
                <span className={`text-[12.5px] leading-[1.35] ${
                  task.done ? 'text-slate-500 line-through' : 'text-slate-200'
                }`}>
                  {task.text}
                </span>
                <TaskActions taskKey={`todo-${task.id}`} taskLabel={task.text}
                  taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}