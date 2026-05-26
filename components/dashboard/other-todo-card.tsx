'use client'

import { useState } from 'react'
import { OTHER_TODOS } from '@/lib/data'

export function OtherTodoCard() {
  const [todos, setTodos] = useState(OTHER_TODOS)

  const toggleTask = (groupIdx: number, taskIdx: number) => {
    setTodos(prev =>
      prev.map((group, gi) =>
        gi === groupIdx
          ? {
              ...group,
              tasks: group.tasks.map((t, ti) =>
                ti === taskIdx ? { ...t, done: !t.done } : t
              ),
            }
          : group
      )
    )
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#6d28d9] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
          Other to-do
        </span>
      </div>
      <div className="p-[11px_13px]">
        {todos.map((group, gi) => (
          <div key={group.group} className={gi > 0 ? 'mt-1.5' : ''}>
            {gi > 0 && <div className="h-px bg-gray-50 mb-1.5" />}
            <div className="text-[11px] font-bold mb-0.5" style={{ color: group.color }}>
              {group.group}
            </div>
            {group.tasks.map((task, ti) => (
              <div
                key={task.id}
                className="flex items-center gap-1.5 py-0.5 cursor-pointer select-none"
                onClick={() => toggleTask(gi, ti)}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-sm border-[1.5px] flex-shrink-0 flex items-center justify-center ${
                    task.done ? 'bg-[#c4b5fd] border-[#c4b5fd]' : 'border-gray-300'
                  }`}
                >
                  {task.done && <span className="text-[8px] font-extrabold text-[#5b21b6]">✓</span>}
                </div>
                <span
                  className={`text-xs leading-tight ${
                    task.done ? 'text-gray-400 line-through' : 'text-gray-900'
                  }`}
                >
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
