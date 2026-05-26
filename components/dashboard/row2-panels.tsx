'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Active Projects ──────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  client: string
  progress: number
  milestone: string
  milestoneDate: string
  tasks: string[]
  avatars: string[]
  status: 'on-track' | 'at-risk' | 'blocked'
}

const PROJECTS: Project[] = [
  {
    id: 'pr1',
    name: 'Meridian Operating Model',
    client: 'Meridian Capital',
    progress: 62,
    milestone: 'Phase 2 kickoff',
    milestoneDate: 'Jun 3',
    tasks: ['Finalize Q3 deck', 'Align on org structure'],
    avatars: ['SC', 'MA'],
    status: 'on-track',
  },
  {
    id: 'pr2',
    name: 'Lighthouse M&A Due Diligence',
    client: 'Lighthouse Group',
    progress: 38,
    milestone: 'Mgmt presentation',
    milestoneDate: 'Jun 10',
    tasks: ['Review CIM', 'Model revenue synergies'],
    avatars: ['TB', 'LK'],
    status: 'at-risk',
  },
  {
    id: 'pr3',
    name: 'Nordic Retail Strategy',
    client: 'NorRetail AB',
    progress: 85,
    milestone: 'Board read-out',
    milestoneDate: 'May 30',
    tasks: ['Final slide review'],
    avatars: ['JM'],
    status: 'on-track',
  },
  {
    id: 'pr4',
    name: 'Internal: BD Pipeline',
    client: 'Internal',
    progress: 20,
    milestone: 'Proposals sent',
    milestoneDate: 'Jun 14',
    tasks: ['Draft 3 proposals', 'Update CRM'],
    avatars: ['SC'],
    status: 'on-track',
  },
]

const STATUS_CONFIG = {
  'on-track': { label: 'On track', cls: 'text-status-done bg-status-done/10' },
  'at-risk': { label: 'At risk', cls: 'text-status-due-soon bg-status-due-soon/10' },
  'blocked': { label: 'Blocked', cls: 'text-status-overdue bg-status-overdue/10' },
}

function ProjectTile({ project }: { project: Project }) {
  const sc = STATUS_CONFIG[project.status]
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-surface hover:bg-surface-raised transition-colors cursor-pointer group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">{project.name}</p>
          <p className="text-[11px] text-foreground-subtle">{project.client}</p>
        </div>
        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0', sc.cls)}>
          {sc.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-foreground-subtle">Progress</span>
          <span className="text-[11px] text-foreground-muted">{project.progress}%</span>
        </div>
        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              project.progress > 70 ? 'bg-status-done' : project.status === 'at-risk' ? 'bg-status-due-soon' : 'bg-accent-brand'
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Milestone + avatars */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-foreground-subtle truncate">
            Next: <span className="text-foreground-muted">{project.milestone}</span>
          </p>
          <p className="text-[11px] text-foreground-subtle">{project.milestoneDate}</p>
        </div>
        <div className="flex -space-x-1.5">
          {project.avatars.map(a => (
            <div key={a} className="w-5 h-5 rounded-full bg-surface-raised border border-border flex items-center justify-center">
              <span className="text-[9px] font-medium text-foreground-muted">{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-0.5">
        {project.tasks.map(t => (
          <p key={t} className="text-[11px] text-foreground-subtle truncate">
            <span className="mr-1 text-foreground-subtle">·</span>{t}
          </p>
        ))}
      </div>
    </div>
  )
}

export function ActiveProjects() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Active Projects
        </h2>
        <span className="text-[11px] text-foreground-subtle">{PROJECTS.length} active</span>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto min-h-0 content-start">
        {PROJECTS.map(p => (
          <ProjectTile key={p.id} project={p} />
        ))}
      </div>
    </div>
  )
}

// ─── Inbox / Quick Capture ────────────────────────────────────────────────────

interface InboxItem {
  id: string
  text: string
  ts: string
}

const INITIAL_INBOX: InboxItem[] = [
  { id: 'i1', text: 'Ask Marcus about interim CEO timeline', ts: '10 min ago' },
  { id: 'i2', text: 'Read Bain article on org transformation sent by Sarah', ts: '1h ago' },
  { id: 'i3', text: 'Follow up on Lighthouse data room access', ts: '3h ago' },
  { id: 'i4', text: 'Check flight to Stockholm for June workshop', ts: 'Yesterday' },
  { id: 'i5', text: 'Research comparable deals for NorRetail analysis', ts: 'Yesterday' },
]

export function InboxCapture() {
  const [items, setItems] = useState(INITIAL_INBOX)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = () => {
    const text = input.trim()
    if (!text) return
    setItems(prev => [{ id: Date.now().toString(), text, ts: 'Just now' }, ...prev])
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">
          Inbox
        </h2>
        <span className="text-[11px] text-foreground-subtle">{items.length} unprocessed</span>
      </div>

      {/* Capture input */}
      <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg border border-border bg-surface focus-within:border-accent-brand transition-colors">
        <Plus className="w-3.5 h-3.5 text-foreground-subtle shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Capture anything — classify later…"
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground-subtle outline-none"
        />
        <button
          onClick={submit}
          disabled={!input.trim()}
          className="shrink-0 disabled:opacity-30 text-accent-brand hover:text-accent-brand-hover transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto min-h-0">
        {items.map(item => (
          <div
            key={item.id}
            className="group flex items-start gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-raised transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-foreground-subtle mt-1.5 shrink-0" />
            <p className="flex-1 text-[13px] text-foreground-muted leading-5">{item.text}</p>
            <span className="text-[10px] text-foreground-subtle shrink-0 opacity-0 group-hover:opacity-100">{item.ts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
