export interface TaskMeta {
  deadline?: string
  hour?: number
  minute?: number
  owner?: string
  label?: string
  description?: string
  timeEstimate?: number
  actualTime?: number    // ← dodaj
  priority?: 'high' | 'medium' | 'low'
  links?: string[]
  subtasks?: { id: string; text: string; done: boolean; owner?: string; deadline?: string; timeEstimate?: number }[]
  recurring?: 'daily' | 'weekly' | 'monthly' | null
}

export interface DeadlineEvent {
  date: string
  label: string
  color: string
  hour?: number
  minute?: number
  /** taskMeta keys that contribute to this (deduped) event — used for deletion. */
  keys?: string[]
  /** stable per-occurrence id (date + identity) — used to hide from calendar only. */
  eventId?: string
}

// ──────────────────────────────────────────────────────────────────
// Name / keyword auto-matching
// Used to link a Message and a Top Prio task that refer to the same
// person even when their wording differs, e.g.
//   "John — meeting doc needed"  ↔  "Meeting doc for John (tomorrow!)"
//   "Himadri — write meeting note" ↔ "Process Himadri+Prashant notes"
// ──────────────────────────────────────────────────────────────────
export const KNOWN_PEOPLE = [
  'John', 'Himadri', 'Prashant', 'Varun', 'Surabhi', 'Anurag', 'Konrad',
  'Shratha', 'Faisal', 'Inga', 'Christine', 'Giulia', 'Martin', 'Jakub',
  'Ania', 'Domi', 'Twisha', 'Sushovan', 'Kuba', 'Sage',
]

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Return the canonical person names mentioned in a label. */
export function extractPeople(label: string, extra: string[] = []): string[] {
  const pool = Array.from(new Set([...KNOWN_PEOPLE, ...extra])).filter(Boolean)
  const found: string[] = []
  for (const p of pool) {
    const re = new RegExp(`\\b${escapeRe(p)}\\b`, 'i')
    if (re.test(label) && !found.some(f => f.toLowerCase() === p.toLowerCase())) found.push(p)
  }
  return found
}

/** Two labels are "linked" when they mention at least one shared person. */
export function sharePerson(a: string, b: string, extra: string[] = []): boolean {
  const pa = extractPeople(a, extra)
  if (!pa.length) return false
  const pb = new Set(extractPeople(b, extra).map(s => s.toLowerCase()))
  return pa.some(p => pb.has(p.toLowerCase()))
}

/** Best-effort leading proper name from a message label ("Surabhi — ..." → "Surabhi"). */
export function leadingName(label: string): string {
  const head = label.split(/[—\-(]/)[0].trim().split(/\s+/)[0] || ''
  return /^[A-Z][a-z]+$/.test(head) ? head : ''
}

export function getDateLabel(dateStr: string): { text: string; className: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000)

  if (diff < 0) return { text: 'OVERDUE', className: 'text-rose-400 bg-rose-500/20' }
  if (diff === 0) return { text: 'TODAY', className: 'text-rose-400 bg-rose-500/15' }
  if (diff === 1) return { text: 'TMR', className: 'text-amber-400 bg-amber-500/15' }
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

// localStorage persistence
const STORAGE_KEY_META = 'kornelia-task-meta'
const STORAGE_KEY_DONE = 'kornelia-project-done'
const STORAGE_KEY_CAPTURE = 'kornelia-quick-capture'

export function loadTaskMeta(): Record<string, TaskMeta> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_META)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveTaskMeta(data: Record<string, TaskMeta>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY_META, JSON.stringify(data)) } catch {}
}

export function loadProjectDone(): Record<string, boolean> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DONE)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveProjectDone(data: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY_DONE, JSON.stringify(data)) } catch {}
}

export function loadCapturedTasks(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAPTURE)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveCapturedTasks(tasks: string[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY_CAPTURE, JSON.stringify(tasks)) } catch {}
}
