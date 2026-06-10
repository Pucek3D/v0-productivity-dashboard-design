// Pastel helper - creates lighter version of a color
export function pastel(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const nr = Math.round(r + (255 - r) * amount)
  const ng = Math.round(g + (255 - g) * amount)
  const nb = Math.round(b + (255 - b) * amount)
  return `rgb(${nr},${ng},${nb})`
}

export function statusStyle(status: string, color: string): { bg: string; text: string } {
  if (status === 'On track') return { bg: '#d1fae5', text: '#047857' }
  if (status === 'At risk') return { bg: '#fef3c7', text: '#b45309' }
  if (status.includes('Today') || status.includes('🔥')) return { bg: '#ffe4e6', text: '#be123c' }
  if (status === 'Waiting') return { bg: '#f5f5f4', text: '#57534e' }
  if (status === 'Planning') return { bg: '#f5f5f4', text: '#292524' }
  if (status === 'This week') return { bg: '#dbeafe', text: '#1e3a8a' }
  if (status === 'Active' || status === 'Ongoing') return { bg: pastel(color, 0.86), text: color }
  return { bg: pastel(color, 0.86), text: color }
}

export interface Project {
  key: string
  name: string
  color: string
  status: string
  next: string
  tasks: string[]
  doneTasks: string[]
}

export const PROJECTS: Project[] = [
  { key: 'teamLead', name: 'Team Lead', color: '#7c3aed', status: 'On track', next: 'Anurag follow-up today',
    tasks: ['Follow up Anurag — skill status', 'Draft Varun promotion note for HR', 'Comms training plan + propose dates', 'Reach out Varun contacts (x2)', 'Progress tracker — new joiners'],
    doneTasks: ['Led 3 workshops (LT/Comms/CT)', 'Team onboarding done', 'KM check-ins + PD chats'] },
  { key: 'caseTrack', name: 'Case Tracker', color: '#2563eb', status: 'At risk', next: 'Process meeting notes',
    tasks: ['Process Himadri+Prashant notes', 'Process redesign', 'Sage prompt integration', 'Automate ingestion', 'Excel dashboard alternative'],
    doneTasks: ['Case tracker discussion led'] },
  { key: 'irisPage', name: 'Iris Page', color: '#0891b2', status: 'On track', next: 'Complete mockup',
    tasks: ['Complete mockup', 'Circularity discussion — Giulia', 'VP office hours', 'Update Jan feedback', 'Reach out Twisha (Iris team)'],
    doneTasks: ['Responded to Jan'] },
  { key: 'ipGap', name: 'IP Gap', color: '#059669', status: 'On track', next: 'IP stocktake (WIP)',
    tasks: ['IP stocktake (WIP)', 'Feedly + OpenAI explore', 'Check Excel with Himadri', 'Create guidelines', 'Sage prompt + IP Gap Bot'],
    doneTasks: [] },
  { key: 'skillCld', name: 'Skill Claude', color: '#d97706', status: 'Planning', next: 'Adapt for TS team',
    tasks: ['Adapt skill — energy transition', 'Help Anurag use Claude', 'QC Claude outputs w/ Anurag', 'Anurag leads team-sharing session'],
    doneTasks: [] },
  { key: 'ppk', name: 'PPK Meeting', color: '#dc2626', status: 'Today!', next: 'Email Christine 14:30',
    tasks: ['Email Christine — 14:30 CET TODAY', 'Calendar invite (incl. Christine)', 'Message Ania/Domi — agenda + asks', 'Kick-off deck + AI use-cases'],
    doneTasks: ['Wrote Konrad — placeholder'] },
  { key: 'prodSys', name: 'Prod System', color: '#6d28d9', status: 'Active', next: 'Call Martin (analytics)',
    tasks: ['Reach out Martin — dashboard call', 'Power Automate email to tasks', 'Learn vibe coding / v-zero', 'Create task-tool map'],
    doneTasks: ['Dashboard built (this!) ✓', 'Prepared Dashboard training'] },
  { key: 'repDash', name: 'Report Dash', color: '#0369a1', status: 'Ongoing', next: 'Automation guidance',
    tasks: ['Provide automation guidance', 'Pipeline coordination BCN', 'Pipeline tracking use case'],
    doneTasks: ['Dashboard training prep'] },
  { key: 'policyCo', name: 'Policy CeO', color: '#9ca3af', status: 'Waiting', next: 'Go-ahead from Giulia',
    tasks: ['Get go-ahead from Giulia', 'Build dashboard (post-approval)'],
    doneTasks: ['PD Chat with Manya'] },
  { key: 'training', name: 'Trainings', color: '#1d4ed8', status: 'This week', next: 'Training #1 this week',
    tasks: ['Training #1 + homework + share', 'Thu: Sustainability strategy session', 'Training #2 + homework + share', 'Fri: Trainings TL block'],
    doneTasks: ['Social Impact Day trainings'] },
  { key: 'a1Chall', name: 'A1 Challenge', color: '#374151', status: 'Planning', next: 'Use Claude not Excel',
    tasks: ['Use Claude — maintain story', 'Remove Excel', 'Make more straightforward', 'Scoring vs. slides 9 — align'],
    doneTasks: [] },
]

export const LT_GOALS: Project[] = [
  { key: 'health', name: 'Health', color: '#059669', status: 'Ongoing', next: 'Establish workout routine',
    tasks: ['Establish daily workout routine', 'Maintain 7h sleep habit', 'Body care routine', 'Monthly health check'],
    doneTasks: ['Monthly checkup'] },
  { key: 'financial', name: 'Financial', color: '#d97706', status: 'Active', next: '2 trading trainings (swingi)',
    tasks: ['2 trading trainings (swingi)', 'Build trading strategy', 'Research POZYCZKA NA START', 'Review Lista 20 + grants'],
    doneTasks: ['Define financial goals'] },
  { key: 'learning', name: 'Learning', color: '#2563eb', status: 'Active', next: 'First vibe coding project',
    tasks: ['Learn vibe coding / v-zero', 'Learn Power Automate', 'Complete Foundational Leadership cohort', 'Martin — dashboard call'],
    doneTasks: ['Foundational Leadership started', 'Dashboard training prepared'] },
  { key: 'family', name: 'Family (Jakub)', color: '#7c3aed', status: 'Ongoing', next: 'School decision this week!',
    tasks: ['Finalize Jakub school decision', 'Math support (fractions+geometry)', 'Religion mass responses (May)', 'Psychology sessions (Kuba)'],
    doneTasks: ['First Communion May 24', 'Bought suit', 'Martial arts + rehearsal'] },
]

export interface TopTask {
  id: string
  text: string
  priority: 'red' | 'yellow' | 'gray'
  done: boolean
}

export const TOP_PRIO_TASKS: { section: string; color: string; tasks: TopTask[] }[] = [
  { section: 'Work', color: '#bfdbfe', tasks: [
    { id: 'w1', text: 'Meeting doc for John (tomorrow!)', priority: 'red', done: false },
    { id: 'w2', text: 'Surabhi email — AI initiative (Jun 5)', priority: 'red', done: false },
    { id: 'w3', text: "Respond to Varun's questions", priority: 'yellow', done: false },
    { id: 'w4', text: 'Process Himadri+Prashant notes', priority: 'yellow', done: false },
  ]},
  { section: 'Home', color: '#a7f3d0', tasks: [
    { id: 'h1', text: "Finalize Jakub's school decision", priority: 'yellow', done: false },
    { id: 'h2', text: 'Respond to Faisal + Inga', priority: 'gray', done: false },
  ]},
  { section: 'Other', color: '#fca5a5', tasks: [
    { id: 'o1', text: 'PPK email Christine — 14:30 CET 🔥', priority: 'red', done: false },
    { id: 'o2', text: 'Add CTM host + coordinate slides', priority: 'yellow', done: false },
  ]},
]

export const MESSAGES = [
  'Varun — respond today',
  'Surabhi — AI initiative (Jun 5)',
  'John — meeting doc needed',
  'Himadri — write meeting note',
  'Prashant — act on findings',
  'Anurag — skill status follow-up',
  'Konrad — PPK + workshop?',
  'Shratha — review case example',
]

export interface OtherTodo {
  group: string
  color: string
  tasks: { id: string; text: string; done: boolean }[]
}

export const OTHER_TODOS: OtherTodo[] = [
  { group: 'Sushovan (monitor)', color: '#a78bfa', tasks: [
    { id: 's1', text: 'WEF — Food Systems (WIP)', done: false },
    { id: 's2', text: 'AACI — case summary (WIP)', done: false },
  ]},
  { group: 'Varun (delegate)', color: '#93c5fd', tasks: [
    { id: 'v1', text: 'Draft promotion note for HR', done: false },
    { id: 'v2', text: 'Progress tracker (new joiners)', done: false },
  ]},
  { group: 'Konrad', color: '#fcd34d', tasks: [
    { id: 'k1', text: 'PPK — budget for lunch + agenda', done: false },
    { id: 'k2', text: 'Cross-practice section prep', done: false },
  ]},
  { group: 'Personal', color: '#6ee7b7', tasks: [
    { id: 'p1', text: 'Faisal — respond', done: false },
    { id: 'p2', text: 'Inga — celebrate her promotion!', done: false },
  ]},
]

export interface KpiCategory {
  id: string
  label: string
  color: string
  kpis: Kpi[]
}

export interface Kpi {
  id: string
  label: string
  icon: string
  type: 'check' | 'num'
  checked?: boolean
  val?: string
  target?: string
  pct?: number
  streak: number
  days: number[]
}

export const KPI_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
export const TODAY_IDX = 1 // Tuesday

export const KPI_CATEGORIES: KpiCategory[] = [
  { id: 'health', label: 'Health', color: '#059669', kpis: [
    { id: 'sleep', label: 'Sleep 7h', icon: 'moon', type: 'num', val: '--', target: '7h', pct: 0, streak: 4, days: [0,0,0,0,0,0,0] },
    { id: 'workout', label: 'Workout', icon: 'run', type: 'check', checked: false, streak: 2, days: [0,0,0,0,0,0,0] },
  ]},
  { id: 'work', label: 'Work', color: '#7c3aed', kpis: [
    { id: 'tasks', label: 'Tasks done', icon: 'checkbox', type: 'num', val: '0', target: '10', pct: 0, streak: 5, days: [0,0,0,0,0,0,0] },
  { id: 'finance', label: 'Finance', color: '#d97706', kpis: [
    { id: 'trading', label: 'Trading session', icon: 'chart-candle', type: 'check', checked: false, streak: 1, days: [0,0,0,0,0,0,0] },
    { id: 'savings', label: 'Savings check', icon: 'piggy-bank', type: 'check', checked: false, streak: 0, days: [0,0,0,0,0,0,0] },
  ]},
  { id: 'personal', label: 'Personal', color: '#2563eb', kpis: [
    { id: 'podcast', label: 'Podcast / learning', icon: 'microphone', type: 'check', checked: false, streak: 3, days: [0,0,0,0,0,0,0] },
    { id: 'message', label: '1 personal message', icon: 'message', type: 'check', checked: false, streak: 2, days: [0,0,0,0,0,0,0] },
  ]},
]

export interface CalendarEvent {
  color: string
  label: string
  time?: string
}

export const MONTH_EVENTS: Record<string, Record<number, CalendarEvent[]>> = {
  '2026-4': {
    26: [{ color: '#dc2626', label: 'PPK email Christine' }, { color: '#2563eb', label: 'Respond Varun' }],
    27: [{ color: '#374151', label: 'John meeting' }, { color: '#2563eb', label: 'Leadership onboarding' }],
    29: [{ color: '#059669', label: 'Sustainability training' }, { color: '#9ca3af', label: 'Cohort connect (opt)' }],
    30: [{ color: '#7c3aed', label: 'Trainings TL block (SID)' }],
  },
  '2026-5': {
    5: [{ color: '#dc2626', label: 'Surabhi email DEADLINE' }],
    9: [{ color: '#2563eb', label: 'Foundational Leadership' }],
    15: [{ color: '#d97706', label: 'Trading review' }],
    26: [{ color: '#7c3aed', label: 'Monthly check-in' }],
  },
}

export const WEEK_EVENTS: Record<number, { time: string; label: string; color: string }[]> = {
  25: [{ time: '09:00', label: 'Plan the week', color: '#9ca3af' }],
  26: [{ time: '11:00', label: 'Respond Varun', color: '#2563eb' }, { time: '14:30', label: 'PPK email Christine', color: '#dc2626' }],
  27: [{ time: '09:00', label: 'John meeting', color: '#374151' }, { time: '14:00', label: 'Leadership onboarding', color: '#2563eb' }],
  28: [],
  29: [{ time: '10:00', label: 'Sustainability training', color: '#059669' }, { time: '14:00', label: 'Cohort connect (opt)', color: '#9ca3af' }],
  30: [{ time: '09:00', label: 'Trainings TL block', color: '#7c3aed' }],
}

export const DAY_EVENTS = [
  { hour: 9, end: 10, label: 'Morning planning + emails', color: '#9ca3af' },
  { hour: 11, end: 12, label: 'Respond to Varun', color: '#2563eb' },
  { hour: 13, end: 14, label: 'Meeting doc for John', color: '#374151' },
  { hour: 14, end: 15, label: 'PPK email Christine', color: '#dc2626' },
  { hour: 15, end: 16, label: 'Monthly check-in', color: '#d97706' },
]

export const GANTT_DATA = [
  { name: 'Health', color: '#059669', active: [1, 1, 1, 1] },
  { name: 'Financial', color: '#d97706', active: [0, 1, 1, 0] },
  { name: 'Learning', color: '#2563eb', active: [1, 1, 1, 0] },
  { name: 'Family', color: '#7c3aed', active: [1, 1, 0, 0] },
]

export const LT_MONTH_EVENTS: Record<string, Record<number, CalendarEvent[]>> = {
  '2026-4': {
    26: [{ color: '#7c3aed', label: 'School decision' }],
    29: [{ color: '#2563eb', label: 'Sustainability training' }],
    30: [{ color: '#2563eb', label: 'Trainings TL block' }],
  },
  '2026-5': {
    5: [{ color: '#d97706', label: 'Surabhi deadline' }],
    9: [{ color: '#2563eb', label: 'Leadership cohort' }],
    15: [{ color: '#d97706', label: 'Trading review' }],
    20: [{ color: '#7c3aed', label: 'Family check-in' }],
  },
}

export const LT_LEGEND = [
  { color: '#059669', label: 'Health' },
  { color: '#d97706', label: 'Financial' },
  { color: '#2563eb', label: 'Learning' },
  { color: '#7c3aed', label: 'Family' },
]

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DAY_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(month: number, year: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}
