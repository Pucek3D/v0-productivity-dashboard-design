'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  MONTH_EVENTS, WEEK_EVENTS, DAY_EVENTS,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth
} from '@/lib/data'
import { IconPlus, IconX, IconCalendar, IconMapPin, IconLink, IconNotes, IconPaperclip } from '@tabler/icons-react'
import type { DeadlineEvent, TaskMeta } from '@/lib/task-meta'
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
  lat?: number
  lon?: number
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
  onUpdateEvent?: (ev: DeadlineEvent, changes: Partial<TaskMeta>) => void
}

/* unified edit-modal target — used for both custom meetings and task events */
interface EditState {
  kind: 'meeting' | 'event'
  meetingId?: string
  event?: DeadlineEvent
  label: string
  day: number; month: number; year: number
  time: string            // 'HH:MM' or ''
  durationMin: number
  color: string
  location: string
  coords: { lat: number; lon: number } | null
  link: string
  notes: string
  files: MeetingFile[]
}

const pad2 = (n: number) => n.toString().padStart(2, '0')

export function EventCalendar({ deadlineEvents = [], completedTasks, onDeleteEvent, onUpdateEvent }: EventCalendarProps) {
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
  const [newMeetingCoords, setNewMeetingCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [newMeetingLink, setNewMeetingLink] = useState('')
  const [newMeetingNotes, setNewMeetingNotes] = useState('')
  const [newMeetingFiles, setNewMeetingFiles] = useState<MeetingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  // active drag payload (HTML5 DnD) — identifies what is being moved
  const dragItem = useRef<{ kind: 'meeting' | 'event'; id?: string; ev?: DeadlineEvent } | null>(null)

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
      lat: newMeetingCoords?.lat,
      lon: newMeetingCoords?.lon,
      link: newMeetingLink.trim() || undefined,
      notes: newMeetingNotes.trim() || undefined,
      files: newMeetingFiles.length ? newMeetingFiles : undefined,
    }])
    setNewMeetingText('')
    setNewMeetingTime('')
    setNewMeetingDuration(30)
    setCustomDur('')
    setNewMeetingLocation('')
    setNewMeetingCoords(null)
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

  // ── open the add form, optionally prefilled for a specific day/time ──
  const openAddForm = (day: number, m: number, y: number, time?: string) => {
    setMonth(m); setYear(y)
    setNewMeetingText(''); setNewMeetingTime(time || ''); setNewMeetingColor('#818cf8')
    setNewMeetingDuration(30); setCustomDur('')
    setNewMeetingLocation(''); setNewMeetingCoords(null)
    setNewMeetingLink(''); setNewMeetingNotes(''); setNewMeetingFiles([])
    setShowAddForm({ day })
  }

  // ── open the edit modal for an existing custom meeting ──
  const openMeetingEdit = (m: CustomMeeting) => setEditState({
    kind: 'meeting', meetingId: m.id, label: m.label,
    day: m.day, month: m.month, year: m.year,
    time: m.time || '', durationMin: m.durationMin || 30, color: m.color,
    location: m.location || '', coords: (m.lat != null && m.lon != null) ? { lat: m.lat, lon: m.lon } : null,
    link: m.link || '', notes: m.notes || '', files: m.files || [],
  })

  // ── open the edit modal for a task-derived event ──
  const openEventEdit = (ev: DeadlineEvent) => {
    const d = new Date(ev.date + 'T00:00')
    setEditState({
      kind: 'event', event: ev, label: ev.label.replace(/^🔄\s*/, ''),
      day: d.getDate(), month: d.getMonth(), year: d.getFullYear(),
      time: ev.hour !== undefined ? `${pad2(ev.hour)}:${pad2(ev.minute ?? 0)}` : '',
      durationMin: ev.durationMin || 30, color: ev.color,
      location: ev.location || '', coords: (ev.lat != null && ev.lon != null) ? { lat: ev.lat, lon: ev.lon } : null,
      link: ev.link || '', notes: ev.notes || '', files: ev.files || [],
    })
  }

  // ── persist edits from the modal ──
  const saveEdit = (s: EditState) => {
    const hour = s.time ? parseInt(s.time.split(':')[0]) : undefined
    const minute = s.time ? parseInt(s.time.split(':')[1] || '0') : undefined
    if (s.kind === 'meeting' && s.meetingId) {
      setCustomMeetings(prev => prev.map(m => m.id === s.meetingId ? {
        ...m, label: s.label.trim() || m.label, day: s.day, month: s.month, year: s.year,
        color: s.color, time: s.time || undefined, durationMin: s.time ? s.durationMin : undefined,
        location: s.location.trim() || undefined, lat: s.coords?.lat, lon: s.coords?.lon,
        link: s.link.trim() || undefined, notes: s.notes.trim() || undefined,
        files: s.files.length ? s.files : undefined,
      } : m))
    } else if (s.kind === 'event' && s.event && onUpdateEvent) {
      onUpdateEvent(s.event, {
        deadline: `${s.year}-${pad2(s.month + 1)}-${pad2(s.day)}`,
        hour, minute, durationMin: s.time ? s.durationMin : undefined,
        location: s.location.trim() || undefined, lat: s.coords?.lat, lon: s.coords?.lon,
        link: s.link.trim() || undefined, notes: s.notes.trim() || undefined,
        files: s.files.length ? s.files : undefined, color: s.color, label: s.label.trim(),
      })
    }
    setEditState(null)
  }

  const deleteEdit = (s: EditState) => {
    if (s.kind === 'meeting' && s.meetingId) removeMeeting(s.meetingId)
    else if (s.kind === 'event' && s.event && onDeleteEvent) onDeleteEvent(s.event)
    setEditState(null)
  }

  // ── reschedule helpers (used by drag & drop and day-view resize) ──
  const rescheduleMeeting = (id: string, p: { day: number; month: number; year: number; time?: string | null; durationMin?: number }) => {
    setCustomMeetings(prev => prev.map(m => {
      if (m.id !== id) return m
      const next = { ...m, day: p.day, month: p.month, year: p.year }
      if (p.time !== undefined) {
        next.time = p.time || undefined
        next.durationMin = p.time ? (p.durationMin ?? m.durationMin ?? 30) : undefined
      } else if (p.durationMin !== undefined) {
        next.durationMin = p.durationMin
      }
      return next
    }))
  }
  const rescheduleEvent = (ev: DeadlineEvent, p: { date?: string; hour?: number | null; minute?: number; durationMin?: number }) => {
    if (!onUpdateEvent) return
    const changes: Partial<TaskMeta> = {}
    if (p.date) changes.deadline = p.date
    if (p.hour !== undefined) { changes.hour = p.hour === null ? undefined : p.hour; changes.minute = p.hour === null ? undefined : (p.minute ?? 0) }
    if (p.durationMin !== undefined) changes.durationMin = p.durationMin
    onUpdateEvent(ev, changes)
  }

  // ── drag & drop wiring ──
  const beginDrag = (payload: { kind: 'meeting' | 'event'; id?: string; ev?: DeadlineEvent }) => { dragItem.current = payload }
  const dropOnDay = (day: number, m: number, y: number) => {
    const it = dragItem.current; if (!it) return
    if (it.kind === 'meeting' && it.id) rescheduleMeeting(it.id, { day, month: m, year: y })
    else if (it.kind === 'event' && it.ev) rescheduleEvent(it.ev, { date: `${y}-${pad2(m + 1)}-${pad2(day)}` })
    dragItem.current = null
  }
  const dropOnHour = (day: number, m: number, y: number, hour: number) => {
    const it = dragItem.current; if (!it) return
    if (it.kind === 'meeting' && it.id) rescheduleMeeting(it.id, { day, month: m, year: y, time: `${pad2(hour)}:00` })
    else if (it.kind === 'event' && it.ev) rescheduleEvent(it.ev, { date: `${y}-${pad2(m + 1)}-${pad2(day)}`, hour, minute: 0 })
    dragItem.current = null
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
          {/* Duration picker + location */}
          <div className="mt-1.5">
            <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Duration & location</div>
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
              <div style={{ flex: '1 1 150px', minWidth: 150 }}>
                <LocationAutocomplete
                  value={newMeetingLocation}
                  onChange={(v) => { setNewMeetingLocation(v); setNewMeetingCoords(null) }}
                  onSelect={(name, lat, lon) => { setNewMeetingLocation(name); setNewMeetingCoords({ lat, lon }) }}
                  hasCoords={!!newMeetingCoords}
                  coords={newMeetingCoords}
                />
              </div>
            </div>
          </div>
          {/* Link / notes / files */}
          <div className="mt-2 flex flex-col gap-1.5">
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
          {/* Add button — solid indigo, matches the time picker's Set button */}
          <button onClick={() => addMeeting(showAddForm.day)}
            style={{
              width: '100%', marginTop: 10, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              background: '#6366f1', color: '#fff', border: 'none',
              boxShadow: '0 0 12px rgba(99,102,241,0.4)',
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
          onClickDay={(day) => openAddForm(day, month, year)}
          onOpenMeeting={(id) => { const m = customMeetings.find(mm => mm.id === id); if (m) openMeetingEdit(m) }}
          onOpenEvent={openEventEdit}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent}
          beginDrag={beginDrag} dropOnDay={dropOnDay} />}
        {view === 'w' && <WeekView today={today} deadlineEvents={activeDeadlineEvents}
          customMeetings={customMeetings} month={month} year={year}
          onOpenMeeting={(id) => { const m = customMeetings.find(mm => mm.id === id); if (m) openMeetingEdit(m) }}
          onOpenEvent={openEventEdit} onAddAt={openAddForm}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent}
          beginDrag={beginDrag} dropOnDay={dropOnDay} />}
        {view === 'd' && <DayView today={today} deadlineEvents={activeDeadlineEvents}
          customMeetings={customMeetings} month={month} year={year}
          onOpenMeeting={(id) => { const m = customMeetings.find(mm => mm.id === id); if (m) openMeetingEdit(m) }}
          onOpenEvent={openEventEdit} onAddAt={openAddForm}
          onRemoveMeeting={removeMeeting} onDeleteEvent={onDeleteEvent}
          beginDrag={beginDrag} dropOnHour={dropOnHour}
          rescheduleMeeting={rescheduleMeeting} rescheduleEvent={rescheduleEvent} />}
      </div>
      {editState && (
        <MeetingEditModal
          state={editState}
          today={today}
          onChange={setEditState}
          onSave={() => saveEdit(editState)}
          onDelete={() => deleteEdit(editState)}
          onClose={() => setEditState(null)}
        />
      )}
    </div>
  )
}

/* ─── Month View ─── */
function MonthView({ month, year, today, deadlineEvents, customMeetings, onClickDay, onOpenMeeting, onOpenEvent, onRemoveMeeting, onDeleteEvent, beginDrag, dropOnDay }: {
  month: number; year: number; today: { d: number; m: number; y: number }
  deadlineEvents: DeadlineEvent[]; customMeetings: CustomMeeting[]
  onClickDay: (day: number) => void; onOpenMeeting: (id: string) => void; onOpenEvent: (ev: DeadlineEvent) => void
  onRemoveMeeting: (id: string) => void
  onDeleteEvent?: (ev: DeadlineEvent) => void
  beginDrag: (p: { kind: 'meeting' | 'event'; id?: string; ev?: DeadlineEvent }) => void
  dropOnDay: (day: number, m: number, y: number) => void
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
              onClick={() => onClickDay(day)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); dropOnDay(day, month, year) }}>
              <span className={`text-[11px] leading-none mb-[2px] ${
                isToday ? 'text-rose-300 font-bold' : 'text-slate-300 font-semibold'
              }`} style={{ fontVariantNumeric: 'tabular-nums' }}>{day}</span>
              {dayEvents.slice(0, 2).map((ev, j) => {
                const interactive = (ev as any).kind === 'meeting' || (ev as any).kind === 'task'
                return (
                <div key={j} draggable={interactive}
                  onDragStart={interactive ? (e) => { e.stopPropagation(); beginDrag((ev as any).kind === 'meeting' ? { kind: 'meeting', id: (ev as any).id } : { kind: 'event', ev: (ev as any).ev }) } : undefined}
                  className="group/ev relative text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]"
                  style={{ background: `${ev.color}22`, color: ev.color, border: `1px solid ${ev.color}44`, cursor: interactive ? 'pointer' : undefined }}
                  onClick={interactive ? (e) => { e.stopPropagation(); if ((ev as any).kind === 'meeting') onOpenMeeting((ev as any).id); else onOpenEvent((ev as any).ev) } : undefined}>
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
                )
              })}
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

/* ─── Week View ──��� */
function WeekView({ today, deadlineEvents, customMeetings, month, year, onOpenMeeting, onOpenEvent, onAddAt, onRemoveMeeting, onDeleteEvent, beginDrag, dropOnDay }: {
  today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[]
  customMeetings: CustomMeeting[]; month: number; year: number
  onOpenMeeting: (id: string) => void; onOpenEvent: (ev: DeadlineEvent) => void
  onAddAt: (day: number, m: number, y: number, time?: string) => void
  onRemoveMeeting: (id: string) => void; onDeleteEvent?: (ev: DeadlineEvent) => void
  beginDrag: (p: { kind: 'meeting' | 'event'; id?: string; ev?: DeadlineEvent }) => void
  dropOnDay: (day: number, m: number, y: number) => void
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
          <div key={c.day} className={`rounded-lg p-1.5 min-h-[92px] flex flex-col gap-1 border overflow-hidden cursor-pointer ${
            isToday ? 'border-rose-400/60' : 'border-white/5 bg-white/[0.02]'
          }`} style={isToday ? { background: 'rgba(244, 63, 94, 0.10)' } : {}}
            onClick={() => onAddAt(c.day, c.month, c.year)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); dropOnDay(c.day, c.month, c.year) }}>
            <div className="text-center mb-1">
              <div className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${isToday ? 'text-rose-300' : 'text-slate-500'}`}>{c.name}</div>
              <div style={{ ...({ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', fontWeight: 700, letterSpacing: '-0.025em' }), fontSize: '18px', fontVariantNumeric: 'tabular-nums' }}
                className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 leading-none ${
                  isToday ? 'text-rose-300' : 'text-white'
                }`}>{c.day}</div>
            </div>
            {events.map((ev, i) => {
              const interactive = (ev as any).kind === 'meeting' || (ev as any).kind === 'task'
              return (
              <div key={i} draggable={interactive}
                onDragStart={interactive ? (e) => { e.stopPropagation(); beginDrag((ev as any).kind === 'meeting' ? { kind: 'meeting', id: (ev as any).id } : { kind: 'event', ev: (ev as any).ev }) } : undefined}
                className="group/ev relative rounded-[5px] px-1.5 py-1"
                style={{ background: `${ev.color}22`, borderLeft: `2px solid ${ev.color}`, boxShadow: `0 0 8px ${ev.color}33`, cursor: interactive ? 'pointer' : undefined }}
                onClick={interactive ? (e) => { e.stopPropagation(); if ((ev as any).kind === 'meeting') onOpenMeeting((ev as any).id); else onOpenEvent((ev as any).ev) } : undefined}>
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
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Day View ─── */
function DayView({ today, deadlineEvents, customMeetings, month, year, onOpenMeeting, onOpenEvent, onAddAt, onRemoveMeeting, onDeleteEvent, beginDrag, dropOnHour, rescheduleMeeting, rescheduleEvent }: {
  today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[]
  customMeetings: CustomMeeting[]; month: number; year: number
  onOpenMeeting: (id: string) => void; onOpenEvent: (ev: DeadlineEvent) => void
  onAddAt: (day: number, m: number, y: number, time?: string) => void
  onRemoveMeeting: (id: string) => void; onDeleteEvent?: (ev: DeadlineEvent) => void
  beginDrag: (p: { kind: 'meeting' | 'event'; id?: string; ev?: DeadlineEvent }) => void
  dropOnHour: (day: number, m: number, y: number, hour: number) => void
  rescheduleMeeting: (id: string, p: { day: number; month: number; year: number; time?: string | null; durationMin?: number }) => void
  rescheduleEvent: (ev: DeadlineEvent, p: { date?: string; hour?: number | null; minute?: number; durationMin?: number }) => void
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

  // ── timeline geometry ──
  const START_H = 8, END_H = 19, HOUR_PX = 46
  const TOTAL_MIN = (END_H - START_H) * 60
  const TL_HEIGHT = TOTAL_MIN / 60 * HOUR_PX
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const minToLabel = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`

  // in-progress drag / resize (live preview)
  const [drag, setDrag] = useState<{ key: string; startMin: number; durationMin: number } | null>(null)
  const gesture = useRef<{ mode: 'move' | 'resize-b' | 'resize-t'; kind: 'meeting' | 'event'; id?: string; ev?: DeadlineEvent; startY: number; origStart: number; origDur: number; moved: boolean } | null>(null)
  const live = useRef<{ startMin: number; durationMin: number } | null>(null)

  const startGesture = (e: React.PointerEvent, mode: 'move' | 'resize-b' | 'resize-t', item: { key: string; kind: 'meeting' | 'event'; id?: string; ev?: DeadlineEvent; startMin: number; durationMin: number }) => {
    e.preventDefault(); e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    gesture.current = { mode, kind: item.kind, id: item.id, ev: item.ev, startY: e.clientY, origStart: item.startMin, origDur: item.durationMin, moved: false }
    live.current = { startMin: item.startMin, durationMin: item.durationMin }
    setDrag({ key: item.key, startMin: item.startMin, durationMin: item.durationMin })
  }
  const moveGesture = (e: React.PointerEvent, key: string) => {
    const g = gesture.current; if (!g) return
    const deltaMin = Math.round(((e.clientY - g.startY) / HOUR_PX * 60) / 15) * 15
    if (Math.abs(e.clientY - g.startY) > 3) g.moved = true
    let startMin = g.origStart, durationMin = g.origDur
    if (g.mode === 'move') {
      startMin = clamp(g.origStart + deltaMin, START_H * 60, END_H * 60 - g.origDur)
    } else if (g.mode === 'resize-b') {
      durationMin = clamp(g.origDur + deltaMin, 15, END_H * 60 - g.origStart)
    } else {
      startMin = clamp(g.origStart + deltaMin, START_H * 60, g.origStart + g.origDur - 15)
      durationMin = g.origDur + (g.origStart - startMin)
    }
    live.current = { startMin, durationMin }
    setDrag({ key, startMin, durationMin })
  }
  const endGesture = () => {
    const g = gesture.current, l = live.current
    if (g && l) {
      if (!g.moved) {
        if (g.kind === 'meeting' && g.id) onOpenMeeting(g.id)
        else if (g.kind === 'event' && g.ev) onOpenEvent(g.ev)
      } else {
        const hour = Math.floor(l.startMin / 60), minute = l.startMin % 60
        if (g.kind === 'meeting' && g.id) rescheduleMeeting(g.id, { day: today.d, month: today.m, year: today.y, time: `${pad2(hour)}:${pad2(minute)}`, durationMin: l.durationMin })
        else if (g.kind === 'event' && g.ev) rescheduleEvent(g.ev, { hour, minute, durationMin: l.durationMin })
      }
    }
    gesture.current = null; live.current = null; setDrag(null)
  }

  type TItem = { key: string; kind: 'static' | 'task' | 'meeting'; label: string; color: string; startMin: number; durationMin: number; hasDetails?: boolean; id?: string; ev?: DeadlineEvent }
  const items: TItem[] = [
    ...DAY_EVENTS.filter(e => e.hour >= START_H && e.hour < END_H).map(e => ({ key: `s:${e.hour}:${e.label}`, kind: 'static' as const, label: e.label, color: (e as any).color || '#64748b', startMin: e.hour * 60, durationMin: 60 })),
    ...timedDeadlines.map(e => ({ key: `e:${e.eventId}`, kind: 'task' as const, label: e.label, color: e.color, startMin: (e.hour ?? 0) * 60 + (e.minute ?? 0), durationMin: e.durationMin || 60, hasDetails: !!(e.location || e.link || e.notes || e.files?.length), ev: e })),
    ...timedMeetings.map(m => ({ key: `m:${m.id}`, kind: 'meeting' as const, label: m.label, color: m.color, startMin: parseInt(m.time!.split(':')[0]) * 60 + parseInt(m.time!.split(':')[1] || '0'), durationMin: m.durationMin || 60, hasDetails: !!(m.location || m.link || m.notes || m.files?.length), id: m.id })),
  ].map(it => (drag && drag.key === it.key) ? { ...it, startMin: drag.startMin, durationMin: drag.durationMin } : it)

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const showNow = now.getDate() === today.d && now.getMonth() === today.m && now.getFullYear() === today.y && nowMin >= START_H * 60 && nowMin <= END_H * 60

  const onTimelineClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const raw = START_H * 60 + Math.floor(((e.clientY - rect.top) / HOUR_PX * 60) / 30) * 30
    const min = clamp(raw, START_H * 60, (END_H - 1) * 60)
    onAddAt(today.d, today.m, today.y, `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`)
  }

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
              boxShadow: `0 0 12px ${ev.color}33`, cursor: 'pointer',
            }}
            draggable={(ev as any).kind === 'meeting' || (ev as any).kind === 'task'}
            onDragStart={(e) => { e.stopPropagation(); beginDrag((ev as any).kind === 'meeting' ? { kind: 'meeting', id: (ev as any).id } : { kind: 'event', ev: (ev as any).ev }) }}
            onClick={(e) => { e.stopPropagation(); if ((ev as any).kind === 'meeting') onOpenMeeting((ev as any).id); else onOpenEvent((ev as any).ev) }}>
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

      {/* timed timeline — drag a box to move, drag its top/bottom edge to resize, click empty space to add */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 34, flexShrink: 0, position: 'relative', height: TL_HEIGHT }}>
          {Array.from({ length: END_H - START_H }).map((_, i) => (
            <span key={i} className="text-[10.5px] font-semibold text-slate-600 text-right"
              style={{ position: 'absolute', top: i * HOUR_PX - 6, right: 0, fontVariantNumeric: 'tabular-nums' }}>
              {pad2(START_H + i)}:00
            </span>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, height: TL_HEIGHT, cursor: 'copy' }}
          onClick={onTimelineClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); const h = clamp(START_H + Math.floor((e.clientY - rect.top) / HOUR_PX), START_H, END_H - 1); dropOnHour(today.d, today.m, today.y, h) }}>
          {Array.from({ length: END_H - START_H + 1 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * HOUR_PX, borderTop: '1px solid rgba(255,255,255,0.05)' }} />
          ))}
          {showNow && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: (nowMin - START_H * 60) / 60 * HOUR_PX, height: 2, background: '#fb7185', boxShadow: '0 0 8px #fb7185', borderRadius: 2, zIndex: 5 }} />
          )}
          {items.map(it => {
            const top = (it.startMin - START_H * 60) / 60 * HOUR_PX
            const height = Math.max(it.durationMin, 30) / 60 * HOUR_PX
            const interactive = it.kind === 'meeting' || it.kind === 'task'
            const isDragging = drag?.key === it.key
            const handleItem = { key: it.key, kind: it.kind as 'meeting' | 'event', id: it.id, ev: it.ev, startMin: it.startMin, durationMin: it.durationMin }
            return (
              <div key={it.key}
                onPointerDown={interactive ? (e) => startGesture(e, 'move', handleItem) : undefined}
                onPointerMove={interactive ? (e) => moveGesture(e, it.key) : undefined}
                onPointerUp={interactive ? endGesture : undefined}
                onClick={(e) => e.stopPropagation()}
                className="group/ev"
                style={{
                  position: 'absolute', left: 0, right: 4, top, height: height - 2,
                  background: `${it.color}22`, borderLeft: `2.5px solid ${it.color}`, borderRadius: '0 6px 6px 0',
                  boxShadow: isDragging ? `0 6px 18px ${it.color}66` : `0 0 12px ${it.color}33`,
                  padding: '3px 8px', overflow: 'hidden', cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  zIndex: isDragging ? 10 : 2, touchAction: 'none', userSelect: 'none',
                }}>
                <div className="text-[11.5px] font-bold leading-tight" style={{ color: it.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {it.hasDetails && <span style={{ marginRight: 3 }}>•</span>}
                  {it.label}
                </div>
                <div className="text-[9.5px] text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {minToLabel(it.startMin)}–{minToLabel(it.startMin + it.durationMin)}
                </div>
                {interactive && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); if (it.kind === 'meeting') onRemoveMeeting(it.id!); else if (onDeleteEvent) onDeleteEvent(it.ev!) }}
                    className="absolute right-1 top-1 hidden group-hover/ev:flex items-center justify-center w-4 h-4 rounded bg-black/40 text-white/70 hover:text-rose-300"
                    title="Delete">
                    <IconX size={10} />
                  </button>
                )}
                {interactive && (
                  <>
                    <div onPointerDown={(e) => startGesture(e, 'resize-t', handleItem)} onPointerMove={(e) => moveGesture(e, it.key)} onPointerUp={endGesture}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 7, cursor: 'ns-resize' }} />
                    <div onPointerDown={(e) => startGesture(e, 'resize-b', handleItem)} onPointerMove={(e) => moveGesture(e, it.key)} onPointerUp={endGesture}
                      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 7, cursor: 'ns-resize' }} />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
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

/* ── Meeting / Event Edit Modal — full details, opens on click ── */
function MeetingEditModal({ state, today, onChange, onSave, onDelete, onClose }: {
  state: EditState
  today: { d: number; m: number; y: number }
  onChange: (s: EditState) => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const [navMonth, setNavMonth] = useState(state.month)
  const [navYear, setNavYear] = useState(state.year)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<EditState>) => onChange({ ...state, ...patch })

  const hasTime = state.time !== ''
  const hour = hasTime ? parseInt(state.time.split(':')[0]) : 9
  const minute = hasTime ? parseInt(state.time.split(':')[1] || '0') : 0
  const setTime = (h: number, m: number) => set({ time: `${pad2(h)}:${pad2(m)}` })

  const daysInMonth = getDaysInMonth(navMonth, navYear)
  const firstDay = getFirstDayOfMonth(navMonth, navYear)
  const prevMonth = () => { if (navMonth === 0) { setNavMonth(11); setNavYear(navYear - 1) } else setNavMonth(navMonth - 1) }
  const nextMonth = () => { if (navMonth === 11) { setNavMonth(0); setNavYear(navYear + 1) } else setNavMonth(navMonth + 1) }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const added: MeetingFile[] = Array.from(list).map(f => ({ name: f.name, url: URL.createObjectURL(f) }))
    set({ files: [...state.files, ...added] })
  }

  const inputBox: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7, padding: '7px 10px', fontSize: 12, color: '#fff', outline: 'none',
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5,
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 360, maxHeight: '88vh', overflowY: 'auto',
        background: '#131c2e', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 14, padding: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, color: '#64748b', cursor: 'pointer', display: 'flex' }}>
          <IconX size={16} />
        </button>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
          Edit {state.kind === 'meeting' ? 'meeting' : 'event'}
        </div>

        {/* Name */}
        <input value={state.label} onChange={e => set({ label: e.target.value })} placeholder="Title"
          style={{ ...inputBox, fontSize: 15, fontWeight: 700, marginBottom: 12 }} />

        {/* Date grid */}
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, padding: '0 6px' }}>‹</button>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>{MONTH_NAMES[navMonth]} {navYear}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, padding: '0 6px' }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAY_NAMES.map(dn => <div key={dn} style={{ fontSize: 8, fontWeight: 600, color: '#475569', textAlign: 'center' }}>{dn.slice(0, 1)}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 12 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1
            const isSelected = state.day === d && state.month === navMonth && state.year === navYear
            const isToday = d === today.d && navMonth === today.m && navYear === today.y
            return (
              <button key={d} onClick={() => set({ day: d, month: navMonth, year: navYear })} style={{
                aspectRatio: '1', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: isSelected ? 700 : 500,
                background: isSelected ? '#6366f1' : 'transparent',
                color: isSelected ? '#fff' : isToday ? '#fb7185' : '#94a3b8',
              }}>{d}</button>
            )
          })}
        </div>

        {/* Time */}
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <span style={sectionLabel}>Start time</span>
          <button onClick={() => set({ time: hasTime ? '' : '09:00' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: hasTime ? '#fb7185' : '#818cf8' }}>
            {hasTime ? 'Clear time (all day)' : 'Add time'}
          </button>
        </div>
        {hasTime && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
              <ScrollWheel items={HOUR_ITEMS} value={hour} onChange={(h: number) => setTime(h, minute)} width={60} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#475569', lineHeight: 1 }}>:</span>
              <ScrollWheel items={MINUTE_ITEMS} value={minute} onChange={(m: number) => setTime(hour, m)} width={60} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={sectionLabel}>Duration</div>
              <div className="flex items-center gap-1 flex-wrap">
                {DURATION_PRESETS.map(p => {
                  const active = state.durationMin === p.value
                  return (
                    <button key={p.value} onClick={() => set({ durationMin: p.value })} style={{
                      padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 9, fontWeight: 700,
                      background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                      color: active ? '#818cf8' : '#94a3b8',
                      border: active ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    }}>{p.label}</button>
                  )
                })}
                <span style={{ fontSize: 9, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTimeRange(hour, minute, state.durationMin)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Color */}
        <div style={{ marginBottom: 12 }}>
          <div style={sectionLabel}>Color</div>
          <div className="flex items-center gap-1.5">
            {MEETING_COLORS.map(c => (
              <button key={c} onClick={() => set({ color: c })} style={{
                width: 20, height: 20, borderRadius: 6, cursor: 'pointer', background: `${c}33`,
                border: state.color === c ? `1.5px solid ${c}` : `1px solid ${c}44`,
                boxShadow: state.color === c ? `0 0 8px ${c}66` : 'none',
              }} />
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 10 }}>
          <div style={sectionLabel}>Location</div>
          <LocationAutocomplete
            value={state.location}
            onChange={(v) => set({ location: v, coords: null })}
            onSelect={(name, lat, lon) => set({ location: name, coords: { lat, lon } })}
            hasCoords={!!state.coords}
            coords={state.coords}
          />
        </div>

        {/* Link */}
        <div style={{ marginBottom: 10 }}>
          <div style={sectionLabel}>Link</div>
          <input value={state.link} onChange={e => set({ link: e.target.value })} placeholder="https://…" style={inputBox} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 10 }}>
          <div style={sectionLabel}>Notes</div>
          <textarea value={state.notes} onChange={e => set({ notes: e.target.value })} placeholder="Add notes" rows={2}
            style={{ ...inputBox, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        {/* Files */}
        <div style={{ marginBottom: 16 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
            <span style={sectionLabel}>Files</span>
            <button onClick={() => fileRef.current?.click()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 3 }}>
              <IconPaperclip size={11} /> Attach
            </button>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
          </div>
          {state.files.length > 0 && (
            <div className="flex flex-col gap-1">
              {state.files.map((f, i) => (
                <div key={i} className="flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 8px' }}>
                  <span style={{ flex: 1, fontSize: 11, color: '#a5b4fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <button onClick={() => set({ files: state.files.filter((_, j) => j !== i) })}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}><IconX size={11} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={onDelete} style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(244,63,94,0.12)',
            border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185',
          }}>Delete</button>
          <button onClick={onSave} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', background: '#6366f1', color: '#fff',
            border: 'none', boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Location autocomplete (OpenStreetMap / Nominatim — free, no API key) ── */
interface NominatimAddress {
  road?: string
  house_number?: string
  pedestrian?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  suburb?: string
}
interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  place_id: number
  address?: NominatimAddress
}

function shortAddress(r: NominatimResult): string {
  const a = r.address
  if (!a) return r.display_name.split(',').slice(0, 2).join(',').trim()
  const street = a.road || a.pedestrian || a.suburb || ''
  const streetLine = street ? `${street}${a.house_number ? ' ' + a.house_number : ''}` : ''
  const city = a.city || a.town || a.village || a.municipality || ''
  return [streetLine, city].filter(Boolean).join(', ') || r.display_name.split(',').slice(0, 2).join(',').trim()
}

function LocationAutocomplete({ value, onChange, onSelect, hasCoords, coords }: {
  value: string
  onChange: (v: string) => void
  onSelect: (name: string, lat: number, lon: number) => void
  hasCoords: boolean
  coords: { lat: number; lon: number } | null
}) {
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef(false)

  useEffect(() => {
    if (skipRef.current) { skipRef.current = false; return }
    const q = value.trim()
    if (q.length < 3 || hasCoords) { setResults([]); setOpen(false); return }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch {
        /* aborted or network error — ignore */
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [value, hasCoords])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (r: NominatimResult) => {
    skipRef.current = true
    onSelect(shortAddress(r), parseFloat(r.lat), parseFloat(r.lon))
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div className="flex items-center gap-1.5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: hasCoords ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6, padding: '0 8px',
        }}>
        <IconMapPin size={12} color={hasCoords ? '#818cf8' : '#64748b'} />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true) }}
          placeholder="Search location…"
          style={{ flex: 1, background: 'transparent', border: 'none', padding: '5px 0', fontSize: 10, color: '#fff', outline: 'none' }} />
        {loading && <span style={{ fontSize: 8, color: '#64748b' }}>…</span>}
        {hasCoords && !loading && (
          <a
            href={coords
              ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 8, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}>
            Map
          </a>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50,
          background: '#0f1726', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)', overflow: 'hidden', maxHeight: 180, overflowY: 'auto',
        }}>
          {results.map(r => {
            const short = shortAddress(r)
            return (
              <button key={r.place_id} onClick={() => pick(r)}
                className="flex items-start gap-2 w-full text-left"
                style={{ padding: '7px 9px', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <IconMapPin size={12} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                <span className="flex flex-col" style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{short}</span>
                  <span style={{ fontSize: 8.5, color: '#64748b', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
