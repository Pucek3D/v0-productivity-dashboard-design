export interface TaskMeta {
  deadline?: string
  hour?: number
  owner?: string
  label?: string
}

export interface DeadlineEvent {
  date: string
  label: string
  color: string
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