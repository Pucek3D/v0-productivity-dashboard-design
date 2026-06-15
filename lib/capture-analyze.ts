// ─────────────────────────────────────────────────────────────────────────
// Smart Capture — analysis brain
//
// Turns raw captured text (typed, pasted, transcribed from voice, read from an
// image via OCR, or extracted from a spreadsheet) into a list of proposed,
// categorized tasks. Routing is heuristic/rule-based today, but the public
// `analyzeCapture()` signature is intentionally AI-swappable: a future version
// can replace the body with an LLM call (e.g. AI SDK) that returns the same
// `ProposedTask[]` shape without any caller changes.
// ─────────────────────────────────────────────────────────────────────────

export type CaptureDest = 'prio' | 'other' | 'project' | 'goal' | 'message' | 'meeting'

export interface ProposedTask {
  id: string
  label: string
  dest: CaptureDest
  category: 'work' | 'home'
  targetKey?: string
  targetName?: string
  targetColor?: string
  confidence: number
  /** Optional parsed time for meetings (24h). */
  hour?: number
  minute?: number
  /** Optional parsed date (YYYY-MM-DD) for meetings/deadlines. */
  date?: string
  /** Short human explanation of why this destination was chosen. */
  reason: string
}

export interface AnalyzeTarget {
  key: string
  name: string
  color?: string
  category?: 'work' | 'home'
}

export interface AnalyzeContext {
  projects: AnalyzeTarget[]
  goals: AnalyzeTarget[]
}

// ── Keyword dictionaries (English + Polish, since notes may be in either) ──
const HOME_WORDS = ['home', 'house', 'grocery', 'groceries', 'clean', 'cleaning', 'laundry', 'kids', 'family', 'dinner', 'cook', 'rent', 'apartment', 'dom', 'domu', 'pranie', 'zakupy', 'dzieci', 'rodzina', 'obiad', 'sprzątanie', 'mieszkanie']
const MESSAGE_WORDS = ['reply', 'respond', 'email', 'e-mail', 'mail', 'message', 'text', 'dm', 'call back', 'write back', 'follow up with', 'ping', 'odpisz', 'odpowiedz', 'napisz', 'napisać', 'wiadomość', 'wiadomosc', 'mejl', 'maila', 'zadzwoń', 'zadzwon', 'oddzwoń']
const MEETING_WORDS = ['meeting', 'meet ', 'call with', 'sync', '1:1', 'one on one', 'standup', 'stand-up', 'interview', 'appointment', 'catch up', 'coffee with', 'lunch with', 'spotkanie', 'spotkać', 'rozmowa', 'umów', 'umow', 'wideo', 'zoom', 'teams call']
const GOAL_WORDS = ['learn', 'master', 'improve', 'habit', 'routine', 'someday', 'eventually', 'long term', 'long-term', 'goal', 'read more', 'get better at', 'start ', 'build a habit', 'nauczyć', 'nauczyc', 'cel', 'długoterminowy', 'dlugoterminowy', 'nawyk', 'rutyna', 'opanować', 'kiedyś', 'kiedys']
const URGENT_WORDS = ['urgent', 'asap', 'today', 'now', 'important', 'deadline', 'due', 'pilne', 'dziś', 'dzis', 'dzisiaj', 'ważne', 'wazne', 'termin', 'na już', 'na juz']

// ── Text → individual line items ──
export function splitIntoItems(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/\r?\n|•|·|^\s*[-*]\s+|;/m)
    .map(s => s.replace(/^\s*(?:\d+[.)]\s*|[-*•·]\s*|\[\s?\]\s*)/, '').trim())
    .filter(s => s.length > 1)
}

const norm = (s: string) => s.toLowerCase().normalize('NFC')
const hasAny = (text: string, words: string[]) => words.some(w => text.includes(w))

// Tokenize a name into meaningful words for fuzzy matching.
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'project', 'page', 'i', 'w', 'na', 'do', 'z'])
const tokens = (s: string) => norm(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(t => t.length > 2 && !STOP.has(t))

// Try to parse a time like "3pm", "15:00", "o 14", "at 9.30".
function parseTime(text: string): { hour: number; minute: number } | undefined {
  let m = text.match(/\b(\d{1,2})[:.](\d{2})\b/)
  if (m) { const h = +m[1], mi = +m[2]; if (h < 24 && mi < 60) return { hour: h, minute: mi } }
  m = text.match(/\b(\d{1,2})\s*(am|pm)\b/i)
  if (m) { let h = +m[1] % 12; if (/pm/i.test(m[2])) h += 12; return { hour: h, minute: 0 } }
  m = text.match(/\b(?:at|o|o godz\.?)\s+(\d{1,2})\b/i)
  if (m) { const h = +m[1]; if (h < 24) return { hour: h, minute: 0 } }
  return undefined
}

// Score how well an item matches a named target (project/goal).
function matchTarget(itemTokens: string[], target: AnalyzeTarget): number {
  const tt = tokens(target.name)
  if (!tt.length) return 0
  let hits = 0
  for (const t of tt) if (itemTokens.includes(t)) hits++
  return hits / tt.length
}

function analyzeItem(raw: string, ctx: AnalyzeContext, idx: number): ProposedTask {
  const label = raw.trim()
  const text = norm(label)
  const itemTokens = tokens(label)
  const id = `cap-${Date.now()}-${idx}`
  const category: 'work' | 'home' = hasAny(text, HOME_WORDS) ? 'home' : 'work'

  // 1) Best project / goal match by name-token overlap.
  let bestProj: { t: AnalyzeTarget; score: number } | null = null
  for (const p of ctx.projects) { const s = matchTarget(itemTokens, p); if (s > 0 && (!bestProj || s > bestProj.score)) bestProj = { t: p, score: s } }
  let bestGoal: { t: AnalyzeTarget; score: number } | null = null
  for (const g of ctx.goals) { const s = matchTarget(itemTokens, g); if (s > 0 && (!bestGoal || s > bestGoal.score)) bestGoal = { t: g, score: s } }

  // 2) Meeting — strong cue and usually has a time.
  if (hasAny(text, MEETING_WORDS)) {
    const t = parseTime(text)
    return { id, label, dest: 'meeting', category, confidence: t ? 0.85 : 0.7, ...(t || {}), reason: t ? 'Looks like a scheduled meeting' : 'Mentions a meeting/call' }
  }

  // 3) Message — reply/email/call-back style.
  if (hasAny(text, MESSAGE_WORDS)) {
    return { id, label, dest: 'message', category, confidence: 0.78, reason: 'Looks like a message to send/answer' }
  }

  // 4) Strong project match wins next.
  if (bestProj && bestProj.score >= 0.5) {
    return { id, label, dest: 'project', category: bestProj.t.category || category, targetKey: bestProj.t.key, targetName: bestProj.t.name, targetColor: bestProj.t.color, confidence: 0.6 + bestProj.score * 0.3, reason: `Matches project "${bestProj.t.name}"` }
  }

  // 5) Long-term goal — explicit goal cue, or a goal-name match.
  if (hasAny(text, GOAL_WORDS) || (bestGoal && bestGoal.score >= 0.5)) {
    if (bestGoal && bestGoal.score >= 0.34) {
      return { id, label, dest: 'goal', category, targetKey: bestGoal.t.key, targetName: bestGoal.t.name, targetColor: bestGoal.t.color, confidence: 0.55 + bestGoal.score * 0.3, reason: `Matches goal "${bestGoal.t.name}"` }
    }
    return { id, label, dest: 'goal', category, confidence: 0.5, reason: 'Sounds like a long-term goal' }
  }

  // 6) Weaker project match as a fallback before generic to-do.
  if (bestProj && bestProj.score >= 0.34) {
    return { id, label, dest: 'project', category: bestProj.t.category || category, targetKey: bestProj.t.key, targetName: bestProj.t.name, targetColor: bestProj.t.color, confidence: 0.45 + bestProj.score * 0.3, reason: `Possibly related to "${bestProj.t.name}"` }
  }

  // 7) Urgent → Top Prio; otherwise Other to-do.
  if (hasAny(text, URGENT_WORDS)) {
    return { id, label, dest: 'prio', category, confidence: 0.6, reason: 'Marked urgent / time-sensitive' }
  }
  return { id, label, dest: 'other', category, confidence: 0.4, reason: 'General to-do' }
}

/**
 * Analyze raw captured text into proposed, categorized tasks.
 *
 * AI-swap seam: replace the body with an LLM call that returns ProposedTask[].
 * The heuristics below run fully offline and need no API key.
 */
export async function analyzeCapture(raw: string, ctx: AnalyzeContext): Promise<ProposedTask[]> {
  const items = splitIntoItems(raw)
  return items.map((item, i) => analyzeItem(item, ctx, i))
}

// Labels + descriptions for the destination picker in the review UI.
export const DEST_META: Record<CaptureDest, { label: string; hint: string }> = {
  prio: { label: 'Top Prio', hint: 'Today’s priority list' },
  other: { label: 'Other to-do', hint: 'Secondary to-dos' },
  project: { label: 'Project', hint: 'A specific active project' },
  goal: { label: 'Long-term', hint: 'A long-term goal' },
  message: { label: 'Message', hint: 'Reply / message to send' },
  meeting: { label: 'Meeting', hint: 'Goes on the calendar' },
}
