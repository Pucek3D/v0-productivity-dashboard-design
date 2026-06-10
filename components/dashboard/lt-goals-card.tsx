'use client'
import { useState } from 'react'
import { LT_GOALS, statusStyle, Project } from '@/lib/data'

interface LtGoalsCardProps {
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  getProjectCompletion: (project: Project) => number
}

export function LtGoalsCard({ projectDone, toggleProjectTask, getProjectCompletion }: LtGoalsCardProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="card-base halo-sage">
      <div className="section-header header-sage px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Long-term goals
        </span>
      </div>
      <div className="p-2.5">
        <div className="grid grid-cols-2 gap-2">
          {LT_GOALS.map(goal => (
            <GoalTile
              key={goal.key}
              goal={goal}
              projectDone={projectDone}
              toggleProjectTask={toggleProjectTask}
              getProjectCompletion={getProjectCompletion}
              isExpanded={!!expanded[goal.key]}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function GoalTile({
  goal, projectDone, toggleProjectTask, getProjectCompletion, isExpanded, toggleExpand,
}: {
  goal: Project
  projectDone: Record<string, boolean>
  toggleProjectTask: (projectKey: string, taskType: 'task' | 'done', index: number) => void
  getProjectCompletion: (project: Project) => number
  isExpanded: boolean
  toggleExpand: (key: string) => void
}) {
  const pct = getProjectCompletion(goal)
  const style = statusStyle(goal.status, goal.color)
  const isUrgent = goal.status.includes('Today') || goal.status.includes('🔥')

  const indexedTasks = goal.tasks.map((task, originalIdx) => ({
    task,
    originalIdx,
    done: !!projectDone[`${goal.key}-task-${originalIdx}`],
  }))
  const sortedTasks = [...indexedTasks].sort((a, b) => Number(a.done) - Number(b.done))

  const visibleTasks = sortedTasks.slice(0, 3)
  const hiddenTasks = sortedTasks.slice(3)
  const hasMore = hiddenTasks.length > 0 || goal.doneTasks.length > 0
  const nextLabel = sortedTasks.find(t => !t.done)?.task ?? goal.next

  return (
    <div className="bg-white border border-[#f0efeb] rounded-lg overflow-hidden relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.04)]">
      <div
        className="h-[2.5px] w-full"
        style={{ background: `linear-gradient(90deg, ${goal.color} 0%, ${goal.color}60 55%, transparent 100%)` }}
      />

      <div className="p-2">
        <div className="font-display text-[16px] tracking-tight text-[#0a0a0a] whitespace-nowrap overflow-hidden text-ellipsis text-shadow-soft leading-tight">
          {goal.name}
        </div>

        <div className="flex items-center justify-between mt-1 mb-2 gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <span
              className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${isUrgent ? 'pulse-soft' : ''}`}
              style={{ background: style.text }}
            />
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em] truncate" style={{ color: style.text }}>
              {goal.status}
            </span>
          </span>
          <span
            className="font-display text-[22px] tabular leading-none flex-shrink-0"
            style={{
              color: goal.color,
              textShadow: `0 0 16px ${goal.color}40, 0 1px 2px rgba(0,0,0,0.04)`,
            }}
          >
            {pct}%
          </span>
        </div>

        <div className="h-[4px] bg-[#f5f5f1] rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: goal.color }} />
        </div>

        <div className="text-[10px] text-[#a8a29e] mb-1 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
          → {nextLabel}
        </div>

        <div className="border-t border-[#f5f5f1] pt-1 mt-1">
          {visibleTasks.map(t => (
            <div
              key={t.originalIdx}
              className="flex items-start gap-1.5 py-0.5 cursor-pointer select-none"
              onClick={() => toggleProjectTask(goal.key, 'task', t.originalIdx)}
            >
              <div className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${
                t.done ? 'bg-[#c7d2fe] border-[#c7d2fe]' : 'border-[#d6d3d1] bg-white'
              }`}>
                {t.done && <span className="text-[#3730a3] text-[6.5px] font-bold leading-none">✓</span>}
              </div>
              <span className={`text-[10px] leading-[1.25] ${t.done ? 'text-[#a8a29e] line-through' : 'text-[#0a0a0a]'}`}>
                {t.task}
              </span>
            </div>
          ))}
        </div>

        {isExpanded && (
          <div className="pt-0.5">
            {hiddenTasks.map(t => (
              <div
                key={t.originalIdx}
                className="flex items-start gap-1.5 py-0.5 cursor-pointer select-none"
                onClick={() => toggleProjectTask(goal.key, 'task', t.originalIdx)}
              >
                <div className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${
                  t.done ? 'bg-[#c7d2fe] border-[#c7d2fe]' : 'border-[#d6d3d1] bg-white'
                }`}>
                  {t.done && <span className="text-[#3730a3] text-[6.5px] font-bold leading-none">✓</span>}
                </div>
                <span className={`text-[10px] leading-[1.25] ${t.done ? 'text-[#a8a29e] line-through' : 'text-[#0a0a0a]'}`}>
                  {t.task}
                </span>
              </div>
            ))}
            {goal.doneTasks.map((task, i) => {
              const isDone = projectDone[`${goal.key}-done-${i}`] !== false
              return (
                <div
                  key={`done-${i}`}
                  className="flex items-start gap-1.5 py-0.5 cursor-pointer select-none"
                  onClick={() => toggleProjectTask(goal.key, 'done', i)}
                >
                  <div className={`w-2.5 h-2.5 rounded-[2.5px] border flex-shrink-0 flex items-center justify-center mt-[2px] ${
                    isDone ? 'bg-[#c7d2fe] border-[#c7d2fe]' : 'border-[#d6d3d1] bg-white'
                  }`}>
                    {isDone && <span className="text-[#3730a3] text-[6.5px] font-bold leading-none">✓</span>}
                  </div>
                  <span className={`text-[10px] leading-[1.25] ${isDone ? 'text-[#a8a29e] line-through' : 'text-[#0a0a0a]'}`}>
                    {task}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {hasMore && (
          <div
            className="flex items-center gap-1 mt-1 cursor-pointer text-[#a8a29e] hover:text-[#047857] transition-colors"
            onClick={() => toggleExpand(goal.key)}
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.10em]">
              {isExpanded ? 'Show less' : `+${hiddenTasks.length + goal.doneTasks.length} more`}
            </span>
            <span className={`text-[9px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </div>
        )}
      </div>
    </div>
  )
}