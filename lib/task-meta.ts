export interface TaskMeta {
  deadline?: string
  hour?: number
  minute?: number
  owner?: string
  label?: string
}

export interface DeadlineEvent {
  date: string
  label: string
  color: string
  hour?: number
  minute?: number
}

export function getDateLabel(dateStr: string): { text: string; className: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000)

  if (diff < 0)  return { text: 'OVERDUE', className: 'text-rose-400 bg-rose-500/20' }
  if (diff === 0) return { text: 'TODAY',   className: 'text-rose-400 bg-rose-500/15' }
  if (diff === 1) return { text: 'TMR',     className: 'text-amber-400 bg-amber-500/15' }
  if (diff <= 6) {
    const name = date.toLocaleDateString('en', { weekday: 'short' })
    return { text: name, className: 'text-indigo-300 bg-indigo-500/15' }
  }
  const short = date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  return { text: short, className: 'text-slate-400 bg-white/5' }
}

export function computeStatus(
  project: { key: string; tasks: string[]; doneTasks: string[] },
  projectDone: Record<string, boolean>,
  taskMeta: Record<string, TaskMeta>,
  keyPrefix: 'proj' | 'goal'
): string {
  const totalTasks = project.tasks.length + project.doneTasks.length
  if (totalTasks === 0) return 'Planning'

  let doneCount = 0
  project.tasks.forEach((_, i) => {
    if (projectDone[`${project.key}-task-${i}`]) doneCount++
  })
  project.doneTasks.forEach((_, i) => {
    if (projectDone[`${project.key}-done-${i}`] !== false) doneCount++
  })

  if (doneCount === totalTasks) return 'Complete'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let hasDeadlines = false
  let hasOverdue = false
  let hasToday = false

  project.tasks.forEach((_, i) => {
    const meta = taskMeta[`${keyPrefix}-${project.key}-${i}`]
    if (meta?.deadline && !projectDone[`${project.key}-task-${i}`]) {
      hasDeadlines = true
      const diff = Math.round((new Date(meta.deadline + 'T00:00:00').getTime() - today.getTime()) / 86400000)
      if (diff < 0) hasOverdue = true
      if (diff === 0) hasToday = true
    }
  })

  if (hasToday) return 'Today! 🔥'
  if (hasOverdue) return 'At risk'
  if (hasDeadlines && doneCount > 0) return 'On track'
  if (hasDeadlines) return 'On track'
  if (doneCount > 0) return 'Active'
  return 'Planning'
}
.scroll-wheel::-webkit-scrollbar { display: none; }
.scroll-wheel { -ms-overflow-style: none; scrollbar-width: none; }