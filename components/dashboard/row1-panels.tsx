"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, Clock, MoreHorizontal, AlarmClock, ChevronRight } from "lucide-react"

export type TaskPriority = "p1" | "p2" | "p3"
export type TaskContext = "work" | "home" | "other"

export interface Task {
  id: string
  title: string
  priority: TaskPriority
  context: TaskContext
  project?: string
  dueDate?: string
  duration?: string
  done: boolean
  overdue?: boolean
}

const CONTEXT_LABELS: Record<TaskContext, { label: string; color: string }> = {
  work: { label: "Work", color: "bg-accent-color-subtle text-accent-color" },
  home: { label: "Home", color: "bg-status-done/15 text-status-done" },
  other: { label: "Other", color: "bg-muted text-foreground-muted" },
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  p1: "bg-accent-color",
  p2: "bg-status-due-soon",
  p3: "bg-foreground-subtle",
}

const initialTasks: Task[] = [
  // Work
  { id: "w1", title: "Draft Q3 strategy deck for ACME", priority: "p1", context: "work", project: "ACME", dueDate: "Today", duration: "90m", done: false },
  { id: "w2", title: "Review merger model with finance team", priority: "p1", context: "work", project: "Merger", dueDate: "Today", duration: "60m", done: false },
  { id: "w3", title: "Send follow-up to Michael on BD proposal", priority: "p2", context: "work", project: "BD", dueDate: "Today", duration: "15m", done: false },
  // Home
  { id: "h1", title: "Book flights for Berlin offsite", priority: "p2", context: "home", dueDate: "Today", duration: "20m", done: false },
  { id: "h2", title: "Review lease renewal documents", priority: "p2", context: "home", dueDate: "Today", duration: "30m", done: false },
  // Other
  { id: "o1", title: "Read McKinsey Design Value report", priority: "p3", context: "other", duration: "45m", done: false },
  { id: "o2", title: "Schedule dentist appointment", priority: "p3", context: "other", duration: "5m", done: false },
]

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
}

function TaskCard({ task, onToggle }: TaskCardProps) {
  const ctx = CONTEXT_LABELS[task.context]
  return (
    <div
      className={cn(
        "group flex items-start gap-2.5 px-3 py-2.5 rounded-md hover:bg-surface-raised transition-colors cursor-default",
        task.done && "opacity-40"
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-0.5 flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-colors",
          task.done
            ? "bg-status-done border-status-done"
            : "border-border-subtle hover:border-accent-color"
        )}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
      >
        {task.done && <Check className="w-2.5 h-2.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", PRIORITY_COLORS[task.priority])} />
          <span className={cn("text-sm leading-snug truncate", task.done ? "line-through text-foreground-subtle" : "text-foreground")}>
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {task.project && (
            <span className="text-[11px] text-foreground-subtle">{task.project}</span>
          )}
          {task.duration && (
            <span className="flex items-center gap-0.5 text-[11px] text-foreground-subtle">
              <Clock className="w-2.5 h-2.5" />
              {task.duration}
            </span>
          )}
          {task.dueDate && (
            <span className={cn("text-[11px]", task.overdue ? "text-status-overdue" : "text-foreground-subtle")}>
              {task.overdue && <AlarmClock className="w-2.5 h-2.5 inline mr-0.5" />}
              {task.dueDate}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", ctx.color)}>
          {ctx.label}
        </span>
        <button className="p-0.5 rounded hover:bg-muted text-foreground-subtle hover:text-foreground">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  label: string
  color: string
  count: number
}

function SectionHeader({ label, color, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1">
      <div className={cn("w-2 h-2 rounded-sm shrink-0", color)} />
      <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{label}</span>
      <span className="text-xs text-foreground-subtle ml-auto">{count}</span>
    </div>
  )
}

export function TodayPriorities() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const toggle = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const workTasks = tasks.filter((t) => t.context === "work")
  const homeTasks = tasks.filter((t) => t.context === "home")
  const otherTasks = tasks.filter((t) => t.context === "other")
  const doneCount = tasks.filter((t) => t.done).length

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Today&apos;s Priorities</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {doneCount}/{tasks.length} completed &middot; Ivy Lee method
          </p>
        </div>
        <button className="text-foreground-subtle hover:text-foreground transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto">
        <SectionHeader label="Work" color="bg-accent-color" count={workTasks.length} />
        {workTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={toggle} />)}

        <SectionHeader label="Home" color="bg-status-done" count={homeTasks.length} />
        {homeTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={toggle} />)}

        <SectionHeader label="Other" color="bg-foreground-subtle" count={otherTasks.length} />
        {otherTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={toggle} />)}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border shrink-0">
        <button className="flex items-center gap-1.5 text-xs text-foreground-subtle hover:text-accent-color transition-colors w-full">
          <span className="text-base leading-none">+</span>
          <span>Add task</span>
        </button>
      </div>
    </div>
  )
}

// ─── Calendar Panel ─────────────────────────────────────────────────

export interface CalEvent {
  id: string
  title: string
  time: string
  duration: string
  type: "meeting" | "block" | "external"
  isNow?: boolean
  hasVideo?: boolean
  color?: string
}

const calEvents: CalEvent[] = [
  { id: "c1", title: "Now: Board call — Project Meridian", time: "9:00", duration: "60m", type: "meeting", isNow: true, hasVideo: true, color: "border-accent-color bg-accent-color-subtle" },
  { id: "c2", title: "1:1 with Nadia (BCG)", time: "10:30", duration: "30m", type: "meeting", hasVideo: true, color: "border-border bg-surface-raised" },
  { id: "c3", title: "Deep work — Deck drafting", time: "11:00", duration: "90m", type: "block", color: "border-status-done/40 bg-status-done/10" },
  { id: "c4", title: "Lunch + reading", time: "12:30", duration: "60m", type: "block", color: "border-border bg-surface-raised" },
  { id: "c5", title: "ACME status call", time: "14:00", duration: "45m", type: "external", hasVideo: true, color: "border-status-due-soon/40 bg-status-due-soon/10" },
]

export function CalendarPanel() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Next on Calendar</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Today + tomorrow preview</p>
        </div>
        <button className="text-xs text-foreground-subtle hover:text-accent-color transition-colors flex items-center gap-0.5">
          Full calendar <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
        {calEvents.map((ev) => (
          <div key={ev.id} className={cn("flex items-start gap-2.5 p-2.5 rounded-md border-l-2 transition-colors", ev.color)}>
            <div className="min-w-[40px] text-right shrink-0">
              <span className="text-xs font-mono text-foreground-muted">{ev.time}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs leading-snug truncate", ev.isNow ? "text-foreground font-medium" : "text-foreground-muted")}>
                {ev.title}
              </p>
              <p className="text-[11px] text-foreground-subtle mt-0.5">{ev.duration}</p>
            </div>
            {ev.hasVideo && (
              <button className={cn("text-[10px] px-2 py-0.5 rounded font-medium shrink-0 transition-colors",
                ev.isNow ? "bg-accent-color text-white hover:bg-accent-color-hover" : "bg-muted text-foreground-muted hover:text-foreground"
              )}>
                {ev.isNow ? "Join" : "Join"}
              </button>
            )}
          </div>
        ))}

        {/* Tomorrow preview */}
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <p className="text-[10px] text-foreground-subtle uppercase tracking-wider font-medium px-1 mb-1.5">Tomorrow</p>
          <div className="flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-raised transition-colors">
            <span className="text-xs font-mono text-foreground-subtle w-10">08:30</span>
            <span className="text-xs text-foreground-subtle truncate">Merger steering committee</span>
          </div>
          <div className="flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-raised transition-colors">
            <span className="text-xs font-mono text-foreground-subtle w-10">11:00</span>
            <span className="text-xs text-foreground-subtle truncate">Partner debrief — Q3 pipeline</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── People / Follow-ups Panel ───────────────────────────────────────

export interface PersonItem {
  id: string
  name: string
  initials: string
  context: string
  lastContact: string
  nextTouch?: string
  type: "reply-owed" | "awaiting"
  priority?: boolean
}

const people: PersonItem[] = [
  { id: "p1", name: "Michael Brandt", initials: "MB", context: "BD proposal — awaiting your response", lastContact: "2d ago", type: "reply-owed", priority: true },
  { id: "p2", name: "Nadia Kowalski", initials: "NK", context: "Q3 framework review feedback", lastContact: "3d ago", type: "reply-owed" },
  { id: "p3", name: "CFO — ACME Corp", initials: "AC", context: "Deck revisions sent — awaiting sign-off", lastContact: "1d ago", nextTouch: "Tomorrow", type: "awaiting" },
  { id: "p4", name: "Thomas Eriksson", initials: "TE", context: "Berlin offsite logistics — pending RSVP", lastContact: "5d ago", nextTouch: "Fri", type: "awaiting" },
  { id: "p5", name: "Legal — Merger team", initials: "LG", context: "NDA redlines sent — no reply yet", lastContact: "4d ago", type: "awaiting", priority: true },
]

export function PeoplePanel() {
  const [tab, setTab] = useState<"owed" | "awaiting">("owed")
  const owed = people.filter((p) => p.type === "reply-owed")
  const awaiting = people.filter((p) => p.type === "awaiting")
  const shown = tab === "owed" ? owed : awaiting

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">People</h2>
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          <button
            onClick={() => setTab("owed")}
            className={cn("text-xs px-2 py-1 rounded transition-colors font-medium",
              tab === "owed" ? "bg-card text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
            )}
          >
            Replies owed
            {owed.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-status-overdue/20 text-status-overdue px-1 rounded">{owed.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab("awaiting")}
            className={cn("text-xs px-2 py-1 rounded transition-colors font-medium",
              tab === "awaiting" ? "bg-card text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
            )}
          >
            Awaiting
            {awaiting.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-muted text-foreground-muted px-1 rounded">{awaiting.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
        {shown.map((person) => (
          <div key={person.id} className="group flex items-start gap-2.5 px-2 py-2.5 rounded-md hover:bg-surface-raised transition-colors cursor-default">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
              person.priority ? "bg-accent-color-subtle text-accent-color" : "bg-muted text-foreground-muted"
            )}>
              {person.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground truncate">{person.name}</span>
                {person.priority && (
                  <span className="w-1.5 h-1.5 rounded-full bg-status-overdue shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-foreground-subtle truncate mt-0.5">{person.context}</p>
              <p className="text-[11px] text-foreground-subtle mt-0.5">
                {person.lastContact}
                {person.nextTouch && <span className="text-status-due-soon ml-1.5">Touch by {person.nextTouch}</span>}
              </p>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-2 py-1 rounded bg-muted text-foreground-muted hover:text-foreground hover:bg-surface-raised shrink-0">
              Reply
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
