'use client'
import { useState } from 'react'
import {
  GANTT_DATA, LT_MONTH_EVENTS, LT_LEGEND,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth, pastel
} from '@/lib/data'

const TODAY = { d: 26, m: 4, y: 2026 }

export function LtGoalsCalendar() {
  const [view, setView] = useState<'gantt' | 'month'>('gantt')
  const [month, setMonth] = useState(4)
  const [year, setYear] = useState(2026)

  const changeMonth = (delta: number) => {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setMonth(newMonth)
    setYear(newYear)
  }

  return (
    <div className="card-base">
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
              className="bg-white border border-[#e7e5e0] rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-[#57534e] hover:bg-[#f5f5f1] transition-colors"
              style={{ visibility: view === 'month' ? 'visible' : 'hidden' }}
            >
              ‹
            </button>
            <span className="font-display text-[18px] tracking-tight text-[#0a0a0a] text-shadow-soft leading-none">
              {view === 'gantt' ? <>May <span className="text-[#a8a29e] italic">2026</span></> : <>{MONTH_NAMES[month]} <span className="text-[#a8a29e] italic">{year}</span></>}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="bg-white border border-[#e7e5e0] rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-[#57534e] hover:bg-[#f5f5f1] transition-colors"
              style={{ visibility: view === 'month' ? 'visible' : 'hidden' }}
            >
              ›
            </button>
          </div>
        </div>
        {view === 'gantt' ? <GanttView /> : <LtMonthView month={month} year={year} />}
      </div>
    </div>
  )
}

function GanttView() {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: '64px repeat(4, 1fr)' }}>
      <div />
      {['W1', 'W2', 'W3', 'W4'].map(w => (
        <div key={w} className="text-[9px] font-semibold text-[#a8a29e] text-center uppercase tracking-[0.12em]">
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
                background: a ? pastel(row.color, 0.78) : '#f5f5f1',
                boxShadow: a ? `inset 0 0 0 1px ${pastel(row.color, 0.55)}` : 'none',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function LtMonthView({ month, year }: { month: number; year: number }) {
  const startDay = getFirstDayOfMonth(month, year)
  const daysInMonth = getDaysInMonth(month, year)
  const events = LT_MONTH_EVENTS[`${year}-${month}`] || {}

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
          const isToday = day === TODAY.d && month === TODAY.m && year === TODAY.y
          const dayEvents = events[day] || []
          return (
            <div
              key={day}
              className={`min-h-[46px] rounded-md p-[3px] flex flex-col gap-0.5 border transition-colors ${
                isToday
                  ? 'bg-[#d1fae5] border-[#a7f3d0] shadow-[inset_0_0_0_1px_rgba(4,120,87,0.08)]'
                  : 'border-transparent hover:bg-[#f5f5f1] hover:border-[#e7e5e0]'
              }`}
            >
              <span className={`text-[11px] leading-none mb-[2px] tabular ${
                isToday ? 'text-[#047857] font-bold' : 'text-[#57534e] font-semibold'
              }`}>
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
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-[#f0efeb]">
        {LT_LEGEND.map(leg => (
          <div key={leg.label} className="flex items-center gap-1.5 text-[9.5px] text-[#57534e] font-medium uppercase tracking-[0.08em]">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: leg.color }} />
            {leg.label}
          </div>
        ))}
      </div>
    </>
  )
}