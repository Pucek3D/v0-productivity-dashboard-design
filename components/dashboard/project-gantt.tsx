'use client'
import { useMemo, useState, useEffect } from 'react'
import { IconX, IconChevronRight } from '@tabler/icons-react'
import { Project } from '@/lib/data'
import type { TaskMeta } from '@/lib/task-meta'

interface ProjectGanttProps {
  project: Project
  projectDone: Record<string, boolean>
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, update: Partial<TaskMeta>) => void
  onClose: () => void
}

type Segment = { start: Date; end: Date }

interface SubRow {
  label: string
  owner?: string
  done: boolean
  segments: Segment[]
  hasDeadline: boolean
  fromSchedule: boolean
  progress: number
}

interface ParentNode {
  taskIdx: number
  metaKey: string
  label: string
  owner?: string
  done: boolean
  color: string
  segments: Segment[]
  weeks: number[]
  schedule: { weeks?: number[]; ongoing?: boolean }
  fromSchedule: boolean
  hasDeadline: boolean
  progress: number
  children: SubRow[]
}

const WEEK_MS = 7 * 86400000

// ── ISO 8601 week number (Monday-start) — mirrors the task modal picker ──
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// Group selected ISO-week Mondays into contiguous runs (Mon→Sun bars).
function weeksToSegments(weeks: number[], weekToMonday: Map<number, Date>): Segment[] {
  const mondays = weeks.map(w => weekToMonday.get(w)).filter(Boolean) as Date[]
  mondays.sort((a, b) => a.getTime() - b.getTime())
  if (!mondays.length) return []
  const segs: Segment[] = []
  let runStart = mondays[0]; let prev = mondays[0]
  for (let i = 1; i < mondays.length; i++) {
    if ((mondays[i].getTime() - prev.getTime()) / 86400000 === 7) { prev = mondays[i] }
    else { segs.push({ start: runStart, end: addDays(prev, 6) }); runStart = mondays[i]; prev = mondays[i] }
  }
  segs.push({ start: runStart, end: addDays(prev, 6) })
  return segs
}

// Enumerate the ISO week numbers covered by a date range (inclusive), stepping
// week-by-week from the Monday on/before `startMs`.
function weekNumsForRange(startMs: number, endMs: number): number[] {
  const out: number[] = []
  const d = new Date(startMs); d.setHours(0, 0, 0, 0)
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1) // align back to Monday
  const end = new Date(endMs)
  let guard = 0
  while (d <= end && guard < 60) { out.push(getISOWeekNumber(d)); d.setDate(d.getDate() + 7); guard++ }
  return out
}

type DragState = {
  taskIdx: number
  segIdx: number
  mode: 'move' | 'l' | 'r'
  startX: number
  pxPerWeek: number
  baseStartMs: number
  baseEndMs: number
  metaKey: string
  allWeeks: number[]
  schedule: { weeks?: number[]; ongoing?: boolean }
  dWeeks: number
}

export function ProjectGantt({ project, projectDone, taskMeta, updateTaskMeta, onClose }: ProjectGanttProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [drag, setDrag] = useState<DragState | null>(null)

  // Map ISO week number → that week's Monday date. Spans a wide window so
  // drag-to-reschedule can resolve weeks shifted earlier/later than today.
  const weekToMonday = useMemo(() => {
    const map = new Map<number, Date>()
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday on/before the 1st
    d.setDate(d.getDate() - 42) // back up 6 weeks for leftward drags
    for (let i = 0; i < 46; i++) {
      const wn = getISOWeekNumber(d)
      if (!map.has(wn)) map.set(wn, new Date(d))
      d.setDate(d.getDate() + 7)
    }
    return map
  }, [])

  // ── Build a parent→children tree with progress fractions ──
  const nodes = useMemo(() => {
    const result: ParentNode[] = []
    const segsFor = (weeks: number[], deadlineStr: string | undefined, fallbackPadDays: number) => {
      const deadline = deadlineStr ? new Date(deadlineStr + 'T00:00') : undefined
      const scheduleSegs = weeksToSegments(weeks, weekToMonday)
      let segments: Segment[] = scheduleSegs
      if (!segments.length && deadline) segments = [{ start: addDays(deadline, -fallbackPadDays), end: deadline }]
      return { segments, fromSchedule: scheduleSegs.length > 0, hasDeadline: !!deadline && !scheduleSegs.length }
    }

    project.tasks.forEach((task, i) => {
      const key = `proj-${project.key}-${i}`
      const meta = taskMeta[key]
      const done = !!projectDone[`${project.key}-task-${i}`]
      const weeks: number[] = meta?.schedule?.weeks || []
      const { segments, fromSchedule, hasDeadline } = segsFor(weeks, meta?.deadline, 7)

      const children: SubRow[] = (meta?.subtasks || []).map(st => {
        const c = segsFor([], st.deadline, 3)
        return { label: st.text, owner: st.owner, done: st.done, segments: c.segments, hasDeadline: c.hasDeadline, fromSchedule: c.fromSchedule, progress: st.done ? 1 : 0 }
      })

      // Progress: subtasks → done/total; otherwise the task's own done flag.
      const progress = children.length
        ? children.filter(c => c.done).length / children.length
        : (done ? 1 : 0)

      result.push({
        taskIdx: i, metaKey: key, label: task, owner: meta?.owner, done, color: project.color,
        segments, weeks, schedule: meta?.schedule || {}, fromSchedule, hasDeadline, progress, children,
      })
    })
    return result
  }, [project, projectDone, taskMeta, weekToMonday])

  // ── Date range from EVERY segment (parents + all children), so the axis is
  // stable regardless of collapse state ──
  const { minDate, maxDate, totalDays } = useMemo(() => {
    const all: Date[] = []
    nodes.forEach(n => { n.segments.forEach(s => { all.push(s.start, s.end) }); n.children.forEach(c => c.segments.forEach(s => { all.push(s.start, s.end) })) })
    all.push(today, new Date(today.getTime() + 21 * 86400000))
    const min = new Date(Math.min(...all.map(d => d.getTime())) - 5 * 86400000)
    const max = new Date(Math.max(...all.map(d => d.getTime())) + 5 * 86400000)
    const days = Math.ceil((max.getTime() - min.getTime()) / 86400000)
    return { minDate: min, maxDate: max, totalDays: Math.max(days, 21) }
  }, [nodes, today])

  const dayToPercent = (date: Date) => ((date.getTime() - minDate.getTime()) / (totalDays * 86400000)) * 100
  const todayPct = dayToPercent(today)

  const weekLabels = useMemo(() => {
    const labels: { week: string; date: string; pct: number }[] = []
    const d = new Date(minDate)
    d.setDate(d.getDate() - d.getDay() + 1) // start from Monday
    const MIN_GAP_PCT = 8
    let lastPct = -100
    while (d <= maxDate) {
      if (d >= minDate) {
        const pct = dayToPercent(d)
        if (pct - lastPct >= MIN_GAP_PCT) {
          labels.push({ week: `W${getISOWeekNumber(d)}`, date: `${d.getDate()}/${d.getMonth() + 1}`, pct })
          lastPct = pct
        }
      }
      d.setDate(d.getDate() + 7)
    }
    return labels
  }, [minDate, maxDate, totalDays])

  // ── Drag-to-reschedule: window listeners while a drag is active ──
  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      const dWeeks = Math.round((e.clientX - drag.startX) / drag.pxPerWeek)
      if (dWeeks !== drag.dWeeks) setDrag({ ...drag, dWeeks })
    }
    const onUp = (e: PointerEvent) => {
      const dWeeks = Math.round((e.clientX - drag.startX) / drag.pxPerWeek)
      const off = dWeeks * WEEK_MS
      let sMs = drag.baseStartMs, eMs = drag.baseEndMs
      if (drag.mode === 'move') { sMs += off; eMs += off }
      else if (drag.mode === 'l') { sMs = Math.min(drag.baseStartMs + off, drag.baseEndMs) }
      else { eMs = Math.max(drag.baseEndMs + off, drag.baseStartMs) }

      if (dWeeks !== 0) {
        const oldSegWeeks = weekNumsForRange(drag.baseStartMs, drag.baseEndMs)
        const newSegWeeks = weekNumsForRange(sMs, eMs)
        const remaining = drag.allWeeks.filter(w => !oldSegWeeks.includes(w))
        const merged = Array.from(new Set([...remaining, ...newSegWeeks]))
        merged.sort((a, b) => (weekToMonday.get(a)?.getTime() || 0) - (weekToMonday.get(b)?.getTime() || 0))
        updateTaskMeta(drag.metaKey, { schedule: { ...drag.schedule, weeks: merged } })
      }
      setDrag(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [drag, weekToMonday, updateTaskMeta])

  const startDrag = (e: React.PointerEvent, node: ParentNode, segIdx: number, seg: Segment, mode: 'move' | 'l' | 'r') => {
    e.preventDefault(); e.stopPropagation()
    const area = (e.currentTarget as HTMLElement).closest('[data-bararea]') as HTMLElement | null
    if (!area) return
    const w = area.getBoundingClientRect().width
    setDrag({
      taskIdx: node.taskIdx, segIdx, mode, startX: e.clientX,
      pxPerWeek: (w * 7) / totalDays,
      baseStartMs: seg.start.getTime(), baseEndMs: seg.end.getTime(),
      metaKey: node.metaKey, allWeeks: node.weeks, schedule: node.schedule, dWeeks: 0,
    })
  }

  // Apply live drag preview to a parent segment's date bounds.
  const previewSeg = (node: ParentNode, segIdx: number, seg: Segment): Segment => {
    if (!drag || drag.taskIdx !== node.taskIdx || drag.segIdx !== segIdx || drag.dWeeks === 0) return seg
    const off = drag.dWeeks * WEEK_MS
    if (drag.mode === 'move') return { start: new Date(drag.baseStartMs + off), end: new Date(drag.baseEndMs + off) }
    if (drag.mode === 'l') return { start: new Date(Math.min(drag.baseStartMs + off, drag.baseEndMs)), end: seg.end }
    return { start: seg.start, end: new Date(Math.max(drag.baseEndMs + off, drag.baseStartMs)) }
  }

  // ── Flatten the tree into render rows, honoring collapse state ──
  type RenderRow = {
    key: string; label: string; owner?: string; done: boolean; color: string
    segments: Segment[]; progress: number; isSubtask: boolean; fromSchedule: boolean
    hasDeadline: boolean; node?: ParentNode; hasChildren: boolean; isCollapsed: boolean; isSummary: boolean
  }
  const renderRows: RenderRow[] = []
  nodes.forEach(node => {
    const isCollapsed = collapsed.has(node.taskIdx)
    const hasChildren = node.children.length > 0
    // When collapsed with dated children, show a summary bar spanning the union
    // of the parent's own + children's segments.
    let segments = node.segments
    let isSummary = false
    if (hasChildren && isCollapsed) {
      const spanDates = [...node.segments, ...node.children.flatMap(c => c.segments)].flatMap(s => [s.start, s.end])
      if (spanDates.length) {
        const s = new Date(Math.min(...spanDates.map(d => d.getTime())))
        const en = new Date(Math.max(...spanDates.map(d => d.getTime())))
        segments = [{ start: s, end: en }]
        isSummary = true
      }
    }
    renderRows.push({
      key: node.metaKey, label: node.label, owner: node.owner, done: node.done, color: node.color,
      segments, progress: node.progress, isSubtask: false, fromSchedule: node.fromSchedule && !isSummary,
      hasDeadline: node.hasDeadline, node, hasChildren, isCollapsed, isSummary,
    })
    if (hasChildren && !isCollapsed) {
      node.children.forEach((c, ci) => renderRows.push({
        key: `${node.metaKey}-sub-${ci}`, label: c.label, owner: c.owner, done: c.done, color: `${node.color}99`,
        segments: c.segments, progress: c.progress, isSubtask: true, fromSchedule: c.fromSchedule,
        hasDeadline: c.hasDeadline, hasChildren: false, isCollapsed: false, isSummary: false,
      }))
    }
  })

  const toggleCollapse = (idx: number) => setCollapsed(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })

  const LABEL_W = 180
  const ROW_H = 28

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: project.color, boxShadow: `0 0 8px ${project.color}` }} />
            <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Gantt — {project.name}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <IconX size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto modal-scroll">
        {renderRows.length === 0 ? (
          <div className="text-center text-slate-500 text-[12px] py-6">No tasks yet. Open a task and mark its Schedule (weeks) — or set a deadline — to see it on the Gantt chart.</div>
        ) : (
          <div style={{ position: 'relative', minWidth: 600, userSelect: drag ? 'none' : 'auto' }}>
            {/* Week headers */}
            <div style={{ height: 30, position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
              {weekLabels.map((w, i) => (
                <span key={i} style={{
                  position: 'absolute', left: `${w.pct}%`, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
                  transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>{w.week}</span>
                  <span style={{ fontSize: 8, color: '#64748b', fontWeight: 500 }}>{w.date}</span>
                </span>
              ))}
            </div>

            {/* Today line */}
            <div style={{ position: 'absolute', left: `${todayPct}%`, top: 30, bottom: 0, width: 1.5, background: '#fb7185', boxShadow: '0 0 8px rgba(251,113,133,0.5)', zIndex: 5 }}>
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 8, fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Today</div>
            </div>

            {/* Rows */}
            {renderRows.map((row) => {
              const hasBar = row.segments.length > 0
              const pct = Math.round(row.progress * 100)
              return (
                <div key={row.key} style={{ display: 'flex', alignItems: 'center', height: ROW_H, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  {/* Label */}
                  <div style={{ width: LABEL_W, flexShrink: 0, paddingRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {row.isSubtask
                      ? <span style={{ color: '#475569', fontSize: 10, marginLeft: 8 }}>↳</span>
                      : row.hasChildren
                        ? <button onClick={() => toggleCollapse(row.node!.taskIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#64748b' }} title={row.isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}>
                            <IconChevronRight size={12} style={{ transform: row.isCollapsed ? 'none' : 'rotate(90deg)', transition: 'transform 0.15s' }} />
                          </button>
                        : <span style={{ width: 12, flexShrink: 0 }} />}
                    <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${row.done ? 'bg-indigo-500/50' : ''}`}
                      style={row.done ? {} : { border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }} />
                    <span style={{ fontSize: row.isSubtask ? 10 : 11, color: row.done ? '#475569' : '#cbd5e1', textDecoration: row.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{row.label}</span>
                    {row.hasChildren && row.isCollapsed && (
                      <span style={{ fontSize: 8, color: '#818cf8', background: 'rgba(99,102,241,0.12)', padding: '0 4px', borderRadius: 3, lineHeight: '14px', flexShrink: 0, fontWeight: 600 }}>{pct}%</span>
                    )}
                    {row.owner && (
                      <span style={{ fontSize: 8, color: '#2dd4bf', background: 'rgba(45,212,191,0.12)', padding: '0 3px', borderRadius: 3, lineHeight: '14px', flexShrink: 0 }}>{row.owner}</span>
                    )}
                  </div>

                  {/* Bar area */}
                  <div data-bararea style={{ flex: 1, position: 'relative', height: '100%' }}>
                    {hasBar ? (
                      row.segments.map((rawSeg, si) => {
                        const seg = row.node ? previewSeg(row.node, si, rawSeg) : rawSeg
                        const startPct = dayToPercent(seg.start)
                        const endPct = dayToPercent(seg.end)
                        const widthPct = Math.max(endPct - startPct, 1.5)
                        const isLast = si === row.segments.length - 1
                        const draggable = !!row.node && row.fromSchedule && !row.isSummary
                        const dragging = drag && row.node && drag.taskIdx === row.node.taskIdx && drag.segIdx === si
                        const barH = row.isSubtask ? 8 : 12
                        return (
                          <div key={si} style={{
                            position: 'absolute', left: `${startPct}%`, width: `${widthPct}%`,
                            top: '50%', transform: 'translateY(-50%)', height: barH, borderRadius: 4,
                            background: `${row.color}22`,
                            border: `1px solid ${row.done ? 'rgba(99,102,241,0.45)' : `${row.color}66`}`,
                            boxShadow: dragging ? `0 0 12px ${row.color}88` : `0 0 8px ${row.color}22`,
                            overflow: 'hidden', cursor: draggable ? (dragging ? 'grabbing' : 'grab') : 'default',
                            zIndex: dragging ? 6 : 1,
                          }}
                          onPointerDown={draggable ? (e) => startDrag(e, row.node!, si, rawSeg, 'move') : undefined}
                          title={row.isSummary ? `Summary: ${pct}% complete` : row.fromSchedule ? `${seg.start.getDate()}/${seg.start.getMonth() + 1} – ${seg.end.getDate()}/${seg.end.getMonth() + 1} · drag to reschedule` : undefined}>
                            {/* Proportional progress fill (done/total subtasks, or full when done) */}
                            {row.progress > 0 && (
                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(row.progress * 100, 100)}%`, background: row.done ? 'rgba(99,102,241,0.5)' : `${row.color}88` }} />
                            )}
                            {/* Resize handles on draggable schedule bars */}
                            {draggable && (
                              <>
                                <div onPointerDown={(e) => startDrag(e, row.node!, si, rawSeg, 'l')} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, cursor: 'ew-resize', zIndex: 2 }} />
                                <div onPointerDown={(e) => startDrag(e, row.node!, si, rawSeg, 'r')} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 7, cursor: 'ew-resize', zIndex: 2 }} />
                              </>
                            )}
                            {/* Deadline marker — only on the final segment of deadline-based rows */}
                            {row.hasDeadline && isLast && (
                              <div style={{ position: 'absolute', right: -1, top: -2, bottom: -2, width: 3, borderRadius: 2, background: row.color }} />
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div style={{
                        position: 'absolute', left: `${Math.max(todayPct - 4, 0)}%`, width: `${Math.min(8, 100 - todayPct + 4)}%`,
                        top: '50%', transform: 'translateY(-50%)', height: row.isSubtask ? 6 : 10, borderRadius: 3,
                        border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 7, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>NO DATE</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
