'use client'
import { useState } from 'react'
import { TOP_PRIO_TASKS } from '@/lib/data'

const PRIORITY_COLORS = {
  red: '#be123c',
  yellow: '#b45309',
  gray: '#a8a29e',
}

export function TopPrioCard() {
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

  return (
   <div className="card-base halo-black">
  <div className="section-header header-black px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Top prio today
        </span>
      </div>
      <div className="px-3.5 py-3">
        {tasks.map((section, sectionIdx) => (
          <div key={section.section}>
            <div
              className="text-[12px] font-semibold text-[#0a0a0a] flex items-center gap-2 uppercase tracking-[0.08em]"
              style={{ marginTop: sectionIdx > 0 ? '14px' : '0', marginBottom: '6px' }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: section.color }} />
              {section.section}
            </div>
            {section.tasks.map((task, taskIdx) => (
              <div
                key={task.id}
                className="flex items-start gap-2 py-[3px] cursor-pointer select-none group"
                onClick={() => toggleTask(sectionIdx, taskIdx)}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${
                    task.done
                      ? 'bg-[#c7d2fe] border-[#c7d2fe]'
                      : 'border-[#d6d3d1] bg-white group-hover:border-[#a8a29e]'
                  }`}
                >
                  {task.done && (
                    <span className="text-[#3730a3] text-[8px] font-bold leading-none">✓</span>
                  )}
                </div>
                <div
                  className="w-1 h-1 rounded-full flex-shrink-0 mt-[7px]"
                  style={{ background: PRIORITY_COLORS[task.priority] }}
                />
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