'use client'
import { useState } from 'react'
import { PROJECTS, LT_GOALS, Project } from '@/lib/data'

interface ProgressOverviewProps {
  projectDone: Record<string, boolean>
  getProjectCompletion: (project: Project) => number
}

export function ProgressOverview({ projectDone, getProjectCompletion }: ProgressOverviewProps) {
  const [tab, setTab] = useState<'p' | 'g'>('p')
  const data = tab === 'p' ? PROJECTS : LT_GOALS

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
    <div className="card-base halo-slate-blue">
      <div className="section-header header-slate-blue px-4 py-2.5">
        <div className="flex justify-between items-center">
          <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
            Progress overview
          </span>
          <div className="seg-toggle flex">
            <button
              onClick={() => setTab('p')}
              className={`seg-toggle-btn px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                tab === 'p' ? 'seg-toggle-btn-active' : 'seg-toggle-btn-inactive'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setTab('g')}
              className={`seg-toggle-btn px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                tab === 'g' ? 'seg-toggle-btn-active' : 'seg-toggle-btn-inactive'
              }`}
            >
              Goals
            </button>
          </div>
        </div>
      </div>
      <div className="px-3.5 py-3">
        <div className="bg-[#fafaf7] border border-[#f0efeb] rounded-lg px-3 py-2.5 mb-3 flex gap-3">
          <div className="text-center flex-1">
            <div className="font-display text-[30px] leading-none text-[#0a0a0a] tabular text-shadow-display">{avgPct}%</div>
            <div className="text-[8.5px] text-[#a8a29e] mt-1 uppercase tracking-[0.14em] font-medium">Avg completion</div>
          </div>
          <div className="w-px bg-[#e7e5e0]" />
          <div className="text-center flex-1">
            <div className="font-display text-[30px] leading-none text-[#0a0a0a] tabular text-shadow-display">
              {doneTasks}<span className="text-[#a8a29e]">/{totalTasks}</span>
            </div>
            <div className="text-[8.5px] text-[#a8a29e] mt-1 uppercase tracking-[0.14em] font-medium">Tasks done</div>
          </div>
          <div className="w-px bg-[#e7e5e0]" />
          <div className="text-center flex-1">
            <div className="font-display text-[30px] leading-none text-[#b45309] tabular text-shadow-display">2</div>
            <div className="text-[8.5px] text-[#a8a29e] mt-1 uppercase tracking-[0.14em] font-medium">At risk</div>
          </div>
        </div>

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
            <div key={project.key} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <div
                className="text-[9.5px] font-semibold text-[#292524] w-[68px] flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis"
                title={project.name}
              >
                {project.name}
              </div>
              <div className="flex-1 h-1.5 bg-[#f5f5f1] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: project.color }}
                />
              </div>
              <span className="text-[9.5px] font-bold w-[28px] text-right flex-shrink-0 tabular" style={{ color: project.color }}>
                {pct}%
              </span>
              <span className="text-[8.5px] text-[#a8a29e] w-[22px] text-right flex-shrink-0 tabular">
                {done}/{total}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}