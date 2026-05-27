'use client'

import { useState } from 'react'
import { OTHER_TODOS } from '@/lib/data'

export function OtherTodoCard() {
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
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#6d28d9] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <span className="text-white font-bold text-[14.5px] tracking-[0.07em] uppercase">
          Other to-do
        </span>
      </div>
      <div className="p-[11px_13px]">
        {todos.map((group, groupIdx) => (
          <div key={group.group} className={groupIdx > 0 ? 'mt-1.5' : ''}>
            {groupIdx > 0 && <div className="h-px bg-[#f9fafb] mb-[5px]" />}
            <div className="text-[16.5px] font-bold mb-[3px]" style={{ color: group.color }}>
              {group.group}
            </div>
            {group.tasks.map((task, taskIdx) => (
              <div
                key={task.id}
                className="flex items-center gap-[7px] py-[3px] cursor-pointer select-none"
                onClick={() => toggleTask(groupIdx, taskIdx)}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all ${
                    task.done ? 'bg-[#c4b5fd] border-[#c4b5fd]' : 'border-[#d1d5db]'
                  }`}
                >
                  {task.done && <span className="text-[#5b21b6] text-[8px] font-extrabold">✓</span>}
                </div>
                <span className={`text-[15px] leading-[1.3] ${task.done ? 'text-[#9ca3af] line-through' : 'text-[#111827]'}`}>
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
