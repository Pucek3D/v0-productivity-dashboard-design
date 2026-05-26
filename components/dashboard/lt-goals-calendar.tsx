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
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#0f766e] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
          Long-term goals calendar
        </span>
      </div>
      <div className="p-[11px_13px]">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-[5px]">
            <button
              onClick={() => changeMonth(-1)}
              className="bg-transparent border border-[#e5e7eb] rounded-[5px] w-[22px] h-[22px] cursor-pointer text-[13px] flex items-center justify-center text-[#374151]"
              style={{ visibility: view === 'month' ? 'visible' : 'hidden' }}
            >
              ‹
            </button>
            <span className="text-xs font-bold text-[#111827]">
              {view === 'gantt' ? 'May 2026' : `${MONTH_NAMES[month]} ${year}`}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="bg-transparent border border-[#e5e7eb] rounded-[5px] w-[22px] h-[22px] cursor-pointer text-[13px] flex items-center justify-center text-[#374151]"
              style={{ visibility: view === 'month' ? 'visible' : 'hidden' }}
            >
              ›
            </button>
          </div>
          <div className="flex border border-[#e5e7eb] rounded-md overflow-hidden">
            <button
              onClick={() => setView('gantt')}
              className={`px-2 py-[3px] border-none cursor-pointer text-[11px] font-bold transition-all ${
                view === 'gantt' ? 'bg-[#0f766e] text-white' : 'bg-white text-[#6b7280]'
              }`}
            >
              Gantt
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-2 py-[3px] border-none cursor-pointer text-[11px] font-bold transition-all ${
                view === 'month' ? 'bg-[#0f766e] text-white' : 'bg-white text-[#6b7280]'
              }`}
            >
              Month
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
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: '58px repeat(4, 1fr)' }}>
      <div />
      {['W1', 'W2', 'W3', 'W4'].map(w => (
        <div key={w} className="text-[9px] font-bold text-[#9ca3af] text-center">
          {w}
        </div>
      ))}
      {GANTT_DATA.map(row => (
        <div key={row.name} className="contents">
          <div 
            className="text-[9.5px] font-bold text-right pr-1"
            style={{ color: row.color }}
          >
            {row.name}
          </div>
          {row.active.map((a, i) => (
            <div
              key={i}
              className="h-3.5 rounded-[3px]"
              style={{
                background: a ? pastel(row.color, 0.72) : '#f9fafb',
                border: a ? `1px solid ${pastel(row.color, 0.55)}` : 'none',
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
      <div className="grid grid-cols-7 gap-0.5 mb-[3px]">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-[#9ca3af] py-0.5">
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
              className={`min-h-[46px] rounded-md p-[3px_3px_2px] flex flex-col gap-0.5 border ${
                isToday 
                  ? 'bg-[#f0fdf4] border-[#bbf7d0]' 
                  : 'border-transparent hover:bg-[#f9fafb] hover:border-[#e5e7eb]'
              }`}
            >
              <span className={`text-[10px] font-semibold leading-none mb-[1px] ${
                isToday ? 'text-[#059669] font-extrabold' : 'text-[#374151]'
              }`}>
                {day}
              </span>
              {dayEvents.slice(0, 2).map((ev, j) => (
                <div
                  key={j}
                  className="text-[7.5px] font-bold rounded-[3px] px-1 py-[1.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.4]"
                  style={{ background: pastel(ev.color, 0.78), color: ev.color }}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-[5px] mt-2 pt-[7px] border-t border-[#f3f4f6]">
        {LT_LEGEND.map(leg => (
          <div key={leg.label} className="flex items-center gap-[3px] text-[9px] text-[#6b7280]">
            <div 
              className="w-[7px] h-[7px] rounded-sm flex-shrink-0"
              style={{ background: pastel(leg.color, 0.55) }}
            />
            {leg.label}
          </div>
        ))}
      </div>
    </>
  )
}
