'use client'

import { useState, useMemo } from 'react'
import { PROJECTS, LT_GOALS, type Project } from '@/lib/data'

interface ProgressOverviewProps {
  projectDone: Record<string, boolean>
  getProjectCompletion: (project: Project) => number
}

export function ProgressOverview({ projectDone, getProjectCompletion }: ProgressOverviewProps) {
  const [tab, setTab] = useState<'p' | 'g'>('p')

  const items = tab === 'p' ? PROJECTS : LT_GOALS

  const stats = useMemo(() => {
    const completions = items.map(p => getProjectCompletion(p))
    const avg = completions.length > 0 
      ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length) 
      : 0
    
    let tasksDone = 0
    items.forEach(p => {
      p.tasks.forEach((_, i) => {
        if (projectDone[`${p.key}-task-${i}`]) tasksDone++
      })
      p.doneTasks.forEach((_, i) => {
        if (projectDone[`${p.key}-done-${i}`] !== false) tasksDone++
      })
    })

    const atRisk = items.filter(p => p.status === 'At risk' || p.status.includes('Today')).length

    return { avg, tasksDone, atRisk }
  }, [items, projectDone, getProjectCompletion])

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#1e40af] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
            Progress overview
          </span>
          <div className="flex bg-white/20 rounded-md overflow-hidden">
            <button
              onClick={() => setTab('p')}
              className={`px-1.5 py-0.5 border-none cursor-pointer text-[10px] font-bold transition-all ${
                tab === 'p' ? 'bg-white/30 text-white' : 'bg-transparent text-white/60'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setTab('g')}
              className={`px-1.5 py-0.5 border-none cursor-pointer text-[10px] font-bold transition-all ${
                tab === 'g' ? 'bg-white/30 text-white' : 'bg-transparent text-white/60'
              }`}
            >
              Goals
            </button>
          </div>
        </div>
      </div>
      <div className="p-[11px_13px]">
        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-1.5 mb-2 flex gap-2.5">
          <div className="text-center flex-1">
            <div className="text-[15px] font-extrabold text-gray-900 leading-none">{stats.avg}%</div>
            <div className="text-[8.5px] text-gray-400 mt-0.5">Avg completion</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center flex-1">
            <div className="text-[15px] font-extrabold text-gray-900 leading-none">{stats.tasksDone}</div>
            <div className="text-[8.5px] text-gray-400 mt-0.5">Tasks done</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center flex-1">
            <div className="text-[15px] font-extrabold text-orange-500 leading-none">{stats.atRisk}</div>
            <div className="text-[8.5px] text-gray-400 mt-0.5">At risk</div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-1.5">
          {items.map(item => {
            const completion = getProjectCompletion(item)
            const totalTasks = item.tasks.length + item.doneTasks.length
            let doneTasks = 0
            item.tasks.forEach((_, i) => {
              if (projectDone[`${item.key}-task-${i}`]) doneTasks++
            })
            item.doneTasks.forEach((_, i) => {
              if (projectDone[`${item.key}-done-${i}`] !== false) doneTasks++
            })

            return (
              <div key={item.key} className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-bold text-gray-700 w-16 flex-shrink-0 truncate">
                  {item.name}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-400"
                    style={{ width: `${completion}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-[9px] font-bold w-7 text-right flex-shrink-0" style={{ color: item.color }}>
                  {completion}%
                </span>
                <span className="text-[8.5px] text-gray-400 w-6 text-right flex-shrink-0">
                  {doneTasks}/{totalTasks}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
