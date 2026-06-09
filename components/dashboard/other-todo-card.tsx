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
    <div className="card-base">
      <div className="section-header header-plum px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Other to-do
        </span>
      </div>
      <div className="px-3.5 py-3">
        {todos.map((group, groupIdx) => (
          <div key={group.group} className={groupIdx > 0 ? 'mt-3' : ''}>
            {groupIdx > 0 && <div className="h-px bg-[#f0efeb] mb-2" />}
            <div
              className="text-[10px] font-semibold mb-1.5 uppercase tracking-[0.14em] flex items-center gap-1.5"
              style={{ color: group.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: group.color }} />
              {group.group}
            </div>
            {group.tasks.map((task, taskIdx) => (
              <div
                key={task.id}
                className="flex items-start gap-2 py-[3px] cursor-pointer select-none group"
                onClick={() => toggleTask(groupIdx, taskIdx)}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${
                    task.done
                      ? 'bg-[#c7d2fe] border-[#c7d2fe]'
                      : 'border-[#d6d3d1] bg-white group-hover:border-[#a8a29e]'
                  }`}
                >
                  {task.done && <span className="text-[#3730a3] text-[8px] font-bold leading-none">✓</span>}
                </div>
                <span className={`text-[12.5px] leading-[1.35] ${
                  task.done ? 'text-[#a8a29e] line-through' : 'text-[#0a0a0a]'
                }`}>
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