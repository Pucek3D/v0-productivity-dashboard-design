'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  MONTH_EVENTS, WEEK_EVENTS, DAY_EVENTS,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth
} from '@/lib/data'
import { IconPlus, IconX, IconCalendar, IconMapPin, IconLink, IconNotes, IconPaperclip } from '@tabler/icons-react'
import type { DeadlineEvent } from '@/lib/task-meta'
import { ScrollWheel, HOUR_ITEMS, MINUTE_ITEMS } from './task-actions'

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
interface MeetingFile {
  name: string
  url: string
}

interface CustomMeeting {
  id: string
  day: number
  month: number
  year: number
  label: string
  color: string
  time?: string
  durationMin?: number
  location?: string
  link?: string
  notes?: string
  files?: MeetingFile[]
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
  const [showTimePicker, setShowTimePicker] = useState(false)
  const timeBtnRef = useRef<HTMLButtonElement>(null)
  const [newMeetingLocation, setNewMeetingLocation] = useState('')
  const [newMeetingLink, setNewMeetingLink] = useState('')
  const [newMeetingNotes, setNewMeetingNotes] = useState('')
  const [newMeetingFiles, setNewMeetingFiles] = useState<MeetingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [openMeetingId, setOpenMeetingId] = useState<string | null>(null)

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
      location: newMeetingLocation.trim() || undefined,
      link: newMeetingLink.trim() || undefined,
      notes: newMeetingNotes.trim() || undefined,
      files: newMeetingFiles.length ? newMeetingFiles : undefined,
    }])
    setNewMeetingText('')
    setNewMeetingTime('')
    setNewMeetingDuration(30)
    setCustomDur('')
    setNewMeetingLocation('')
    setNewMeetingLink('')
    setNewMeetingNotes('')
    setNewMeetingFiles([])
    setShowAddForm(null)
  }

  const removeMeeting = (id: string) => {
    setCustomMeetings(prev => prev.filter(m => m.id !== id))
  }

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const added = Array.from(list).map(f => ({ name: f.name, url: URL.createObjectURL(f) }))
    setNewMeetingFiles(prev => [...prev, ...added])
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
            <button ref={timeBtnRef} onClick={() => setShowTimePicker(true)}
              style={{
                minWidth: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', outline: 'none',
                color: '#fff', fontVariantNumeric: 'tabular-nums',
              }}>
              <IconCalendar size={12} />
              {MONTH_NAMES[month].slice(0, 3)} {showAddForm.day}{newMeetingTime ? ` · ${newMeetingTime}` : ''}
            </button>
            <div className="flex gap-1 items-center">
              {MEETING_COLORS.map(c => (
                <button key={c} onClick={() => setNewMeetingColor(c)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
                    background: `${c}22`,
                    border: newMeetingColor === c ? `1.5px solid ${c}` : `1px solid ${c}44`,
                    boxShadow: newMeetingColor === c ? `0 0 8px ${c}66` : 'none',
                  }} />
              ))}
            </div>
          </div>
          {showTimePicker && timeBtnRef.current && (
            <TimePickerPopover
              anchor={timeBtnRef.current.getBoundingClientRect()}
              month={month}
              year={year}
              today={today}
              day={showAddForm.day}
              hour={newMeetingTime ? parseInt(newMeetingTime.split(':')[0]) : 9}
              minute={newMeetingTime ? parseInt(newMeetingTime.split(':')[1] || '0') : 0}
              onSelect={(d, h, mi) => { setShowAddForm({ day: d }); setNewMeetingTime(`${h.toString().padStart(2, '0')}:${mi.toString().padStart(2, '0')}`); setShowTimePicker(false) }}
              onClear={() => { setNewMeetingTime(''); setShowTimePicker(false) }}
              onClose={() => setShowTimePicker(false)}
            />
          )}
          {/* Duration picker */}
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
              {newMeetingTime && (
                <span style={{ fontSize: 9, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTimeRange(parseInt(newMeetingTime.split(':')[0]), parseInt(newMeetingTime.split(':')[1] || '0'), newMeetingDuration)}
                </span>
              )}
            </div>
          </div>
          {/* Location / link / notes / files */}
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0 8px' }}>
              <IconMapPin size={12} color="#64748b" />
              <input value={newMeetingLocation} onChange={e => setNewMeetingLocation(e.target.value)}
                placeholder="Add location"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '5px 0', fontSize: 10, color: '#fff', outline: 'none' }} />
              {newMeetingLocation.trim() && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newMeetingLocation.trim())}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 8, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
                  Map
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0 8px' }}>
              <IconLink size={12} color="#64748b" />
              <input value={newMeetingLink} onChange={e => setNewMeetingLink(e.target.value)}
                placeholder="Add meeting link (Zoom, Meet…)"
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '5px 0', fontSize: 10, color: '#fff', outline: 'none' }} />
            </div>
            <div className="flex items-start gap-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0 8px' }}>
              <IconNotes size={12} color="#64748b" style={{ marginTop: 6 }} />
              <textarea value={newMeetingNotes} onChange={e => setNewMeetingNotes(e.target.value)}
                placeholder="Notes…" rows={2}
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '5px 0', fontSize: 10, color: '#fff', outline: 'none', resize: 'none' }} />
            </div>
            <div>
              <input ref={fileInputRef} type="file" multiple hidden onChange={e => handleFiles(e.target.files)} />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 6, padding: '5px 8px', fontSize: 10, color: '#94a3b8', cursor: 'pointer', width: '100%' }}>
                <IconPaperclip size={12} />
                Attach files
              </button>
              {newMeetingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {newMeetingFiles.map((f, i) => (
                    <span key={i} className="flex items-center gap-1"
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 5, padding: '2px 6px', fontSize: 9, color: '#a5b4fc', maxWidth: 120 }}>
                      <span className="truncate">{f.name}</span>
                      <button onClick={() => setNewMeetingFiles(prev => prev.filter((_, j) => j !== i))}
                        style={{ color: '#818cf8', display: 'flex' }}>
                        <IconX size={9} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Add button — full width, transparent */}
          <button onClick={() => addMeeting(showAddForm.day)}
            style={{
              width: '100%', marginTop: 10, padding: '7px 0', borderRadius: 7, cursor: 'pointer',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
            }}>
            Add meeting
          </button>
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
          onClickDay={(day) => setShowAddForm({ day })} onOpenMeeting={setOpenMeetingId}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent} />}
        {view === 'w' && <WeekView today={today} deadlineEvents={activeDeadlineEvents}
          customMeetings={customMeetings} month={month} year={year} onOpenMeeting={setOpenMeetingId}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent} />}
        {view === 'd' && <DayView today={today} deadlineEvents={activeDeadlineEvents}
          customMeetings={customMeetings} month={month} year={year} onOpenMeeting={setOpenMeetingId}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent} />}
      </div>
      {openMeetingId && (() => {
        const m = customMeetings.find(mm => mm.id === openMeetingId)
        if (!m) return null
        return <MeetingDetail meeting={m} monthName={MONTH_NAMES[m.month]} onClose={() => setOpenMeetingId(null)} />
      })()}
    </div>
  )
}

/* ─── Month View ─── */
function MonthView({ month, year, today, deadlineEvents, customMeetings, onClickDay, onOpenMeeting, onRemoveMeeting, onDeleteEvent }: {
  month: number; year: number; today: { d: number; m: number; y: number }
  deadlineEvents: DeadlineEvent[]; customMeetings: CustomMeeting[]
  onClickDay: (day: number) => void; onOpenMeeting: (id: string) => void; onRemoveMeeting: (id: string) => void
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
            .map(m => ({ label: m.label, color: m.color, kind: 'meeting' as const, id: m.id, hasDetails: !!(m.location || m.link || m.notes || m.files?.length) }))
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
                  style={{ background: `${ev.color}22`, color: ev.color, border: `1px solid ${ev.color}44`, cursor: (ev as any).kind === 'meeting' ? 'pointer' : undefined }}
                  onClick={(ev as any).kind === 'meeting' ? (e) => { e.stopPropagation(); onOpenMeeting((ev as any).id) } : undefined}>
                  {(ev as any).hasDetails && <span style={{ marginRight: 2 }}>•</span>}
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
function WeekView({ today, deadlineEvents, customMeetings, month, year, onOpenMeeting, onRemoveMeeting, onDeleteEvent }: {
  today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[]
  customMeetings: CustomMeeting[]; month: number; year: number
  onOpenMeeting: (id: string) => void; onRemoveMeeting: (id: string) => void; onDeleteEvent?: (ev: DeadlineEvent) => void
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
          .map(m => ({ label: m.label, color: m.color, time: m.time ? fmtTimeRange(parseInt(m.time.split(':')[0]), parseInt(m.time.split(':')[1] || '0'), m.durationMin) : 'All day', kind: 'meeting' as const, id: m.id, hasDetails: !!(m.location || m.link || m.notes || m.files?.length) }))
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
                style={{ background: `${ev.color}22`, borderLeft: `2px solid ${ev.color}`, boxShadow: `0 0 8px ${ev.color}33`, cursor: (ev as any).kind === 'meeting' ? 'pointer' : undefined }}
                onClick={(ev as any).kind === 'meeting' ? (e) => { e.stopPropagation(); onOpenMeeting((ev as any).id) } : undefined}>
                <div className="text-[9.5px] font-bold" style={{ color: ev.color, fontVariantNumeric: 'tabular-nums' }}>{ev.time}</div>
                <div className="text-[10px] font-semibold leading-[1.25] text-slate-200 mt-px overflow-hidden"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                  {(ev as any).hasDetails && <span style={{ color: ev.color, marginRight: 2 }}>•</span>}
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
function DayView({ today, deadlineEvents, customMeetings, month, year, onOpenMeeting, onRemoveMeeting, onDeleteEvent }: {
  today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[]
  customMeetings: CustomMeeting[]; month: number; year: number
  onOpenMeeting: (id: string) => void; onRemoveMeeting: (id: string) => void; onDeleteEvent?: (ev: DeadlineEvent) => void
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
            ...allDayMeetings.map(m => ({ label: m.label, color: m.color, kind: 'meeting' as const, id: m.id, hasDetails: !!(m.location || m.link || m.notes || m.files?.length) })),
          ].map((ev, i) => (
            <div key={i} className="group/ev relative" style={{
              background: `${ev.color}22`, borderLeft: `2.5px solid ${ev.color}`,
              borderRadius: '0 6px 6px 0', padding: '4px 8px', marginBottom: 2,
              boxShadow: `0 0 12px ${ev.color}33`, cursor: (ev as any).kind === 'meeting' ? 'pointer' : undefined,
            }}
            onClick={(ev as any).kind === 'meeting' ? (e) => { e.stopPropagation(); onOpenMeeting((ev as any).id) } : undefined}>
              <span style={{ fontSize: 11, fontWeight: 600, color: ev.color }}>
                {(ev as any).hasDetails && <span style={{ marginRight: 3 }}>•</span>}
                {ev.label}
              </span>
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
          .map(m => ({ label: m.label, color: m.color, hour, end: hour + 1, timeLabel: m.time!, endLabel: m.durationMin ? fmtTimeRange(hour, parseInt(m.time!.split(':')[1] || '0'), m.durationMin).split('–')[1] : `${(hour + 1).toString().padStart(2, '0')}:00`, kind: 'meeting' as const, id: m.id, hasDetails: !!(m.location || m.link || m.notes || m.files?.length) }))
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
                  style={{ background: `${ev.color}22`, borderLeft: `2.5px solid ${ev.color}`, boxShadow: `0 0 12px ${ev.color}33`, cursor: (ev as any).kind === 'meeting' ? 'pointer' : undefined }}
                  onClick={(ev as any).kind === 'meeting' ? (e) => { e.stopPropagation(); onOpenMeeting((ev as any).id) } : undefined}>
                  <div className="text-[12px] font-bold" style={{ color: ev.color }}>
                    {(ev as any).hasDetails && <span style={{ marginRight: 3 }}>•</span>}
                    {ev.label}
                  </div>
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

/* ── Date + Time Picker Popover (matches the task date/time picker styling) ── */
function TimePickerPopover({ anchor, month, year, today, day: initDay, hour: initHour, minute: initMinute, onSelect, onClear, onClose }: {
  anchor: DOMRect
  month: number
  year: number
  today: { d: number; m: number; y: number }
  day: number
  hour: number
  minute: number
  onSelect: (day: number, h: number, min: number) => void
  onClear: () => void
  onClose: () => void
}) {
  const [day, setDay] = useState(initDay)
  const [hour, setHour] = useState(initHour)
  const [minute, setMinute] = useState(initMinute)

  const daysInMonth = getDaysInMonth(month, year)
  const firstDay = getFirstDayOfMonth(month, year)

  const top = Math.min(anchor.bottom + 6, window.innerHeight - 360)
  const left = Math.max(8, Math.min(anchor.left - 30, window.innerWidth - 230))

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: 'fixed', zIndex: 9999, top, left, width: 220,
        background: '#131c2e', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12, padding: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      }}>
        {/* Date grid */}
        <div style={{ fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>
          {MONTH_NAMES[month]} {year}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map(dn => (
            <div key={dn} style={{ fontSize: 8, fontWeight: 600, color: '#475569', textAlign: 'center' }}>{dn.slice(0, 1)}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1
            const isSelected = day === d
            const isToday = d === today.d && month === today.m && year === today.y
            return (
              <button key={d} onClick={() => setDay(d)} style={{
                aspectRatio: '1', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: isSelected ? 700 : 500,
                background: isSelected ? '#6366f1' : 'transparent',
                color: isSelected ? '#fff' : isToday ? '#fb7185' : '#94a3b8',
              }}>{d}</button>
            )
          })}
        </div>
        {/* Time wheels */}
        <div style={{ fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '10px 0 8px', textAlign: 'center' }}>
          Start time
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <ScrollWheel items={HOUR_ITEMS} value={hour} onChange={setHour} width={60} />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#475569', lineHeight: 1 }}>:</span>
          <ScrollWheel items={MINUTE_ITEMS} value={minute} onChange={setMinute} width={60} />
        </div>
        <button onClick={() => onSelect(day, hour, minute)} style={{
          width: '100%', padding: '6px 0', borderRadius: 6, cursor: 'pointer',
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          marginTop: 10, background: '#6366f1', color: '#fff', border: 'none',
          boxShadow: '0 0 12px rgba(99,102,241,0.4)',
        }}>
          Set {MONTH_NAMES[month].slice(0, 3)} {day} · {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clear time</button>
        </div>
      </div>
    </>,
    document.body
  )
}

/* ── Meeting Detail Modal (location, link, notes, files) ── */
function MeetingDetail({ meeting, monthName, onClose }: {
  meeting: CustomMeeting
  monthName: string
  onClose: () => void
}) {
  const timeLabel = meeting.time
    ? fmtTimeRange(parseInt(meeting.time.split(':')[0]), parseInt(meeting.time.split(':')[1] || '0'), meeting.durationMin)
    : 'All day'

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 340,
        background: '#131c2e', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 14, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, color: '#64748b', cursor: 'pointer', display: 'flex' }}>
          <IconX size={16} />
        </button>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: `${meeting.color}33`, border: `1px solid ${meeting.color}` }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{meeting.label}</span>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', marginBottom: 14 }}>
          {monthName} {meeting.day} · {timeLabel}
        </div>

        <div className="flex flex-col gap-2.5">
          {meeting.location && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.location)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', textDecoration: 'none' }}>
              <IconMapPin size={15} color="#818cf8" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0' }}>{meeting.location}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Open map</span>
            </a>
          )}
          {meeting.link && (
            <a href={meeting.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', textDecoration: 'none' }}>
              <IconLink size={15} color="#2dd4bf" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.link}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Join</span>
            </a>
          )}
          {meeting.notes && (
            <div className="flex items-start gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
              <IconNotes size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1, fontSize: 12, color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{meeting.notes}</span>
            </div>
          )}
          {meeting.files && meeting.files.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
              <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                <IconPaperclip size={14} color="#fb7185" />
                <span style={{ fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Files</span>
              </div>
              <div className="flex flex-col gap-1">
                {meeting.files.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" download={f.name}
                    style={{ fontSize: 11, color: '#a5b4fc', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          {!meeting.location && !meeting.link && !meeting.notes && !(meeting.files && meeting.files.length) && (
            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: '8px 0' }}>No additional details.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
