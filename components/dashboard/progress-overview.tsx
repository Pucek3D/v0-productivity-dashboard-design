'use client'

import { useState } from 'react'
import { PROJECTS, LT_GOALS, pastel, Project } from '@/lib/data'

interface ProgressOverviewProps {
  projectDone: Record<string, boolean>
  getProjectCompletion: (project: Project) => number
}

export function ProgressOverview({ projectDone, getProjectCompletion }: ProgressOverviewProps) {
  const [tab, setTab] = useState<'p' | 'g'>('p')
  const data = tab === 'p' ? PROJECTS : LT_GOALS

  // Calculate summary stats
  let totalTasks = 0
  let doneTasks = 0
  let totalPct = 0

  data.forEach(project => {
    const total = project.tasks.length + project.doneTasks.length
    let done = 0
    project.tasks.forEach((_, i) => {
      if (projectDone[`${project.key}-task-${i}`]) done++
    })
    project.doneTasks.forEach((_, i) => {
      if (projectDone[`${project.key}-done-${i}`] !== false) done++
    })
    totalTasks += total
    doneTasks += done
    totalPct += total > 0 ? Math.round((done / total) * 100) : 0
  })

  const avgPct = data.length > 0 ? Math.round(totalPct / data.length) : 0

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#1e40af] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
            Progress overview
          </span>
          <div className="flex bg-white/[0.18] rounded-[5px] overflow-hidden">
            <button
              onClick={() => setTab('p')}
              className={`px-[7px] py-[3px] border-none cursor-pointer text-[10px] font-bold ${
                tab === 'p' ? 'bg-white/30 text-white' : 'bg-transparent text-white/60'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setTab('g')}
              className={`px-[7px] py-[3px] border-none cursor-pointer text-[10px] font-bold ${
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
        <div className="bg-[#fafafa] rounded-lg p-[6px_10px] mb-2 flex gap-[10px]">
          <div className="text-center flex-1">
            <div className="text-[15px] font-extrabold text-[#111827] leading-none">{avgPct}%</div>
            <div className="text-[8.5px] text-[#9ca3af] mt-0.5">Avg completion</div>
          </div>
          <div className="w-px bg-[#f3f4f6]" />
          <div className="text-center flex-1">
            <div className="text-[15px] font-extrabold text-[#111827] leading-none">{doneTasks}/{totalTasks}</div>
            <div className="text-[8.5px] text-[#9ca3af] mt-0.5">Tasks done</div>
          </div>
          <div className="w-px bg-[#f3f4f6]" />
          <div className="text-center flex-1">
            <div className="text-[15px] font-extrabold text-[#f97316] leading-none">2</div>
            <div className="text-[8.5px] text-[#9ca3af] mt-0.5">At risk</div>
          </div>
        </div>

        {/* Progress bars */}
        {data.map(project => {
          const pct = getProjectCompletion(project)
          const total = project.tasks.length + project.doneTasks.length
          let done = 0
          project.tasks.forEach((_, i) => {
            if (projectDone[`${project.key}-task-${i}`]) done++
          })
          project.doneTasks.forEach((_, i) => {
            if (projectDone[`${project.key}-done-${i}`] !== false) done++
          })

          return (
            <div key={project.key} className="flex items-center gap-[5px] mb-1.5 last:mb-0">
              <div 
                className="text-[9.5px] font-bold text-[#374151] w-[65px] flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis"
                title={project.name}
              >
                {project.name}
              </div>
              <div className="flex-1 h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-400"
                  style={{ width: `${pct}%`, background: pastel(project.color, 0.42) }}
                />
              </div>
              <span 
                className="text-[9px] font-bold w-[26px] text-right flex-shrink-0"
                style={{ color: project.color }}
              >
                {pct}%
              </span>
              <span className="text-[8.5px] text-[#9ca3af] w-[22px] text-right flex-shrink-0">
                {done}/{total}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
