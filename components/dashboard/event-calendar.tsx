'use client'
import { useState, useEffect } from 'react'
import {
  MONTH_EVENTS, WEEK_EVENTS, DAY_EVENTS,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth, pastel
} from '@/lib/data'

const CARD: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(10, 10, 10, 0.06)',
  borderRadius: '0.875rem',
  boxShadow:
    '0 1px 2px rgba(236, 72, 153, 0.08), 0 4px 16px rgba(236, 72, 153, 0.10), 0 16px 40px rgba(236, 72, 153, 0.08)',
  overflow: 'hidden',
}

const HEADER_BAR: React.CSSProperties = {
  background: 'linear-gradient(180deg, #f472b6 0%, #ec4899 100%)',
  position: 'relative',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.14), 0 2px 4px rgba(0, 0, 0, 0.04)',
  padding: '10px 16px',
}

const TOGGLE_WRAP: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.14)',
  borderRadius: '6px',
  overflow: 'hidden',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.10)',
  display: 'flex',
}

const togBtn = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(255, 255, 255, 0.30)' : 'transparent',
  color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.64)',
  boxShadow: active ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.14)' : 'none',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '2px 8px',
})

const TITLE: React.CSSProperties = {
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '11px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.22)',
}

const DISPLAY_FONT: React.CSSProperties = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 800,
  letterSpacing: '-0.025em',
  fontStyle: 'normal',
}

export function EventCalendar() {
  const [view, setView] = useState<'d' | 'm' | 'w'>('m')
  const [today, setToday] = useState({ d: 26, m: 4, y: 2026 })
  const [month, setMonth] = useState(4)
  const [year, setYear] = useState(2026)

  useEffect(() => {
    const now = new Date()
    const t = { d: now.getDate(), m: now.getMonth(), y: now.getFullYear() }
    setToday(t)
    setMonth(t.m)
    setYear(t.y)
  }, [])

  const changeMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setMonth(newMonth)
    setYear(newYear)
  }

  return (
    <div style={CARD}>
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
              <button
                onClick={() => changeMonth(-1)}
                className="bg-white border border-[#e7e5e0] rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-[#57534e] hover:bg-[#f5f5f1]"
              >
                ‹
              </button>
              <span style={{ ...DISPLAY_FONT, fontSize: '20px', color: '#0a0a0a', textShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>
                {MONTH_NAMES[month]} <span style={{ color: '#a8a29e' }}>{year}</span>
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="bg-white border border-[#e7e5e0] rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-[#57534e] hover:bg-[#f5f5f1]"
              >
                ›
              </button>
              <button
                onClick={() => { setMonth(today.m); setYear(today.y) }}
                style={{
                  marginLeft: '8px',
                  fontSize: '9px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.10em',
                  color: '#db2777',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
            </div>
          </div>
        )}
        {view === 'm' && <MonthView month={month} year={year} today={today} />}
        {view === 'w' && <WeekView today={today} />}
        {view === 'd' && <DayView today={today} />}
      </div>
    </div>
  )
}

function MonthView({ month, year, today }: { month: number; year: number; today: { d: number; m: number; y: number } }) {
  const startDay = getFirstDayOfMonth(month, year)
  const daysInMonth = getDaysInMonth(month, year)
  const events = MONTH_EVENTS[`${year}-${month}`] || {}

  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-center text-[9.5px] font-semibold text-[#a8a29e] uppercase tracking-[0.12em] py-1">
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
          const dayEvents = events[day] || []
          return (
            <div
              key={day}
              className={`min-h-[46px] rounded-md p-[3px] flex flex-col gap-0.5 border transition-colors ${
                isToday
                  ? 'bg-[#fbcfe8] border-[#f9a8d4]'
                  : 'border-transparent hover:bg-[#f5f5f1] hover:border-[#e7e5e0]'
              }`}
            >
              <span className={`text-[11px] leading-none mb-[2px] ${
                isToday ? 'text-[#9d174d] font-bold' : 'text-[#57534e] font-semibold'
              }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {day}
              </span>
              {dayEvents.slice(0, 2).map((ev, j) => (
                <div
                  key={j}
                  className="text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]"
                  style={{ background: pastel(ev.color, 0.84), color: ev.color }}
                >
                  {ev.label}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] bg-[#f5f5f1] text-[#a8a29e]">
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

function WeekView({ today }: { today: { d: number; m: number; y: number } }) {
  const cols = (() => {
    const result: { name: string; day: number }[] = []
    const base = new Date(today.y, today.m, today.d)
    const dayOfWeek = base.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + mondayOffset + i)
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      result.push({ name: names[i], day: d.getDate() })
    }
    return result
  })()

  return (
    <div className="grid grid-cols-7 gap-1">
      {cols.map(c => {
        const isToday = c.day === today.d
        const events = WEEK_EVENTS[c.day] || []
        return (
          <div
            key={c.day}
            className={`rounded-lg p-1.5 min-h-[92px] flex flex-col gap-1 ${
              isToday ? 'bg-[#fbcfe8] border border-[#f472b6]' : 'bg-[#fafaf7] border border-[#f0efeb]'
            }`}
          >
            <div className="text-center mb-1">
              <div className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${isToday ? 'text-[#9d174d]' : 'text-[#a8a29e]'}`}>
                {c.name}
              </div>
              <div
                style={{ ...DISPLAY_FONT, fontSize: '18px', fontVariantNumeric: 'tabular-nums' }}
                className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 leading-none ${
                  isToday ? 'bg-[#fbcfe8] text-[#9d174d]' : 'text-[#0a0a0a]'
                }`}
              >
                {c.day}
              </div>
            </div>
            {events.map((ev, i) => (
              <div
                key={i}
                className="rounded-[5px] px-1.5 py-1"
                style={{ background: pastel(ev.color, 0.88), borderLeft: `2px solid ${ev.color}` }}
              >
                <div className="text-[9.5px] font-bold" style={{ color: ev.color, fontVariantNumeric: 'tabular-nums' }}>
                  {ev.time}
                </div>
                <div className="text-[10px] font-semibold leading-[1.25] text-[#292524] mt-px">
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

function DayView({ today }: { today: { d: number; m: number; y: number } }) {
  const dateStr = new Date(today.y, today.m, today.d).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
  <span style={{ ...DISPLAY_FONT, fontSize: '20px', color: '#0a0a0a', textShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>
    {dateStr}
  </span>
  <span style={{
    fontSize: '9px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: '#db2777',
  }}>
    Today
  </span>
</div>
    {Array.from({ length: 11 }).map((_, i) => {
  const hour = i + 8
  const events = DAY_EVENTS.filter(e => e.hour === hour)
  const isNow = hour === new Date().getHours()
  const hasContent = events.length > 0 || isNow
  return (
    <div key={hour} className="flex items-start gap-2 transition-all" style={{ 
      minHeight: hasContent ? '40px' : '10px',
      opacity: hasContent ? 1 : 0.4,
    }}>
           <span
              className={`text-[10.5px] font-semibold w-[34px] flex-shrink-0 pt-[3px] text-right ${
                isNow ? 'text-[#db2777]' : 'text-[#d6d3d1]'
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div className="flex-1 pt-[3px]" style={{ borderTop: `1px solid ${isNow ? '#f472b6' : '#f5f5f1'}` }}>
              {isNow && <div className="h-0.5 rounded-sm mb-1" style={{ background: '#db2777' }} />}
              {events.map((ev, j) => (
                <div
                  key={j}
                  className="rounded-r-md px-2 py-1 mb-1"
                  style={{ background: pastel(ev.color, 0.86), borderLeft: `2.5px solid ${ev.color}` }}
                >
                  <div className="text-[12px] font-bold" style={{ color: ev.color }}>{ev.label}</div>
                  <div className="text-[10px] text-[#a8a29e] mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {ev.hour.toString().padStart(2, '0')}:00 — {ev.end.toString().padStart(2, '0')}:00
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}