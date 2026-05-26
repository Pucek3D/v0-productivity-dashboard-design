// Mock data for Kornelia's Op System
// Following Ivy Lee (max 6 daily tasks), GTD (inbox), PARA (projects/areas)

export interface Task {
  id: string
  title: string
  status: 'todo' | 'done'
  priority: 'P1' | 'P2'
  context: '@work' | '@home' | '@waiting'
  dueDate?: string
  duration?: number // minutes
  projectId?: string
}

export interface Project {
  id: string
  name: string
  status: 'active' | 'on-hold' | 'completed'
  progress: number // 0-100
  nextMilestone: string
  nextMilestoneDate: string
  stakeholders: string[]
  color: string
}

export interface Person {
  id: string
  name: string
  initials: string
  status: 'replies_owed' | 'awaiting_reply'
  context: string
  lastTouch: string
  avatarColor: string
}

export interface CalendarEvent {
  id: string
  title: string
  time: string
  duration: number // minutes
  type: 'meeting' | 'focus' | 'break'
  isNow?: boolean
  joinUrl?: string
}

export interface Habit {
  id: string
  name: string
  icon: string
  streak: number
  completedToday: boolean
  weekProgress: boolean[] // last 7 days
}

export interface KPI {
  id: string
  name: string
  value: string
  unit: string
  trend: number[] // last 7 values
  status: 'good' | 'warning' | 'bad'
}

export interface OKR {
  id: string
  objective: string
  progress: number
  keyResults: { title: string; progress: number }[]
}

export interface Goal {
  id: string
  title: string
  quarter: string
  progress: number
  startWeek: number
  endWeek: number
  milestones: { week: number; label: string }[]
}

export interface InboxItem {
  id: string
  text: string
  createdAt: string
}

// --- MOCK DATA ---

export const todayTasks: Task[] = [
  { id: '1', title: 'Finalize Q2 strategy deck for steering committee', status: 'todo', priority: 'P1', context: '@work', duration: 90 },
  { id: '2', title: 'Review candidate profiles from recruiting', status: 'todo', priority: 'P1', context: '@work', duration: 30 },
  { id: '3', title: 'Send follow-up to CFO on budget approval', status: 'done', priority: 'P1', context: '@work' },
  { id: '4', title: 'Prep talking points for board sync', status: 'todo', priority: 'P2', context: '@work', duration: 45 },
  { id: '5', title: 'Schedule dentist appointment', status: 'todo', priority: 'P2', context: '@home' },
  { id: '6', title: 'Review kids school forms', status: 'todo', priority: 'P2', context: '@home' },
]

export const projects: Project[] = [
  { id: 'p1', name: 'Q2 Strategy', status: 'active', progress: 68, nextMilestone: 'Board presentation', nextMilestoneDate: 'Jun 3', stakeholders: ['JM', 'SK', 'LR'], color: 'bg-accent-brand' },
  { id: 'p2', name: 'Team Expansion', status: 'active', progress: 45, nextMilestone: 'Final interviews', nextMilestoneDate: 'May 30', stakeholders: ['HR', 'DK'], color: 'bg-chart-2' },
  { id: 'p3', name: 'Client Onboarding', status: 'active', progress: 82, nextMilestone: 'Go-live', nextMilestoneDate: 'Jun 1', stakeholders: ['TM', 'AC'], color: 'bg-chart-3' },
  { id: 'p4', name: 'Process Automation', status: 'active', progress: 25, nextMilestone: 'Pilot launch', nextMilestoneDate: 'Jun 15', stakeholders: ['IT', 'OP'], color: 'bg-chart-5' },
]

export const people: Person[] = [
  { id: 'pe1', name: 'James Miller', initials: 'JM', status: 'replies_owed', context: 'Budget follow-up', lastTouch: '2d ago', avatarColor: 'bg-chart-1' },
  { id: 'pe2', name: 'Sarah Kim', initials: 'SK', status: 'replies_owed', context: 'Strategy review', lastTouch: '1d ago', avatarColor: 'bg-chart-2' },
  { id: 'pe3', name: 'David Chen', initials: 'DC', status: 'awaiting_reply', context: 'Contract terms', lastTouch: '3d ago', avatarColor: 'bg-chart-3' },
  { id: 'pe4', name: 'Lisa Rodriguez', initials: 'LR', status: 'awaiting_reply', context: 'Q2 numbers', lastTouch: '5d ago', avatarColor: 'bg-chart-4' },
]

export const calendarEvents: CalendarEvent[] = [
  { id: 'e1', title: 'Strategy Sync', time: '9:00 AM', duration: 60, type: 'meeting', isNow: true, joinUrl: '#' },
  { id: 'e2', title: 'Deep Work Block', time: '10:30 AM', duration: 90, type: 'focus' },
  { id: 'e3', title: '1:1 with Sarah', time: '1:00 PM', duration: 30, type: 'meeting', joinUrl: '#' },
  { id: 'e4', title: 'Team Standup', time: '3:00 PM', duration: 15, type: 'meeting', joinUrl: '#' },
]

export const habits: Habit[] = [
  { id: 'h1', name: 'Morning routine', icon: 'sun', streak: 12, completedToday: true, weekProgress: [true, true, true, false, true, true, true] },
  { id: 'h2', name: 'Exercise', icon: 'activity', streak: 5, completedToday: false, weekProgress: [true, false, true, true, false, true, false] },
  { id: 'h3', name: 'Read 30min', icon: 'book', streak: 8, completedToday: false, weekProgress: [true, true, true, true, false, true, true] },
]

export const kpis: KPI[] = [
  { id: 'k1', name: 'Sleep', value: '7.2', unit: 'hrs', trend: [6.5, 7, 7.5, 6.8, 7.2, 7.4, 7.2], status: 'good' },
  { id: 'k2', name: 'Steps', value: '8.4k', unit: '', trend: [6, 8, 10, 7, 9, 8, 8.4], status: 'good' },
  { id: 'k3', name: 'Focus', value: '4.2', unit: 'hrs', trend: [3, 4, 5, 3.5, 4, 4.5, 4.2], status: 'warning' },
]

export const okrs: OKR[] = [
  { 
    id: 'o1', 
    objective: 'Launch Q2 strategy initiative', 
    progress: 65,
    keyResults: [
      { title: 'Complete market analysis', progress: 100 },
      { title: 'Board approval on budget', progress: 50 },
      { title: 'Hire 2 senior analysts', progress: 45 },
    ]
  },
  { 
    id: 'o2', 
    objective: 'Improve team efficiency by 20%', 
    progress: 40,
    keyResults: [
      { title: 'Implement automation tools', progress: 30 },
      { title: 'Reduce meeting time by 25%', progress: 60 },
      { title: 'Complete process documentation', progress: 30 },
    ]
  },
  { 
    id: 'o3', 
    objective: 'Strengthen client relationships', 
    progress: 72,
    keyResults: [
      { title: 'Quarterly reviews with top 10 clients', progress: 80 },
      { title: 'NPS score above 45', progress: 65 },
      { title: 'Reduce churn to <5%', progress: 70 },
    ]
  },
]

export const goals: Goal[] = [
  { id: 'g1', title: 'Q2 Strategy Launch', quarter: 'Q2', progress: 65, startWeek: 1, endWeek: 8, milestones: [{ week: 4, label: 'Board' }, { week: 8, label: 'Launch' }] },
  { id: 'g2', title: 'Team Build-out', quarter: 'Q2-Q3', progress: 35, startWeek: 2, endWeek: 12, milestones: [{ week: 6, label: 'Hire 1' }, { week: 10, label: 'Hire 2' }] },
  { id: 'g3', title: 'Process Automation', quarter: 'Q2', progress: 25, startWeek: 4, endWeek: 10, milestones: [{ week: 7, label: 'Pilot' }] },
]

export const inboxItems: InboxItem[] = [
  { id: 'i1', text: 'Look into new project management tool', createdAt: '2h ago' },
  { id: 'i2', text: 'Follow up with marketing on campaign results', createdAt: '5h ago' },
  { id: 'i3', text: 'Book flights for conference', createdAt: '1d ago' },
]
