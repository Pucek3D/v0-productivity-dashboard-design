'use client'

import { useState } from 'react'
import { Check, Clock, RefreshCw, Video, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Today's Priorities ───────────────────────────────────────────────────────

type Priority = 'p1' | 'p2'
type TaskStatus = 'todo' | 'done'

interface Task {
  id: string
  title: string
  priority: Priority
  context: string
  due?: string
  status: TaskStatus
  est?: string
}

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Finalize Q3 deck for Meridian', priority: 'p1', context: '@work', due: 'Today 3pm', est: '90m', status: 'todo' },
  { id: '2', title: 'Send revised scope to CFO', priority: 'p1', context: '@work', due: 'Today 5pm', est: '30m', status: 'todo' },
  { id: '3', title: 'Review competitive landscape brief', priority: 'p2', context: '@work', est: '45m', status: 'todo' },
  { id: '4', title: 'Book dentist appointment', priority: 'p2', context: '@home', status: 'todo' },
  { id: '5', title: 'Reply to Martin re: dinner', priority: 'p2', context: '@home', status: 'done' },
  { id: '6', title: 'Read chapter 4 of Operating Model book', priority: 'p2', context: '@other', est: '20m', status: 'todo' },
]

const SECTION_CONFIG = [
  { label: 'Work', tag: '@work', color: 'bg-accent-brand' },
  { label: 'Home', tag: '@home', color: 'bg-status-done' },
  { label: 'Other', tag: '@other', color: 'bg-foreground-subtle' },
]

function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group flex items-start gap-2.5 px-2 py-1.5 rounded-md transition-colors',
        hovered && 'bg-surface-raised'
      )}
    >
      {/* Complete button */}
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          'mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
          task.status === 'done'
            ? 'bg-status-done border-status-done'
            : task.priority === 'p1'
            ? 'border-accent-brand hover:bg-accent-brand-subtle'
            : 'border-border hover:border-foreground-muted'
        )}
      >
        {task.status === 'done' && <Check className="w-2.5 h-2.5 text-background" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[13px] leading-5',
            task.status === 'done'
              ? 'line-through text-foreground-subtle'
              : 'text-foreground'
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.due && (
            <span className={cn(
              'text-[11px]',
              task.due.includes('Today') ? 'text-status-due-soon' : 'text-foreground-subtle'
            )}>
              {task.due}
            </span>
          )}
          {task.est && (
            <span className="text-[11px] text-foreground-subtle">{task.est}</span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {hovered && task.status !== 'done' && (
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1 rounded hover:bg-surface text-foreground-subtle hover:text-foreground transition-colors" title="Snooze">
            <Clock className="w-3 h-3" />
          </button>
          <button className="p-1 rounded hover:bg-surface text-foreground-subtle hover:text-foreground transition-colors" title="Reschedule">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function TodayPriorities() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)

  const toggle = (id: string) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t))

  const done = tasks.filter(t => t.status === 'done').length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Today&apos;s Priorities
        </h2>
        <span className="text-[11px] text-foreground-subtle">{done}/{tasks.length} done</span>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
        {SECTION_CONFIG.map(({ label, tag, color }) => {
          const sectionTasks = tasks.filter(t => t.context === tag)
          if (!sectionTasks.length) return null
          return (
            <div key={tag}>
              <div className="flex items-center gap-1.5 mb-1 px-2">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color)} />
                <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">{label}</span>
              </div>
              {sectionTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={toggle} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Calendar / Day Ticker ────────────────────────────────────────────────────

interface CalEvent {
  id: string
  time: string
  title: string
  duration: string
  hasVideo: boolean
  isNow?: boolean
}

const EVENTS: CalEvent[] = [
  { id: 'e1', time: '10:00', title: 'Meridian kick-off call', duration: '60m', hasVideo: true, isNow: true },
  { id: 'e2', time: '12:00', title: 'Lunch — skip if needed', duration: '30m', hasVideo: false },
  { id: 'e3', time: '14:00', title: '1:1 with Michael', duration: '45m', hasVideo: true },
  { id: 'e4', time: '16:30', title: 'Board prep review', duration: '90m', hasVideo: false },
]

const TOMORROW: { time: string; title: string }[] = [
  { time: '09:00', title: 'Strategy sync' },
  { time: '11:00', title: 'Client workshop — Day 1' },
]

export function CalendarPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Next on Calendar
        </h2>
        <button className="text-[11px] text-accent-brand hover:underline">Full calendar</button>
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
        {EVENTS.map(ev => (
          <div
            key={ev.id}
            className={cn(
              'flex items-start gap-2.5 px-2.5 py-2 rounded-md border transition-colors',
              ev.isNow
                ? 'border-accent-brand bg-accent-brand-subtle'
                : 'border-border bg-surface hover:bg-surface-raised'
            )}
          >
            <div className="shrink-0 text-right w-9">
              <span className={cn('text-[12px] font-medium', ev.isNow ? 'text-accent-brand' : 'text-foreground-muted')}>
                {ev.time}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground truncate">{ev.title}</p>
              <p className="text-[11px] text-foreground-subtle">{ev.duration}</p>
            </div>
            {ev.hasVideo && (
              <button className={cn(
                'shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                ev.isNow
                  ? 'bg-accent-brand text-primary-foreground hover:bg-accent-brand-hover'
                  : 'bg-surface-raised text-foreground-muted hover:text-foreground'
              )}>
                <Video className="w-3 h-3" />
                {ev.isNow && <span>Join</span>}
              </button>
            )}
          </div>
        ))}

        {/* Tomorrow preview */}
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-[10px] uppercase tracking-widest text-foreground-subtle px-2 mb-1">Tomorrow</p>
          {TOMORROW.map(ev => (
            <div key={ev.time} className="flex items-center gap-2.5 px-2 py-1">
              <span className="text-[11px] text-foreground-subtle w-9 text-right">{ev.time}</span>
              <span className="text-[12px] text-foreground-subtle truncate">{ev.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── People / Follow-ups ──────────────────────────────────────────────────────

interface Person {
  id: string
  name: string
  initials: string
  context: string
  lastTouch: string
  tab: 'owed' | 'awaiting'
}

const PEOPLE: Person[] = [
  { id: 'p1', name: 'Sarah Chen', initials: 'SC', context: 'Re: scope revision for Phase 2', lastTouch: '2d ago', tab: 'owed' },
  { id: 'p2', name: 'Marcus A.', initials: 'MA', context: 'Q3 deck feedback', lastTouch: '1d ago', tab: 'owed' },
  { id: 'p3', name: 'Lena Koch', initials: 'LK', context: 'Intro to Meridian CFO', lastTouch: '3d ago', tab: 'owed' },
  { id: 'p4', name: 'Tom Brennan', initials: 'TB', context: 'Waiting on signed NDA', lastTouch: '5d ago', tab: 'awaiting' },
  { id: 'p5', name: 'Julia M.', initials: 'JM', context: 'Budget approval for workstream', lastTouch: '4d ago', tab: 'awaiting' },
]

export function PeoplePanel() {
  const [tab, setTab] = useState<'owed' | 'awaiting'>('owed')
  const filtered = PEOPLE.filter(p => p.tab === tab)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          People
        </h2>
        <ChevronRight className="w-3.5 h-3.5 text-foreground-subtle" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {(['owed', 'awaiting'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
              tab === t
                ? 'bg-accent-brand-subtle text-accent-brand'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            {t === 'owed' ? 'Replies owed' : 'Awaiting'}{' '}
            <span className="text-[10px] opacity-60">
              {PEOPLE.filter(p => p.tab === t).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
        {filtered.map(p => (
          <div key={p.id} className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-raised transition-colors">
            <div className="w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium text-foreground-muted">{p.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground">{p.name}</p>
              <p className="text-[11px] text-foreground-subtle truncate">{p.context}</p>
            </div>
            <span className="text-[10px] text-foreground-subtle shrink-0">{p.lastTouch}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
