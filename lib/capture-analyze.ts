// ─────────────────────────────────────────────────────────────────────────
// Smart Capture — analysis brain (v2 — dashboard-aligned)
//
// Routes raw captured text into 6 dashboard destinations:
//   prio → Top Prio Today (4 quadrants: Work/Home × Top/Other)
//   project → Active Projects (11 work projects)
//   goal → Long-Term Goals (4 personal goals)
//   message → Messages sidebar
//   todo → Other To-Do (delegated/monitored sections)
//   meeting → Event Calendar (creates a new meeting)
//
// Two modes:
//   1. AI mode (default) — calls Anthropic API for smart routing
//   2. Heuristic fallback — keyword-based, runs offline if API fails
// ─────────────────────────────────────────────────────────────────────────

export type CaptureDest = 'prio' | 'project' | 'goal' | 'message' | 'todo' | 'meeting'

/** Sentinel targetKey meaning "create a brand-new project/goal/section". */
export const NEW_TARGET = '__new__'

export interface ProposedTask {
  id: string
  label: string
  dest: CaptureDest
  category: 'work' | 'home'
  /** For prio dest: which half of the 2×2 grid */
  section?: 'top' | 'other'
  /** For project/goal/todo: which specific target (or NEW_TARGET to create one) */
  targetKey?: string
  targetName?: string
  targetColor?: string
  /** When targetKey === NEW_TARGET, the name to give the new project/goal/section */
  newTargetName?: string
  priority: 'high' | 'medium' | 'low'
  deadline: string | null
  /** For meetings or timed deadlines */
  hour?: number
  minute?: number
  /** Delegated to whom (first name), or null = own */
  owner: string | null
  /** 0–1 routing confidence */
  confidence: number
  /** Why this destination was chosen */
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
  todoSections?: { key: string; name: string }[]
  today?: string
}

// ── Destination metadata for the review UI ──
export const DEST_META: Record<CaptureDest, { label: string; hint: string; emoji: string; color: string }> = {
  prio:    { label: 'Top Prio',    hint: "Today's priority list",         emoji: '⚡', color: '#818cf8' },
  project: { label: 'Project',     hint: 'A specific active project',     emoji: '📁', color: '#6366f1' },
  goal:    { label: 'Long-term',   hint: 'A long-term personal goal',     emoji: '🎯', color: '#14b8a6' },
  message: { label: 'Message',     hint: 'Reply / follow-up to send',     emoji: '💬', color: '#a78bfa' },
  todo:    { label: 'Other To-Do', hint: 'Delegated or monitored item',   emoji: '📋', color: '#f59e0b' },
  meeting: { label: 'Calendar',    hint: 'Adds a new meeting to calendar', emoji: '📅', color: '#fb7185' },
}

// ── Split raw text into individual items ──
export function splitIntoItems(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/\r?\n|•|·|;/)
    .map(s => s.replace(/^\s*(?:\d+[.)]\s*|[-*•·]\s*|\[\s?\]\s*)/, '').trim())
    .filter(s => s.length > 1)
}

// ══════════════════════════════════════════════════════════════════════════
// KEYWORD DICTIONARIES — English + Polish
// ══════════════════════════════════════════════════════════════════════════

const HOME_KW = ['home', 'house', 'grocery', 'groceries', 'clean', 'laundry', 'kids', 'family', 'dinner', 'cook', 'rent', 'apartment', 'jakub', 'dom', 'domu', 'pranie', 'zakupy', 'dzieci', 'rodzina', 'obiad', 'sprzątanie', 'mieszkanie', 'szkoła', 'szkola', 'olx', 'headphones']
const MESSAGE_KW = ['reply', 'respond', 'email', 'mail', 'message', 'text', 'dm', 'call back', 'write back', 'follow up', 'ping', 'check in with', 'odpisz', 'odpowiedz', 'napisz', 'napisać', 'wiadomość', 'mejl', 'maila', 'zadzwoń', 'oddzwoń']
const MEETING_KW = ['meeting', 'meet with', 'call with', 'sync', '1:1', 'standup', 'interview', 'appointment', 'catch up', 'coffee with', 'lunch with', 'spotkanie', 'spotkać', 'rozmowa', 'umów', 'wideo', 'zoom', 'teams call', 'office hours']
const GOAL_KW = ['learn', 'master', 'improve', 'habit', 'routine', 'someday', 'long term', 'long-term', 'goal', 'build a habit', 'per week', 'per day', 'daily', 'weekly', 'times a week', 'nauczyć', 'cel', 'długoterminowy', 'nawyk', 'rutyna', 'opanować', 'kiedyś', 'razy w tygodniu', 'dziennie', 'tygodniowo']
const URGENT_KW = ['urgent', 'asap', 'today', 'now', 'important', 'deadline', 'eod', 'end of day', 'pilne', 'dziś', 'dzis', 'dzisiaj', 'ważne', 'termin', 'na już', 'natychmiast', 'blocker', 'blocking']

// People who CAN be delegated to → route to "todo" section
const DELEGATES: Record<string, string> = {
  'varun': 'varun', 'sushovan': 'sushovan', 'anurag': 'varun', // Anurag tasks monitored via varun section
  'shradka': 'varun', 'shratha': 'varun', 'radhika': 'varun', 'shashank': 'varun',
  'manya': 'varun', 'konrad': 'konrad',
}
// People who are personal contacts → route to personal todo
const PERSONAL_PEOPLE = ['faisal', 'inga', 'hand-friend']
// Stakeholders — NEVER delegate, but extract as requestor context
const STAKEHOLDERS = ['himadri', 'prashant', 'jan', 'giulia', 'krystle', 'lisa', 'martha', 'christine', 'surabhi', 'martin']

// Project keyword hints (beyond name matching)
const PROJECT_HINTS: Record<string, string[]> = {
  teamLead: ['team', 'direct report', 'varun promotion', 'anurag', 'communications training', 'new joiner', 'work planning', 'ctm'],
  caseTrack: ['case tracker', 'himadri', 'prashant', 'km collection', 'dei', 'sage prompt', 'ingestion'],
  irisPage: ['iris', 'practice page', 'mockup', 'dei page', 'fst page', 'giulia', 'jan', 'circularity'],
  ipGap: ['ip gap', 'ip stocktake', 'feedly', 'openai', 'gatsby', 'guidelines'],
  skillCld: ['skill', 'claude skill', 'energy transition skill', 'skill rollout'],
  ppk: ['ppk', 'christine', 'cross-practice', 'kick-off deck'],
  prodSys: ['dashboard', 'power automate', 'vibe coding', 'v-zero', 'v0', 'martin', 'task tool'],
  repDash: ['report dash', 'reporting', 'pipeline', 'bcn', 'macros', 'varun automation'],
  policyCo: ['policy ceo', 'policy', 'giulia go-ahead'],
  training: ['training', 'leadership cohort', 'sustainability session', 'tl block', 'trading swingi'],
  a1Chall: ['a1', 'challenge', 'disguise', 'scoring', 'slides 9'],
}

const GOAL_HINTS: Record<string, string[]> = {
  health: ['workout', 'sleep', 'body care', 'health check', 'exercise', 'gym', 'trening', 'ćwiczenia', 'sen'],
  financial: ['trading', 'pożyczka', 'pozyczka', 'grants', 'savings', 'dotacji', 'pieniądze', 'investm'],
  learning: ['learn', 'vibe coding', 'power automate course', 'leadership cohort', 'martin call', 'kurs'],
  family: ['jakub', 'school decision', 'math', 'fractions', 'geometry', 'polish', 'religion', 'psychology', 'szkoła', 'matematyka', 'komunia'],
}

// ═══════════════════════════════════════════════════════════════���══════════
// HEURISTIC ENGINE (offline fallback)
// ══════════════════════════════════════════════════════════════════════════

const norm = (s: string) => s.toLowerCase().normalize('NFC')
const hasAny = (text: string, words: string[]) => words.some(w => text.includes(w))

function parseTime(text: string): { hour: number; minute: number } | undefined {
  let m = text.match(/\b(\d{1,2})[:.](\d{2})\b/)
  if (m) { const h = +m[1], mi = +m[2]; if (h < 24 && mi < 60) return { hour: h, minute: mi } }
  m = text.match(/\b(\d{1,2})\s*(am|pm)\b/i)
  if (m) { let h = +m[1] % 12; if (/pm/i.test(m[2])) h += 12; return { hour: h, minute: 0 } }
  m = text.match(/\b(?:at|o|o godz\.?)\s+(\d{1,2})\b/i)
  if (m) { const h = +m[1]; if (h < 24) return { hour: h, minute: 0 } }
  return undefined
}

function findBestHintMatch(text: string, hints: Record<string, string[]>): { key: string; score: number } | null {
  let best: { key: string; score: number } | null = null
  for (const [key, words] of Object.entries(hints)) {
    let hits = 0
    for (const w of words) if (text.includes(w)) hits++
    const score = hits / words.length
    if (hits > 0 && (!best || score > best.score)) best = { key, score }
  }
  return best
}

function findDelegatee(text: string): { name: string; section: string } | null {
  for (const [person, section] of Object.entries(DELEGATES)) {
    if (text.includes(person)) return { name: person.charAt(0).toUpperCase() + person.slice(1), section }
  }
  return null
}

function inferPriority(text: string): 'high' | 'medium' | 'low' {
  if (hasAny(text, URGENT_KW)) return 'high'
  if (hasAny(text, ['low priority', 'nice to have', 'if time', 'eventually', 'kiedyś', 'opcjonalnie'])) return 'low'
  return 'medium'
}

function analyzeItemHeuristic(raw: string, ctx: AnalyzeContext, idx: number): ProposedTask {
  const label = raw.trim()
  const text = norm(label)
  const id = `cap-${Date.now()}-${idx}`
  const isHome = hasAny(text, HOME_KW)
  const category: 'work' | 'home' = isHome ? 'home' : 'work'
  const priority = inferPriority(text)

  // 1. Meeting — has time or meeting keywords
  if (hasAny(text, MEETING_KW)) {
    const t = parseTime(text)
    return { id, label, dest: 'meeting', category, priority, deadline: null, owner: null, confidence: t ? 0.85 : 0.7, ...(t || {}), reason: t ? 'Scheduled meeting with time' : 'Meeting/call mentioned' }
  }

  // 2. Message — respond/follow-up pattern
  if (hasAny(text, MESSAGE_KW)) {
    return { id, label, dest: 'message', category, priority, deadline: null, owner: null, confidence: 0.8, reason: 'Reply/follow-up to send' }
  }

  // 3. Delegated person → Other To-Do section
  const delegate = findDelegatee(text)
  if (delegate) {
    return { id, label, dest: 'todo', category: 'work', targetKey: delegate.section, targetName: delegate.name, priority, deadline: null, owner: delegate.name, confidence: 0.7, reason: `Delegated to ${delegate.name}` }
  }

  // 5. Personal people → personal todo
  if (PERSONAL_PEOPLE.some(p => text.includes(p))) {
    return { id, label, dest: 'message', category: 'home', priority: 'medium', deadline: null, owner: null, confidence: 0.65, reason: 'Personal contact follow-up' }
  }

  // 6. Goal match (by hints)
  const goalMatch = findBestHintMatch(text, GOAL_HINTS)
  if (goalMatch && goalMatch.score >= 0.15) {
    const g = ctx.goals.find(x => x.key === goalMatch.key)
    return { id, label, dest: 'goal', category: 'home', targetKey: goalMatch.key, targetName: g?.name || goalMatch.key, targetColor: g?.color, priority: 'medium', deadline: null, owner: null, confidence: 0.5 + goalMatch.score * 0.4, reason: `Matches goal "${g?.name || goalMatch.key}"` }
  }
  if (hasAny(text, GOAL_KW)) {
    return { id, label, dest: 'goal', category: 'home', priority: 'medium', deadline: null, owner: null, confidence: 0.45, reason: 'Sounds like a long-term goal' }
  }

  // 7. Project match (by hints)
  const projMatch = findBestHintMatch(text, PROJECT_HINTS)
  if (projMatch && projMatch.score >= 0.15) {
    const p = ctx.projects.find(x => x.key === projMatch.key)
    return { id, label, dest: 'project', category: p?.category || 'work', targetKey: projMatch.key, targetName: p?.name || projMatch.key, targetColor: p?.color, priority, deadline: null, owner: null, confidence: 0.5 + projMatch.score * 0.35, reason: `Matches project "${p?.name || projMatch.key}"` }
  }

  // 8. Also try name-token matching on project/goal names
  const nameTokens = norm(label).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(t => t.length > 2)
  for (const p of ctx.projects) {
    const pTokens = norm(p.name).split(/\s+/).filter(t => t.length > 2)
    const overlap = pTokens.filter(t => nameTokens.includes(t)).length
    if (overlap > 0 && overlap / pTokens.length >= 0.5) {
      return { id, label, dest: 'project', category: p.category || 'work', targetKey: p.key, targetName: p.name, targetColor: p.color, priority, deadline: null, owner: null, confidence: 0.55, reason: `Name matches "${p.name}"` }
    }
  }

  // 9. Urgent → prio top; everything else → prio other
  if (priority === 'high') {
    return { id, label, dest: 'prio', category, section: 'top', priority, deadline: null, owner: null, confidence: 0.6, reason: 'Urgent / time-sensitive' }
  }
  return { id, label, dest: 'prio', category, section: 'other', priority, deadline: null, owner: null, confidence: 0.4, reason: 'General to-do' }
}

// ══════════════════════════════════════════════════════════════════════════
// AI MODE — Anthropic API call for smart routing
// ══════════════════════════════════════════════════════════════════════════

const AI_SYSTEM = `You extract tasks from raw text and route each to a dashboard destination. Return ONLY a JSON array, no markdown fences, no prose.

Destinations:
- "prio" — urgent today/this-week tasks. Set category "work"/"home", section "top"/"other".
- "project" — work project task. targetKey from: teamLead, caseTrack, irisPage, ipGap, skillCld, ppk, prodSys, repDash, policyCo, training, a1Chall
- "goal" — personal goal. targetKey from: health, financial, learning, family
- "message" — respond/follow-up to a person.
- "todo" — delegated/monitored. targetKey from: sushovan, varun, konrad, personal
- "meeting" — time-specific event that goes on the calendar. Include hour (24h), minute.

Routing order: time→meeting, respond→message, delegated→todo, personal goal/habit→goal, work project→project, urgent→prio top, else→prio other.

Delegates: Varun, Anurag, Shradka, Sushovan, Radhika, Shashank, Manya. NEVER delegate to: Himadri, Prashant, Jan, Giulia, Krystle, Lisa, Martha, Christine, Surabhi.

Polish dates: dziś=today, jutro=tomorrow, do piątku=this Friday, w tym tygodniu=end of week.

Each object: {id, label (≤8 words verb-first), dest, category, section?, targetKey?, targetName?, priority ("high"/"medium"/"low"), deadline (ISO or null), hour?, minute?, owner (first name or null), confidence (0-1), reason (1 sentence)}`

async function analyzeWithAI(raw: string, ctx: AnalyzeContext): Promise<ProposedTask[] | null> {
  const today = ctx.today || new Date().toISOString().slice(0, 10)
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: AI_SYSTEM,
        messages: [{ role: 'user', content: `Today: ${today}. Extract:\n\n${raw}` }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim()
    if (!text) return null
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed: ProposedTask[] = JSON.parse(clean)
    // Enrich with colors from context
    return parsed.map(p => {
      if (p.dest === 'project' && p.targetKey) {
        const proj = ctx.projects.find(x => x.key === p.targetKey)
        if (proj) { p.targetName = proj.name; p.targetColor = proj.color }
      }
      if (p.dest === 'goal' && p.targetKey) {
        const goal = ctx.goals.find(x => x.key === p.targetKey)
        if (goal) { p.targetName = goal.name; p.targetColor = goal.color }
      }
      // Ensure required fields have defaults
      if (!p.priority) p.priority = 'medium'
      if (p.deadline === undefined) p.deadline = null
      if (p.owner === undefined) p.owner = null
      return p
    })
  } catch {
    return null // fallback to heuristic
  }
}

// ══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════════════

/**
 * Analyze raw captured text into proposed, categorized tasks.
 *
 * Tries AI mode first (Anthropic API). Falls back to heuristic engine
 * if the API call fails or is unavailable.
 */
export async function analyzeCapture(raw: string, ctx: AnalyzeContext): Promise<ProposedTask[]> {
  // Try AI first
  const aiResult = await analyzeWithAI(raw, ctx)
  if (aiResult && aiResult.length > 0) return aiResult

  // Fallback: heuristic engine
  const items = splitIntoItems(raw)
  return items.map((item, i) => analyzeItemHeuristic(item, ctx, i))
}

/**
 * Heuristic-only mode (no API call). Useful for testing or offline.
 */
export function analyzeCaptureOffline(raw: string, ctx: AnalyzeContext): ProposedTask[] {
  const items = splitIntoItems(raw)
  return items.map((item, i) => analyzeItemHeuristic(item, ctx, i))
}
