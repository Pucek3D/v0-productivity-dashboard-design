'use client'
import React, { useState, useEffect } from 'react'
import {
  MONTH_EVENTS, WEEK_EVENTS, DAY_EVENTS,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth
} from '@/lib/data'
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
  position: 'absolute',
  top: 0, left: 0, right: 0,
  height: '1.5px',
  background: 'linear-gradient(90deg, transparent 0%, #fb7185 25%, #fb7185 75%, transparent 100%)',
  boxShadow: '0 0 12px rgba(251, 113, 133, 0.6), 0 0 28px rgba(251, 113, 133, 0.4)',
  zIndex: 2,
}

const HEADER_BAR: React.CSSProperties = {
  background: 'transparent',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  position: 'relative',
  padding: '12px 16px',
}

const TOGGLE_WRAP: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '6px',
  overflow: 'hidden',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
  display: 'flex',
}

const togBtn = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
  color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
  boxShadow: active ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.10)' : 'none',
  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '10px',
  textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px',
})

const TITLE: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.92)',
  fontWeight: 600, fontSize: '11px',
  letterSpacing: '0.18em', textTransform: 'uppercase',
}

const DISPLAY_FONT: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
  fontWeight: 700, letterSpacing: '-0.025em',
}

interface EventCalendarProps {
  deadlineEvents?: DeadlineEvent[]
}

export function EventCalendar({ deadlineEvents = [] }: EventCalendarProps) {
  const [view, setView] = useState<'d' | 'm' | 'w'>('m')
  const [today, setToday] = useState({ d: 26, m: 4, y: 2026 })
  const [month, setMonth] = useState(4)
  const [year, setYear] = useState(2026)

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

  return (
    <div style={CARD}>
      <div style={GLOW_LINE} />
      <div style={HEADER_BAR}>
        <div className="flex justify-between items-center" style={{ position: 'relative' }}>
          <span style={TITLE}>Event Calendar</span>
          <div style={TOGGLE_WRAP}>
            {(['d', 'm', 'w'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={togBtn(view === v)}>
                {v === 'd' ? 'Day' : v === 'm' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3.5 py-3">
        {view !== 'd' && (
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)}
                className="bg-white/5 border border-white/10 rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition">
                ‹
              </button>
              <span style={{ ...DISPLAY_FONT, fontSize: '20px', color: '#ffffff' }}>
                {MONTH_NAMES[month]} <span style={{ color: '#64748b' }}>{year}</span>
              </span>
              <button onClick={() => changeMonth(1)}
                className="bg-white/5 border border-white/10 rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition">
                ›
              </button>
              <button onClick={() => { setMonth(today.m); setYear(today.y) }}
                style={{ marginLeft: '8px', fontSize: '9px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.10em',
                  color: '#fb7185', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Today
              </button>
            </div>
          </div>
        )}
        {view === 'm' && <MonthView month={month} year={year} today={today} deadlineEvents={deadlineEvents} />}
        {view === 'w' && <WeekView today={today} deadlineEvents={deadlineEvents} />}
        {view === 'd' && <DayView today={today} deadlineEvents={deadlineEvents} />}
      </div>
    </div>
  )
}

/* ── Month View ── */
function MonthView({ month, year, today, deadlineEvents }: {
  month: number; year: number; today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[]
}) {
  const startDay = getFirstDayOfMonth(month, year)
  const daysInMonth = getDaysInMonth(month, year)
  const events = MONTH_EVENTS[`${year}-${month}`] || {}

  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-center text-[9.5px] font-semibold text-slate-500 uppercase tracking-[0.12em] py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[46px]" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = day === today.d && month === today.m && year === today.y
          const regularEvents = events[day] || []
          const taskEvents = deadlineEvents.filter(e => {
            const d = new Date(e.date + 'T00:00')
            return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
          }).map(e => ({ label: `→ ${e.label}`, color: e.color }))
          const dayEvents = [...regularEvents, ...taskEvents]

          return (
            <div key={day} className={`min-h-[46px] rounded-md p-[3px] flex flex-col gap-0.5 border transition-colors ${
              isToday ? 'border-rose-400/60' : 'border-transparent hover:bg-white/[0.03] hover:border-white/10'
            }`} style={isToday ? { background: 'rgba(244, 63, 94, 0.12)' } : {}}>
              <span className={`text-[11px] leading-none mb-[2px] ${
                isToday ? 'text-rose-300 font-bold' : 'text-slate-300 font-semibold'
              }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {day}
              </span>
              {dayEvents.slice(0, 2).map((ev, j) => (
                <div key={j}
                  className="text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]"
                  style={{ background: `${ev.color}22`, color: ev.color, border: `1px solid ${ev.color}44` }}>
                  {ev.label}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] bg-white/5 text-slate-500">
                  +{dayEvents.length - 2}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ── Week View ── */
function WeekView({ today, deadlineEvents }: { today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[] }) {
  const cols = (() => {
    const result: { name: string; day: number; dateStr: string }[] = []
    const base = new Date(today.y, today.m, today.d)
    const dayOfWeek = base.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    for (let i = 0; i < 7; i++) {
      const d = new Date(base); d.setDate(base.getDate() + mondayOffset + i)
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      result.push({
        name: names[i],
        day: d.getDate(),
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      })
    }
    return result
  })()

  return (
    <div className="grid grid-cols-7 gap-1">
      {cols.map(c => {
        const isToday = c.day === today.d
        const regularEvents = WEEK_EVENTS[c.day] || []
        const taskEvents = deadlineEvents.filter(e => e.date === c.dateStr)
          .map(e => ({ label: `→ ${e.label}`, color: e.color, time: 'All day' }))
        const events = [...regularEvents, ...taskEvents]

        return (
          <div key={c.day} className={`rounded-lg p-1.5 min-h-[92px] flex flex-col gap-1 border ${
            isToday ? 'border-rose-400/60' : 'border-white/5 bg-white/[0.02]'
          }`} style={isToday ? { background: 'rgba(244, 63, 94, 0.10)' } : {}}>
            <div className="text-center mb-1">
              <div className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${isToday ? 'text-rose-300' : 'text-slate-500'}`}>
                {c.name}
              </div>
              <div style={{ ...DISPLAY_FONT, fontSize: '18px', fontVariantNumeric: 'tabular-nums' }}
                className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 leading-none ${
                  isToday ? 'text-rose-300' : 'text-white'
                }`}>
                {c.day}
              </div>
            </div>
            {events.map((ev, i) => (
              <div key={i} className="rounded-[5px] px-1.5 py-1"
                style={{ background: `${ev.color}22`, borderLeft: `2px solid ${ev.color}`, boxShadow: `0 0 8px ${ev.color}33` }}>
                <div className="text-[9.5px] font-bold" style={{ color: ev.color, fontVariantNumeric: 'tabular-nums' }}>
                  {ev.time}
                </div>
                <div className="text-[10px] font-semibold leading-[1.25] text-slate-200 mt-px">
                  {ev.label}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/* ── Day View ── */
function DayView({ today, deadlineEvents }: { today: { d: number; m: number; y: number }; deadlineEvents: DeadlineEvent[] }) {
  const dateStr = new Date(today.y, today.m, today.d).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })

  const todayStr = `${today.y}-${String(today.m + 1).padStart(2, '0')}-${String(today.d).padStart(2, '0')}`
  const allDayEvents = deadlineEvents.filter(e => e.date === todayStr)

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span style={{ ...DISPLAY_FONT, fontSize: '20px', color: '#ffffff' }}>{dateStr}</span>
        <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.16em', color: '#fb7185' }}>
          Today
        </span>
      </div>

      {allDayEvents.length > 0 && (
        <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 4 }}>
            All day
          </div>
          {allDayEvents.map((ev, i) => (
            <div key={i} style={{
              background: `${ev.color}22`, borderLeft: `2.5px solid ${ev.color}`,
              borderRadius: '0 6px 6px 0', padding: '4px 8px', marginBottom: 2,
              boxShadow: `0 0 12px ${ev.color}33`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: ev.color }}>→ {ev.label}</span>
            </div>
          ))}
        </div>
      )}

      {Array.from({ length: 11 }).map((_, i) => {
        const hour = i + 8
        const events = DAY_EVENTS.filter(e => e.hour === hour)
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
              borderTop: `1px solid ${isNow ? 'rgba(251, 113, 133, 0.4)' : 'rgba(255,255,255,0