'use client'

import { useState } from 'react'
import { 
  MONTH_EVENTS, WEEK_EVENTS, DAY_EVENTS,
  MONTH_NAMES, DAY_NAMES, getDaysInMonth, getFirstDayOfMonth, pastel 
} from '@/lib/data'

const TODAY = { d: 26, m: 4, y: 2026 }

export function EventCalendar() {
  const [view, setView] = useState<'d' | 'm' | 'w'>('m')
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
      <div className="bg-[#1d4ed8] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
            Event Calendar
          </span>
          <div className="flex bg-white/[0.18] rounded-[5px] overflow-hidden">
            {(['d', 'm', 'w'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-[7px] py-[3px] border-none cursor-pointer text-[10px] font-bold ${
                  view === v ? 'bg-white/30 text-white' : 'bg-transparent text-white/60'
                }`}
              >
                {v === 'd' ? 'Day' : v === 'm' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-[11px_13px]">
        {view !== 'd' && (
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-[5px]">
              <button
                onClick={() => changeMonth(-1)}
                className="bg-transparent border border-[#e5e7eb] rounded-[5px] w-[22px] h-[22px] cursor-pointer text-[13px] flex items-center justify-center text-[#374151]"
              >
                ‹
              </button>
              <span className="text-xs font-bold text-[#111827]">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="bg-transparent border border-[#e5e7eb] rounded-[5px] w-[22px] h-[22px] cursor-pointer text-[13px] flex items-center justify-center text-[#374151]"
              >
                ›
              </button>
            </div>
          </div>
        )}
        {view === 'm' && <MonthView month={month} year={year} />}
        {view === 'w' && <WeekView />}
        {view === 'd' && <DayView />}
      </div>
    </div>
  )
}

function MonthView({ month, year }: { month: number; year: number }) {
  const startDay = getFirstDayOfMonth(month, year)
  const daysInMonth = getDaysInMonth(month, year)
  const events = MONTH_EVENTS[`${year}-${month}`] || {}

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
                  ? 'bg-[#f5f3ff] border-[#ddd6fe]' 
                  : 'border-transparent hover:bg-[#f9fafb] hover:border-[#e5e7eb]'
              }`}
            >
              <span className="text-[12px] font-semibold leading-none mb-[1px] ${
                isToday ? 'text-[#7c3aed] font-extrabold' : 'text-[#374151]'
              }`}>
                {day}
              </span>
              {dayEvents.slice(0, 2).map((ev, j) => (
                <div
                  key={j}
                  className="text-[8.5px] font-bold rounded-[3px] px-1 py-[1.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.4]"
                  style={{ background: pastel(ev.color, 0.78), color: ev.color }}
                >
                  {ev.label}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[8.5px] font-bold rounded-[3px] px-1 py-[1.5px] bg-[#f3f4f6] text-[#9ca3af]">
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

function WeekView() {
  const cols = [
    { name: 'Mon', day: 25 },
    { name: 'Tue', day: 26 },
    { name: 'Wed', day: 27 },
    { name: 'Thu', day: 28 },
    { name: 'Fri', day: 29 },
    { name: 'Sat', day: 30 },
    { name: 'Sun', day: 31 },
  ]

  return (
    <div className="grid grid-cols-7 gap-[3px]">
      {cols.map(c => {
        const isToday = c.day === TODAY.d
        const events = WEEK_EVENTS[c.day] || []
        return (
          <div
            key={c.day}
            className={`rounded-lg p-[5px_4px] min-h-[90px] flex flex-col gap-[3px] ${
              isToday 
                ? 'bg-[#f5f3ff] border-[1.5px] border-[#ddd6fe]' 
                : 'bg-[#fafafa] border border-[#f3f4f6]'
            }`}
          >
            <div className="text-center mb-[3px]">
              <div className={`text-[9px] font-bold ${isToday ? 'text-[#7c3aed]' : 'text-[#9ca3af]'}`}>
                {c.name}
              </div>
              <div 
                className={`text-[13px] font-bold text-[#111827] w-[22px] h-[22px] rounded-full flex items-center justify-center mx-auto mt-[1px] mb-0.5 ${
                  isToday ? 'bg-[#ddd6fe] text-[#5b21b6]' : ''
                }`}
              >
                {c.day}
              </div>
            </div>
            {events.map((ev, i) => (
              <div
                key={i}
                className="rounded p-[3px_4px]"
                style={{ 
                  background: pastel(ev.color, 0.82),
                  borderLeft: `3px solid ${pastel(ev.color, 0.5)}`
                }}
              >
                <div className="text-[8px] font-bold" style={{ color: ev.color }}>
                  {ev.time}
                </div>
                <div className="text-[8.5px] font-semibold leading-[1.3] text-[#374151]">
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

function DayView() {
  return (
    <>
      <div 
        className="mb-2 p-[6px_10px] rounded-lg flex justify-between"
        style={{ background: pastel('#7c3aed', 0.88) }}
      >
        <span className="text-[11px] font-bold text-[#6d28d9]">Tue, 26 May 2026</span>
        <span className="text-[10px] text-[#6d28d9] font-semibold">Today</span>
      </div>
      {Array.from({ length: 11 }).map((_, i) => {
        const hour = i + 8
        const events = DAY_EVENTS.filter(e => e.hour === hour)
        const isNow = hour === 14
        return (
          <div 
            key={hour} 
            className="flex items-start gap-1.5"
            style={{ minHeight: events.length ? '40px' : '20px' }}
          >
            <span 
              className="text-[9px] font-semibold w-[30px] flex-shrink-0 pt-[3px] text-right"
              style={{ color: isNow ? '#7c3aed' : '#d1d5db' }}
            >
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div 
              className="flex-1 pt-[3px]"
              style={{ borderTop: `1px solid ${isNow ? pastel('#7c3aed', 0.6) : '#f9fafb'}` }}
            >
              {isNow && (
                <div 
                  className="h-0.5 rounded-sm mb-[3px]"
                  style={{ background: pastel('#7c3aed', 0.5) }}
                />
              )}
              {events.map((ev, j) => (
                <div
                  key={j}
                  className="rounded-r-[5px] p-[4px_7px] mb-[3px]"
                  style={{
                    background: pastel(ev.color, 0.82),
                    borderLeft: `3px solid ${pastel(ev.color, 0.5)}`,
                  }}
                >
                  <div className="text-[10.5px] font-bold" style={{ color: ev.color }}>
                    {ev.label}
                  </div>
                  <div className="text-[9px] text-[#9ca3af]">
                    {ev.hour.toString().padStart(2, '0')}:00 – {ev.end.toString().padStart(2, '0')}:00
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
