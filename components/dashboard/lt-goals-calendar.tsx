'use client'
import { useState, useEffect } from 'react'
import {
  GANTT_DATA, LT_MONTH_EVENTS, LT_LEGEND,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth, pastel
} from '@/lib/data'

export function LtGoalsCalendar() {
  const [view, setView] = useState<'gantt' | 'month'>('gantt')

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
    <div className="card-base halo-sage">
      <div className="section-header header-sage px-4 py-2.5">
        <div className="flex justify-between items-center">
          <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
            Long-term goals calendar
          </span>
          <div className="seg-toggle flex">
            <button
              onClick={() => setView('gantt')}
              className={`seg-toggle-btn px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                view === 'gantt' ? 'seg-toggle-btn-active' : 'seg-toggle-btn-inactive'
              }`}
            >
              Gantt
            </button>
            <button
              onClick={() => setView('month')}
              className={`seg-toggle-btn px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                view === 'month' ? 'seg-toggle-btn-active' : 'seg-toggle-btn-inactive'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>
      <div className="px-3.5 py-3">
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="bg-white/5 border border-white/10 rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              style={{ visibility: view === 'month' ? 'visible' : 'hidden' }}
            >
              ‹
            </button>
            <span className="font-display text-[18px] tracking-tight text-white text-shadow-soft leading-none">
              {MONTH_NAMES[month]} <span className="text-slate-500">{year}</span>
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="bg-white/5 border border-white/10 rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              style={{ visibility: view === 'month' ? 'visible' : 'hidden' }}
            >
              ›
            </button>
            {view === 'month' && (
              <button
                onClick={() => { setMonth(today.m); setYear(today.y) }}
                className="ml-2 text-[9px] font-semibold uppercase tracking-wider text-[#2dd4bf] hover:text-[#14b8a6] transition-colors"
                title="Jump to today"
              >
                Today
              </button>
            )}
          </div>
        </div>
        {view === 'gantt' ? <GanttView /> : <LtMonthView month={month} year={year} today={today} />}
      </div>
    </div>
  )
}

function GanttView() {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: '64px repeat(4, 1fr)' }}>
      <div />
      {['W1', 'W2', 'W3', 'W4'].map(w => (
        <div key={w} className="text-[9px] font-semibold text-slate-500 text-center uppercase tracking-[0.12em]">
          {w}
        </div>
      ))}
      {GANTT_DATA.map(row => (
        <div key={row.name} className="contents">
          <div
            className="text-[10px] font-semibold text-right pr-2 self-center uppercase tracking-[0.05em]"
            style={{ color: row.color }}
          >
            {row.name}
          </div>
          {row.active.map((a, i) => (
            <div
              key={i}
              className="h-4 rounded-[4px]"
              style={{
                background: a ? `${row.color}33` : 'rgba(255,255,255,0.03)',
                boxShadow: a ? `inset 0 0 0 1px ${row.color}55, 0 0 8px ${row.color}33` : 'none',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function LtMonthView({ month, year, today }: { month: number; year: number; today: { d: number; m: number; y: number } }) {
  const startDay = getFirstDayOfMonth(month, year)
  const daysInMonth = getDaysInMonth(month, year)
  const events = LT_MONTH_EVENTS[`${year}-${month}`] || {}

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
          const dayEvents = events[day] || []
          return (
            <div
  key={day}
  className={`min-h-[46px] rounded-md p-[3px] flex flex-col gap-0.5 border transition-colors ${
    isToday
      ? 'border-teal-400/60'
      : 'border-transparent hover:bg-white/[0.03] hover:border-white/10'
  }`}
  style={isToday ? { background: 'rgba(20, 184, 166, 0.12)' } : {}}
>
              <span className={`text-[11px] leading-none mb-[2px] tabular ${
                isToday ? 'text-teal-300 font-bold' : 'text-slate-300 font-semibold'
              }`}>
                {day}
              </span>
              {dayEvents.slice(0, 2).map((ev, j) => (
                <div
                  key={j}
                  className="text-[9.5px] font-semibold rounded-[3px] px-1 py-[1.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]"
                  style={{ background: `${ev.color}22`, color: ev.color, border: `1px solid ${ev.color}44` }}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-white/5">
        {LT_LEGEND.map(leg => (
          <div key={leg.label} className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-medium uppercase tracking-[0.08em]">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: leg.color }} />
            {leg.label}
          </div>
        ))}
      </div>
    </>
  )
}