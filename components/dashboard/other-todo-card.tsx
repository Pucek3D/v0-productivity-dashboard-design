'use client'

import { useState } from 'react'
import { OTHER_TODOS } from '@/lib/data'

const PRIORITY_COLORS = {
  red: '#fca5a5',
  yellow: '#fde68a',
  gray: '#e5e7eb',
}

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
        <span className="text-white font-bold text-[12.5px] tracking-[0.07em] uppercase">
          Other to-do
        </span>
      </div>
      <div className="p-[11px_13px]">
        {todos.map((group, groupIdx) => (
          <div key={group.group}>
            <div 
              className="text-[14.5px] font-bold text-[#111827] flex items-center gap-[5px]"
              style={{ marginTop: groupIdx > 0 ? '10px' : '0', marginBottom: '4px' }}
            >
              <div 
                className="w-2 h-2 rounded-sm flex-shrink-0" 
                style={{ background: group.color }} 
              />
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
                    task.done 
                      ? 'bg-[#c4b5fd] border-[#c4b5fd]' 
                      : 'border-[#d1d5db] bg-transparent'
                  }`}
                >
                  {task.done && (
                    <span className="text-[#5b21b6] text-[8px] font-extrabold">✓</span>
                  )}
                </div>
                <div 
                  className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                  style={{ background: PRIORITY_COLORS[task.priority] || '#d1d5db' }}
                />
                <span className={`text-[13px] text-[#111827] leading-[1.3] ${task.done ? 'text-[#9ca3af] line-through' : ''}`}>
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
