"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, Users, MoreHorizontal, ArrowRight, Inbox } from "lucide-react"

// ─── Active Projects Panel ─────────────────────────────────────────

export interface Project {
  id: string
  name: string
  status: "active" | "at-risk" | "on-hold"
  progress: number
  nextMilestone: string
  milestoneDate: string
  topTasks: string[]
  stakeholders: string[]
  area: string
}

const projects: Project[] = [
  {
    id: "proj1",
    name: "ACME — Q3 Strategy",
    status: "active",
    progress: 62,
    nextMilestone: "Board presentation",
    milestoneDate: "Jun 3",
    topTasks: ["Finalize slide 4–9 narrative", "Get CFO sign-off on assumptions"],
    stakeholders: ["KW", "MB", "AC"],
    area: "Client",
  },
  {
    id: "proj2",
    name: "Meridian Merger",
    status: "at-risk",
    progress: 38,
    nextMilestone: "Legal NDA sign-off",
    milestoneDate: "May 30",
    topTasks: ["Resolve redlines with legal", "Update synergy model"],
    stakeholders: ["TE", "LG"],
    area: "M&A",
  },
  {
    id: "proj3",
    name: "BD Pipeline — H2",
    status: "active",
    progress: 80,
    nextMilestone: "Proposal submission",
    milestoneDate: "Jun 1",
    topTasks: ["Send final proposal to Michael"],
    stakeholders: ["MB", "NK"],
    area: "Business Dev",
  },
  {
    id: "proj4",
    name: "Internal — OKR Reset",
    status: "active",
    progress: 20,
    nextMilestone: "Team workshop",
    milestoneDate: "Jun 10",
    topTasks: ["Draft workshop agenda", "Align with Nadia on format"],
    stakeholders: ["NK"],
    area: "Internal",
  },
  {
    id: "proj5",
    name: "Berlin Offsite Planning",
    status: "on-hold",
    progress: 55,
    nextMilestone: "Final headcount confirmed",
    milestoneDate: "Jun 7",
    topTasks: ["Book venue", "Send invites to 12 partners"],
    stakeholders: ["TE", "MB"],
    area: "Ops",
  },
]

const STATUS_CONFIG = {
  active: { label: "Active", color: "text-status-done bg-status-done/15" },
  "at-risk": { label: "At Risk", color: "text-status-overdue bg-status-overdue/15" },
  "on-hold": { label: "On Hold", color: "text-foreground-muted bg-muted" },
}

function ProjectTile({ project }: { project: Project }) {
  const status = STATUS_CONFIG[project.status]
  return (
    <div className="group flex flex-col gap-2.5 p-3.5 bg-card border border-border rounded-lg hover:border-border cursor-default hover:bg-surface-raised transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", status.color)}>
              {status.label}
            </span>
            <span className="text-[10px] text-foreground-subtle">{project.area}</span>
          </div>
          <h3 className="text-sm font-medium text-foreground leading-tight">{project.name}</h3>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-foreground-subtle">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-foreground-subtle">Progress</span>
          <span className="text-[10px] font-mono text-foreground-muted">{project.progress}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              project.status === "at-risk" ? "bg-status-overdue" : "bg-accent-color"
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Next milestone */}
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-status-due-soon shrink-0" />
        <span className="text-[11px] text-foreground-muted truncate">{project.nextMilestone}</span>
        <span className="text-[11px] text-foreground-subtle ml-auto shrink-0">{project.milestoneDate}</span>
      </div>

      {/* Top tasks */}
      <div className="space-y-0.5">
        {project.topTasks.slice(0, 1).map((task, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-foreground-subtle mt-0.5 text-[10px]">→</span>
            <span className="text-[11px] text-foreground-subtle leading-tight truncate">{task}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5 border-t border-border-subtle">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-foreground-subtle" />
          <div className="flex -space-x-1">
            {project.stakeholders.slice(0, 3).map((s, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-muted border border-card flex items-center justify-center text-[8px] font-medium text-foreground-muted">
                {s[0]}
              </div>
            ))}
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] text-accent-color hover:text-accent-color-hover">
          Open <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export function ActiveProjects() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-background border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Active Projects</h2>
          <p className="text-xs text-foreground-muted mt-0.5">{projects.length} active &middot; PARA: Projects layer</p>
        </div>
        <button className="text-xs text-foreground-subtle hover:text-accent-color transition-colors flex items-center gap-0.5">
          All projects <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 auto-rows-min">
          {projects.map((proj) => (
            <ProjectTile key={proj.id} project={proj} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Inbox / Quick Capture Panel ─────────────────────────────────────

export interface InboxItem {
  id: string
  text: string
  captured: string
  processed: boolean
}

const initialInbox: InboxItem[] = [
  { id: "i1", text: "Follow up with CFO re synergy model assumptions", captured: "5m ago", processed: false },
  { id: "i2", text: "Read Bain's 2024 M&A report", captured: "1h ago", processed: false },
  { id: "i3", text: "Schedule check-in with Thomas — Berlin logistics", captured: "2h ago", processed: false },
  { id: "i4", text: "Draft personal OKRs for H2", captured: "Yesterday", processed: false },
  { id: "i5", text: "Renew gym membership", captured: "Yesterday", processed: false },
]

export function InboxPanel() {
  const [items, setItems] = useState<InboxItem[]>(initialInbox)
  const [inputText, setInputText] = useState("")

  const addItem = () => {
    if (!inputText.trim()) return
    setItems((prev) => [
      { id: `i${Date.now()}`, text: inputText.trim(), captured: "Just now", processed: false },
      ...prev,
    ])
    setInputText("")
  }

  const processItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const unprocessed = items.filter((i) => !i.processed)

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-foreground-muted" />
          <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
          {unprocessed.length > 0 && (
            <span className="text-[10px] bg-accent-color-subtle text-accent-color px-1.5 py-0.5 rounded font-medium">
              {unprocessed.length}
            </span>
          )}
        </div>
        <span className="text-[10px] text-foreground-subtle">Process weekly</span>
      </div>

      {/* Quick capture input */}
      <div className="px-3 py-2.5 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
          <span className="text-sm text-foreground-subtle">+</span>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Capture anything, classify later..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none"
          />
          {inputText.trim() && (
            <button
              onClick={addItem}
              className="text-[10px] px-2 py-0.5 bg-accent-color text-white rounded font-medium hover:bg-accent-color-hover transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1.5 flex flex-col gap-0.5">
        {unprocessed.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
            <Inbox className="w-8 h-8 text-foreground-subtle" />
            <p className="text-xs text-foreground-muted">Inbox is clear</p>
            <p className="text-[11px] text-foreground-subtle">Capture anything with Cmd+Shift+A</p>
          </div>
        )}
        {unprocessed.map((item) => (
          <div key={item.id} className="group flex items-start gap-2 px-2 py-2.5 rounded-md hover:bg-surface-raised transition-colors cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-color mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground leading-snug">{item.text}</p>
              <p className="text-[10px] text-foreground-subtle mt-0.5">{item.captured}</p>
            </div>
            <button
              onClick={() => processItem(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-2 py-1 rounded bg-muted text-foreground-muted hover:text-foreground shrink-0"
            >
              Process
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
