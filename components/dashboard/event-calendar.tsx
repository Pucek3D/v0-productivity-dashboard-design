'use client'
import React, { useState, useEffect } from 'react'
import {
  MONTH_EVENTS, WEEK_EVENTS, DAY_EVENTS,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth
} from '@/lib/data'
import { IconPlus, IconX } from '@tabler/icons-react'
import type { DeadlineEvent } from '@/lib/task-meta'

const CARD: React.CSSProperties = {
  background: 'linear-gradient(180deg, #131c2e 0%, #0d1421 100%)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '16px',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.4), 0 16px 40px rgba(0, 0, 0, 0.3)',
  overflow: 'hidden',
  position: 'relative',
}

const GLOW_LINE: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px',
  background: 'linear-gradient(90deg, transparent 0%, #fb7185 25%, #fb7185 75%, transparent 100%)',
  boxShadow: '0 0 12px rgba(251, 113, 133, 0.6), 0 0 28px rgba(251, 113, 133, 0.4)',
  zIndex: 2,
}

const HEADER_BAR: React.CSSProperties = {
  background: 'transparent',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  position: 'relative', padding: '12px 16px',
}

const TOGGLE_WRAP: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', overflow: 'hidden',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)', display: 'flex',
}

const togBtn = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
  color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
  boxShadow: active ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.10)' : 'none',
  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '10px',
  textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px',
})

const TITLE: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.92)', fontWeight: 600, fontSize: '11px',
  letterSpacing: '0.18em', textTransform: 'uppercase',
}

const DISPLAY_FONT: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  fontWeight: 700, letterSpacing: '-0.025em',
}

/* ─── custom meeting type ─── */
interface CustomMeeting {
  id: string
  day: number
  month: number
  year: number
  label: string
  color: string
  time?: string
  durationMin?: number
  done?: boolean
}

const MEETING_COLORS = ['#818cf8', '#fb7185', '#fbbf24', '#2dd4bf', '#a78bfa', '#f97316']
const DURATION_PRESETS = [
  { label: '15m', value: 15 }, { label: '30m', value: 30 }, { label: '1h', value: 60 },
  { label: '1.5h', value: 90 }, { label: '2h', value: 120 }, { label: '3h', value: 180 },
]

/* Build a "HH:MM–HH:MM" range from a start time + duration (minutes).
   Falls back to just the start time when no duration is set. */
function fmtTimeRange(hour: number, minute: number, durationMin?: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const start = `${pad(hour)}:${pad(minute)}`
  if (!durationMin || durationMin < 1) return start
  const total = hour * 60 + minute + durationMin
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return `${start}–${pad(eh)}:${pad(em)}`
}

interface EventCalendarProps {
  deadlineEvents?: DeadlineEvent[]
  completedTasks?: Set<string>
  onDeleteEvent?: (ev: DeadlineEvent) => void
}

export function EventCalendar({ deadlineEvents = [], completedTasks, onDeleteEvent }: EventCalendarProps) {
  const [view, setView] = useState<'d' | 'm' | 'w'>('m')
  const [today, setToday] = useState({ d: 26, m: 4, y: 2026 })
  const [month, setMonth] = useState(4)
  const [year, setYear] = useState(2026)
  const [customMeetings, setCustomMeetings] = useState<CustomMeeting[]>([])
  const [showAddForm, setShowAddForm] = useState<{ day: number } | null>(null)
  const [newMeetingText, setNewMeetingText] = useState('')
  const [newMeetingTime, setNewMeetingTime] = useState('')
  const [newMeetingColor, setNewMeetingColor] = useState('#818cf8')
  const [newMeetingDuration, setNewMeetingDuration] = useState(30)
  const [customDur, setCustomDur] = useState('')

  useEffect(() => {
    const now = new Date()
    const t = { d: now.getDate(), m: now.getMonth(), y: now.getFullYear() }
    setToday(t); setMonth(t.m); setYear(t.y)
  }, [])

  const changeMonth = (delta: number) => {
    let newMonth = month + delta; let newYear = year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setMonth(newMonth); setYear(newYear)
  }

  /* ─ filter out completed task events from calendar ─ */
  const activeDeadlineEvents = completedTasks
    ? deadlineEvents.filter(e => !completedTasks.has(e.label))
    : deadlineEvents

  const addMeeting = (day: number) => {
    if (!newMeetingText.trim()) return
    setCustomMeetings(prev => [...prev, {
      id: `mtg-${Date.now()}`,
      day, month, year,
      label: newMeetingText.trim(),
      color: newMeetingColor,
      time: newMeetingTime || undefined,
      durationMin: newMeetingTime ? newMeetingDuration : undefined,
    }])
    setNewMeetingText('')
    setNewMeetingTime('')
    setNewMeetingDuration(30)
    setCustomDur('')
    setShowAddForm(null)
  }

  const removeMeeting = (id: string) => {
    setCustomMeetings(prev => prev.filter(m => m.id !== id))
  }

  const getMeetingsForDay = (day: number, m: number, y: number) => {
    return customMeetings.filter(mtg =>
      mtg.day === day && mtg.month === m && mtg.year === y && !mtg.done
    )
  }

  return (
    <div style={CARD}>
      <div style={GLOW_LINE} />
      <div style={HEADER_BAR}>
        <div className="flex justify-between items-center" style={{ position: 'relative' }}>
          <div className="flex items-center gap-2">
            <span style={TITLE}>Event Calendar</span>
            {/* + Meeting button */}
            <button onClick={() => setShowAddForm(showAddForm ? null : { day: today.d })}
              className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Add meeting">
              <IconPlus size={13} />
            </button>
          </div>
          <div style={TOGGLE_WRAP}>
            {(['d', 'm', 'w'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={togBtn(view === v)}>
                {v === 'd' ? 'Day' : v === 'm' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add meeting inline form */}
      {showAddForm && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600 }}>
              New meeting — {MONTH_NAMES[month]} {showAddForm.day}
            </span>
            <button onClick={() => setShowAddForm(null)} className="ml-auto text-slate-500 hover:text-white">
              <IconX size={12} />
            </button>
          </div>
          <div className="flex gap-1.5">
            <input value={newMeetingText} onChange={e => setNewMeetingText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addMeeting(showAddForm.day) }}
              placeholder="Meeting name..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#fff', outline: 'none' }} />
            <input value={newMeetingTime} onChange={e => setNewMeetingTime(e.target.value)}
              placeholder="14:00" type="time"
              style={{ width: 72, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 6px', fontSize: 11, color: '#fff', outline: 'none', colorScheme: 'dark' }} />
            <div className="flex gap-0.5">
              {MEETING_COLORS.map(c => (
                <button key={c} onClick={() => setNewMeetingColor(c)}
                  style={{ width: 16, height: 16, borderRadius: 4, background: c, border: newMeetingColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <button onClick={() => addMeeting(showAddForm.day)}
              style={{ background: '#6366f1', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#fff' }}>
              Add
            </button>
          </div>
          {/* Duration picker — only relevant for timed meetings */}
          {newMeetingTime && (
            <div className="mt-1.5">
              <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Duration</div>
              <div className="flex items-center gap-1 flex-wrap">
                {DURATION_PRESETS.map(p => {
                  const active = newMeetingDuration === p.value && customDur === ''
                  return (
                    <button key={p.value} onClick={() => { setNewMeetingDuration(p.value); setCustomDur('') }} style={{
                      padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 9, fontWeight: 700,
                      background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                      color: active ? '#818cf8' : '#94a3b8',
                      border: active ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    }}>{p.label}</button>
                  )
                })}
                <input
                  value={customDur}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9]/g, '')
                    setCustomDur(v)
                    if (v) setNewMeetingDuration(parseInt(v, 10))
                  }}
                  placeholder="Custom (min)"
                  style={{
                    width: 80, background: 'rgba(255,255,255,0.05)',
                    border: customDur ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 5, padding: '3px 8px', fontSize: 9, color: '#fff', outline: 'none',
                  }}
                />
                <span style={{ fontSize: 9, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTimeRange(parseInt(newMeetingTime.split(':')[0]), parseInt(newMeetingTime.split(':')[1] || '0'), newMeetingDuration)}
                </span>
              </div>
            </div>
          )}
          {/* Day picker row */}
          <div className="flex gap-0.5 mt-1.5 overflow-x-auto">
            {Array.from({ length: getDaysInMonth(month, year) }).map((_, i) => {
              const d = i + 1
              const isSelected = showAddForm.day === d
              const isToday = d === today.d && month === today.m && year === today.y
              return (
                <button key={d} onClick={() => setShowAddForm({ day: d })}
                  style={{
                    width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer',
                    fontSize: 9, fontWeight: isSelected ? 700 : 400, flexShrink: 0,
                    background: isSelected ? '#6366f1' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? '#fb7185' : '#475569',
                  }}>{d}</button>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-3.5 py-3">
        {view !== 'd' && (
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)}
                className="bg-white/5 border border-white/10 rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition">‹</button>
              <span style={{ ...DISPLAY_FONT, fontSize: '20px', color: '#ffffff' }}>
                {MONTH_NAMES[month]} <span style={{ color: '#64748b' }}>{year}</span>
              </span>
              <button onClick={() => changeMonth(1)}
                className="bg-white/5 border border-white/10 rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition">›</button>
              <button onClick={() => { setMonth(today.m); setYear(today.y) }}
                style={{ marginLeft: '8px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#fb7185', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Today
              </button>
            </div>
          </div>
        )}
        {view === 'm' && <MonthView month={month} year={year} today={today}
          deadlineEvents={activeDeadlineEvents} customMeetings={customMeetings}
          onClickDay={(day) => setShowAddForm({ day })}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent} />}
        {view === 'w' && <WeekView today={today} deadlineEvents={activeDeadlineEvents}
          customMeetings={customMeetings} month={month} year={year}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent} />}
        {view === 'd' && <DayView today={today} deadlineEvents={activeDeadlineEvents}
          customMeetings={customMeetings} month={month} year={year}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent} />}
      </div>
    </div>
  )
}

/* ─── Month View ─── */
function MonthView({ month, year, today, deadlineEvents, customMeetings, onClickDay, onRemoveMeeting, onDeleteEvent }: {
  month: number; year: number; today: { d: number; m: number; y: number }
  deadlineEvents: DeadlineEvent[]; customMeetings: CustomMeeting[]
  onClickDay: (day: number) => void; onRemoveMeeting: (id: string) => void
  onDeleteEvent?: (ev: DeadlineEvent) => void
}) {
  const startDay = getFirstDayOfMonth(month, year)
  const daysInMonth = getDaysInMonth(month, year)
  const events = MONTH_EVENTS[`${year}-${month}`] || {}

  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-center text-[9.5px] font-semibold text-slate-500 uppercase tracking-[0.12em] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="min-h-[46px]" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = day === today.d && month === today.m && year === today.y
          const regularEvents = (events[day] || []).map(e => ({ label: e.label, color: e.color, kind: 'static' as const }))
          // Dedupe task events by label (render-level safety net on top of the
          // page-level dedup) so the same task never appears twice in a cell.
          const seenLabels = new Set<string>()
          const taskEvents = deadlineEvents.filter(e => {
            const d = new Date(e.date + 'T00:00')
            if (!(d.getDate() === day && d.getMonth() === month && d.getFullYear() === year)) return false
            const key = e.label.replace(/^🔄\s*/, '')
            if (seenLabels.has(key)) return false
            seenLabels.add(key); return true
          }).map(e => ({ label: e.label, color: e.color, kind: 'task' as const, ev: e }))
          const meetingEvents = customMeetings
            .filter(m => m.day === day && m.month === month && m.year === year && !m.done)
            .map(m => ({ label: m.label, color: m.color, kind: 'meeting' as const, id: m.id }))
          const dayEvents = [...regularEvents, ...taskEvents, ...meetingEvents]

          return (
            <div key={day}
              className={`min-h-[46px] rounded-md p-[3px] flex flex-col gap-0.5 border transition-colors cursor-pointer ${
                isToday ? 'border-rose-400/60' : 'border-transparent hover:bg-white/[0.03] hover:border-white/10'
              }`}
              style={isToday ? { background: 'rgba(244, 63, 94, 0.12)' } : {}}
              onClick={() => onClickDay(day)}>
              <span className={`text-[11px] leading-none mb-[2px] ${
                isToday ? 'text-rose-300 font-bold' : 'text-slate-300 font-semibold'
              }`} style={{ fontVariantNumeric: 'tabular-nums' }}>{day}</span>
              {dayEvents.slice(0, 2).map((ev, j) => (
                <div key={j} className="group/ev relative text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]"
                  style={{ background: `${ev.color}22`, color: ev.color, border: `1px solid ${ev.color}44` }}>
                  {ev.label}
                  {(ev.kind === 'meeting' || (ev.kind === 'task' && onDeleteEvent)) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (ev.kind === 'meeting') onRemoveMeeting(ev.id!); else onDeleteEvent!(ev.ev!) }}
                      className="absolute right-0 top-0 bottom-0 px-0.5 hidden group-hover/ev:flex items-center bg-black/40 text-white/70 hover:text-rose-300"
                      title="Delete">
                      <IconX size={9} />
                    </button>
                  )}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] bg-white/5 text-slate-500">+{dayEvents.length - 2}</div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ─── Week View ─── */
function WeekView({ today, deadlineEvents, customMeetings, month, year, onRemoveMeeting, onDeleteEvent }: {
  today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[]
  customMeetings: CustomMeeting[]; month: number; year: number
  onRemoveMeeting: (id: string) => void; onDeleteEvent?: (ev: DeadlineEvent) => void
}) {
  const cols = (() => {
    const result: { name: string; day: number; dateStr: string; month: number; year: number }[] = []
    const base = new Date(today.y, today.m, today.d)
    const dayOfWeek = base.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(base.getDate() + mondayOffset + i)
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      result.push({
        name: names[i], day: d.getDate(),
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        month: d.getMonth(), year: d.getFullYear(),
      })
    }
    return result
  })()

  return (
    <div className="grid grid-cols-7 gap-1">
      {cols.map(c => {
        const isToday = c.day === today.d && c.month === today.m
        const regularEvents = (WEEK_EVENTS[c.day] || []).map(e => ({ label: e.label, color: e.color, time: e.time, kind: 'static' as const }))
        // Dedupe by label (render-level safety net) and keep the source event.
        const seenLabels = new Set<string>()
        const taskEvents = deadlineEvents.filter(e => {
          if (e.date !== c.dateStr) return false
          const key = e.label.replace(/^🔄\s*/, '')
          if (seenLabels.has(key)) return false
          seenLabels.add(key); return true
        }).map(e => ({
          label: e.label, color: e.color,
          time: e.hour !== undefined ? fmtTimeRange(e.hour, e.minute ?? 0, e.durationMin) : 'All day',
          kind: 'task' as const, ev: e,
        }))
        const meetingEvents = customMeetings
          .filter(m => m.day === c.day && m.month === c.month && m.year === c.year && !m.done)
          .map(m => ({ label: m.label, color: m.color, time: m.time ? fmtTimeRange(parseInt(m.time.split(':')[0]), parseInt(m.time.split(':')[1] || '0'), m.durationMin) : 'All day', kind: 'meeting' as const, id: m.id }))
        const events = [...regularEvents, ...taskEvents, ...meetingEvents]

        return (
          <div key={c.day} className={`rounded-lg p-1.5 min-h-[92px] flex flex-col gap-1 border overflow-hidden ${
            isToday ? 'border-rose-400/60' : 'border-white/5 bg-white/[0.02]'
          }`} style={isToday ? { background: 'rgba(244, 63, 94, 0.10)' } : {}}>
            <div className="text-center mb-1">
              <div className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${isToday ? 'text-rose-300' : 'text-slate-500'}`}>{c.name}</div>
              <div style={{ ...({ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 700, letterSpacing: '-0.025em' }), fontSize: '18px', fontVariantNumeric: 'tabular-nums' }}
                className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 leading-none ${
                  isToday ? 'text-rose-300' : 'text-white'
                }`}>{c.day}</div>
            </div>
            {events.map((ev, i) => (
              <div key={i} className="group/ev relative rounded-[5px] px-1.5 py-1"
                style={{ background: `${ev.color}22`, borderLeft: `2px solid ${ev.color}`, boxShadow: `0 0 8px ${ev.color}33` }}>
                <div className="text-[9.5px] font-bold" style={{ color: ev.color, fontVariantNumeric: 'tabular-nums' }}>{ev.time}</div>
                <div className="text-[10px] font-semibold leading-[1.25] text-slate-200 mt-px overflow-hidden"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                  {ev.label}
                </div>
                {((ev as any).kind === 'meeting' || ((ev as any).kind === 'task' && onDeleteEvent)) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if ((ev as any).kind === 'meeting') onRemoveMeeting((ev as any).id); else onDeleteEvent!((ev as any).ev) }}
                    className="absolute right-0.5 top-0.5 hidden group-hover/ev:flex items-center justify-center w-4 h-4 rounded bg-black/40 text-white/70 hover:text-rose-300"
                    title="Delete">
                    <IconX size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Day View ─── */
function DayView({ today, deadlineEvents, customMeetings, month, year, onRemoveMeeting, onDeleteEvent }: {
  today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[]
  customMeetings: CustomMeeting[]; month: number; year: number
  onRemoveMeeting: (id: string) => void; onDeleteEvent?: (ev: DeadlineEvent) => void
}) {
  const dateStr = new Date(today.y, today.m, today.d).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
  const todayStr = `${today.y}-${String(today.m + 1).padStart(2, '0')}-${String(today.d).padStart(2, '0')}`
  // Dedupe by label across all-day + timed (render-level safety net).
  const seenLabels = new Set<string>()
  const dedupe = (e: DeadlineEvent) => {
    const key = e.label.replace(/^🔄\s*/, '')
    if (seenLabels.has(key)) return false
    seenLabels.add(key); return true
  }
  const timedDeadlines = deadlineEvents.filter(e => e.date === todayStr && e.hour !== undefined).filter(dedupe)
  const allDayEvents = deadlineEvents.filter(e => e.date === todayStr && e.hour === undefined).filter(dedupe)

  const todayMeetings = customMeetings.filter(m =>
    m.day === today.d && m.month === today.m && m.year === today.y && !m.done
  )
  const allDayMeetings = todayMeetings.filter(m => !m.time)
  const timedMeetings = todayMeetings.filter(m => m.time)

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 700, letterSpacing: '-0.025em', fontSize: '20px', color: '#ffffff' }}>{dateStr}</span>
        <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#fb7185' }}>Today</span>
      </div>

      {(allDayEvents.length > 0 || allDayMeetings.length > 0) && (
        <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 4 }}>All day</div>
          {[
            ...allDayEvents.map(e => ({ label: e.label, color: e.color, kind: 'task' as const, ev: e })),
            ...allDayMeetings.map(m => ({ label: m.label, color: m.color, kind: 'meeting' as const, id: m.id })),
          ].map((ev, i) => (
            <div key={i} className="group/ev relative" style={{
              background: `${ev.color}22`, borderLeft: `2.5px solid ${ev.color}`,
              borderRadius: '0 6px 6px 0', padding: '4px 8px', marginBottom: 2,
              boxShadow: `0 0 12px ${ev.color}33`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: ev.color }}>{ev.label}</span>
              {(ev.kind === 'meeting' || (ev.kind === 'task' && onDeleteEvent)) && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (ev.kind === 'meeting') onRemoveMeeting(ev.id!); else onDeleteEvent!(ev.ev!) }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/ev:flex items-center justify-center w-4 h-4 rounded bg-black/40 text-white/70 hover:text-rose-300"
                  title="Delete">
                  <IconX size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {Array.from({ length: 11 }).map((_, i) => {
        const hour = i + 8
        const staticEvents = DAY_EVENTS.filter(e => e.hour === hour)
        const deadlineAtHour = timedDeadlines.filter(e => e.hour === hour)
          .map(e => ({ label: e.label, color: e.color, hour, end: hour + 1, timeLabel: `${hour.toString().padStart(2, '0')}:${(e.minute ?? 0).toString().padStart(2, '0')}`, endLabel: e.durationMin ? fmtTimeRange(hour, e.minute ?? 0, e.durationMin).split('–')[1] : `${(hour + 1).toString().padStart(2, '0')}:00`, kind: 'task' as const, ev: e }))
        const meetingAtHour = timedMeetings
          .filter(m => m.time && parseInt(m.time.split(':')[0]) === hour)
          .map(m => ({ label: m.label, color: m.color, hour, end: hour + 1, timeLabel: m.time!, endLabel: m.durationMin ? fmtTimeRange(hour, parseInt(m.time!.split(':')[1] || '0'), m.durationMin).split('–')[1] : `${(hour + 1).toString().padStart(2, '0')}:00`, kind: 'meeting' as const, id: m.id }))
        const events = [
          ...staticEvents.map(e => ({ ...e, timeLabel: `${e.hour.toString().padStart(2, '0')}:00`, endLabel: `${(e.hour + 1).toString().padStart(2, '0')}:00`, kind: 'static' as const })),
          ...deadlineAtHour,
          ...meetingAtHour,
        ]
        const isNow = hour === new Date().getHours()
        const hasContent = events.length > 0 || isNow

        return (
          <div key={hour} className="flex items-start gap-2 transition-all"
            style={{ minHeight: hasContent ? '40px' : '10px', opacity: hasContent ? 1 : 0.35 }}>
            <span className={`text-[10.5px] font-semibold w-[34px] flex-shrink-0 pt-[3px] text-right ${
              isNow ? 'text-rose-400' : 'text-slate-600'
            }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div className="flex-1 pt-[3px]" style={{
              borderTop: `1px solid ${isNow ? 'rgba(251, 113, 133, 0.4)' : 'rgba(255,255,255,0.05)'}`,
            }}>
              {isNow && <div className="h-0.5 rounded-sm mb-1" style={{ background: '#fb7185', boxShadow: '0 0 8px #fb7185' }} />}
              {events.map((ev, j) => (
                <div key={j} className="group/ev relative rounded-r-md px-2 py-1 mb-1"
                  style={{ background: `${ev.color}22`, borderLeft: `2.5px solid ${ev.color}`, boxShadow: `0 0 12px ${ev.color}33` }}>
                  <div className="text-[12px] font-bold" style={{ color: ev.color }}>{ev.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {ev.timeLabel} — {(ev as any).endLabel}
                  </div>
                  {((ev as any).kind === 'meeting' || ((ev as any).kind === 'task' && onDeleteEvent)) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if ((ev as any).kind === 'meeting') onRemoveMeeting((ev as any).id); else onDeleteEvent!((ev as any).ev) }}
                      className="absolute right-1 top-1 hidden group-hover/ev:flex items-center justify-center w-4 h-4 rounded bg-black/40 text-white/70 hover:text-rose-300"
                      title="Delete">
                      <IconX size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}
