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
    <div className="card-base">
      <div className="section-header header-slate-blue px-4 py-2.5">
        <div className="flex justify-between items-center">
          <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
            Event Calendar
          </span>
          <div className="seg-toggle flex">
            {(['d', 'm', 'w'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`seg-toggle-btn px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  view === v ? 'seg-toggle-btn-active' : 'seg-toggle-btn-inactive'
                }`}
              >
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
                className="bg-white border border-[#e7e5e0] rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-[#57534e] hover:bg-[#f5f5f1] transition-colors"
              >
                ‹
              </button>
              <span className="font-display text-[20px] tracking-tight text-[#0a0a0a] text-shadow-soft leading-none">
                {MONTH_NAMES[month]} <span className="text-[#a8a29e] italic">{year}</span>
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="bg-white border border-[#e7e5e0] rounded-md w-6 h-6 cursor-pointer text-[13px] flex items-center justify-center text-[#57534e] hover:bg-[#f5f5f1] transition-colors"
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
                  ? 'bg-[#e0e7ff] border-[#c7d2fe] shadow-[inset_0_0_0_1px_rgba(67,56,202,0.08)]'
                  : 'border-transparent hover:bg-[#f5f5f1] hover:border-[#e7e5e0]'
              }`}
            >
              <span className={`text-[11px] leading-none mb-[2px] tabular ${
                isToday ? 'text-[#3730a3] font-bold' : 'text-[#57534e] font-semibold'
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

function WeekView() {
  const cols = [
    { name: 'Mon', day: 25 }, { name: 'Tue', day: 26 }, { name: 'Wed', day: 27 },
    { name: 'Thu', day: 28 }, { name: 'Fri', day: 29 }, { name: 'Sat', day: 30 }, { name: 'Sun', day: 31 },
  ]

  return (
    <div className="grid grid-cols-7 gap-1">
      {cols.map(c => {
        const isToday = c.day === TODAY.d
        const events = WEEK_EVENTS[c.day] || []
        return (
          <div
            key={c.day}
            className={`rounded-lg p-1.5 min-h-[92px] flex flex-col gap-1 transition-colors ${
              isToday
                ? 'bg-[#e0e7ff] border border-[#c7d2fe] shadow-[inset_0_0_0_1px_rgba(67,56,202,0.06)]'
                : 'bg-[#fafaf7] border border-[#f0efeb]'
            }`}
          >
            <div className="text-center mb-1">
              <div className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${isToday ? 'text-[#3730a3]' : 'text-[#a8a29e]'}`}>
                {c.name}
              </div>
              <div
                className={`font-display text-[18px] tabular w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 text-shadow-soft leading-none ${
                  isToday ? 'bg-[#c7d2fe] text-[#3730a3]' : 'text-[#0a0a0a]'
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
                <div className="text-[9.5px] font-bold tabular" style={{ color: ev.color }}>
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

function DayView() {
  return (
    <>
      <div
        className="mb-3 px-3 py-2 rounded-lg flex justify-between items-center"
        style={{ background: '#e0e7ff' }}
      >
        <span className="font-display text-[20px] text-[#3730a3] text-shadow-soft leading-none">Tue, 26 May 2026</span>
        <span className="text-[9px] uppercase tracking-[0.16em] text-[#3730a3] font-semibold">Today</span>
      </div>
      {Array.from({ length: 11 }).map((_, i) => {
        const hour = i + 8
        const events = DAY_EVENTS.filter(e => e.hour === hour)
        const isNow = hour === 14
        return (
          <div
            key={hour}
            className="flex items-start gap-2"
            style={{ minHeight: events.length ? '40px' : '20px' }}
          >
            <span
              className={`text-[10.5px] font-semibold w-[34px] flex-shrink-0 pt-[3px] text-right tabular ${
                isNow ? 'text-[#4338ca]' : 'text-[#d6d3d1]'
              }`}
            >
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div
              className="flex-1 pt-[3px]"
              style={{ borderTop: `1px solid ${isNow ? '#c7d2fe' : '#f5f5f1'}` }}
            >
              {isNow && <div className="h-0.5 rounded-sm mb-1" style={{ background: '#4338ca' }} />}
              {events.map((ev, j) => (
                <div
                  key={j}
                  className="rounded-r-md px-2 py-1 mb-1"
                  style={{ background: pastel(ev.color, 0.86), borderLeft: `2.5px solid ${ev.color}` }}
                >
                  <div className="text-[12px] font-bold" style={{ color: ev.color }}>{ev.label}</div>
                  <div className="text-[10px] text-[#a8a29e] tabular mt-0.5">
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