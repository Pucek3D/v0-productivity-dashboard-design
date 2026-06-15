const JOURNAL_KEY = 'kornelia-journal'

export interface JournalEntry {
  date: string
  reflection: string
  wentWell: string
  tasksCompleted: number
  tasksCarriedForward: number
}

export function loadJournal(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveJournalEntry(entry: JournalEntry) {
  const journal = loadJournal()
  const idx = journal.findIndex(e => e.date === entry.date)
  if (idx >= 0) journal[idx] = entry
  else journal.unshift(entry)
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal.slice(0, 30))) } catch {}
}

export function getYesterdayEntry(): JournalEntry | null {
  const journal = loadJournal()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const ds = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  return journal.find(e => e.date === ds) || null
}