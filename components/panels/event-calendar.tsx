"use client"

import { useState } from "react"

/* ── helpers ─────────────────────────────────────────────── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"]

type CalView = "day" | "week" | "month"

type CalEvent = {
  id: number
  day: number
  month: number
  year: number
  title: string
  category: "work" | "home" | "other"
}

const SAMPLE_EVENTS: CalEvent[] = [
  { id: 1, day: 26, month: 5, year: 2026, title: "LP GAP review", category: "work" },
  { id: 2, day: 27, month: 5, year: 2026, title: "Team sync", category: "work" },
  { id: 3, day: 28, month: 5, year: 2026, title: "Yoga class", category: "home" },
  { id: 4, day: 29, month: 5, year: 2026, title: "KOMUNITA call", category: "work" },
  { id: 5, day: 30, month: 5, year: 2026, title: "Grocery", category: "home" },
  { id: 6, day: 2, month: 6, year: 2026, title: "Podcast rec", category: "other" },
]

const CAT_COLOR: Record<string, string> = {
  work: "#7C3AED",
  home: "#16A34A",
  other: "#2563EB",
}

/* ── long-term milestones for mini timeline ─────────────── */
const MILESTONES = [
  { project: "KOMUNITA", color: "#16A34A", start: 3, end: 8 },
  { project: "CASE TRACKER", color: "#7C3AED", start: 1, end: 6 },
  { project: "LP GAP", color: "#2563EB", start: 5, end: 10 },
]
const TIMELINE_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

/* ── MonthView ───────────────────────────────────────────── */
function MonthView({ year, month, events }: { year: number; month: number; events: CalEvent[] }) {
  const today = new Date()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsForDay = (d: number) =>
    events.filter((e) => e.day === d && e.month === month + 1 && e.year === year)

  return (
    <div className="flex-1 min-h-0">
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-semibold text-gray-400 py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dayEvents = day ? eventsForDay(day) : []
          return (
            <div
              key={i}
              className={`min-h-[28px] rounded p-0.5 text-center ${
                day ? "hover:bg-gray-50 cursor-pointer" : ""
              } ${isToday ? "bg-[#f3f0ff] ring-1 ring-[#7C3AED]" : ""}`}
            >
              {day && (
                <>
                  <div className={`text-[10px] font-medium ${isToday ? "text-[#7C3AED] font-bold" : "text-gray-600"}`}>{day}</div>
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: CAT_COLOR[e.category] }}
                        title={e.title}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── WeekView ────────────────────────────────────────────── */
function WeekView({ year, month, events }: { year: number; month: number; events: CalEvent[] }) {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })
  return (
    <div className="flex-1 min-h-0">
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          const dayEvents = events.filter(
            (e) => e.day === d.getDate() && e.month === d.getMonth() + 1 && e.year === d.getFullYear()
          )
          return (
            <div key={i} className={`rounded p-1 border ${isToday ? "border-[#7C3AED] bg-[#f3f0ff]" : "border-gray-100"}`}>
              <div className={`text-[10px] font-semibold mb-1 ${isToday ? "text-[#7C3AED]" : "text-gray-500"}`}>
                {DAYS[i]} {d.getDate()}
              </div>
              {dayEvents.map((e) => (
                <div key={e.id} className="text-[9px] rounded px-1 py-0.5 mb-0.5 truncate text-white" style={{ backgroundColor: CAT_COLOR[e.category] }}>
                  {e.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── DayView ─────────────────────────────────────────────── */
function DayView({ events }: { events: CalEvent[] }) {
  const today = new Date()
  const todayEvents = events.filter(
    (e) => e.day === today.getDate() && e.month === today.getMonth() + 1 && e.year === today.getFullYear()
  )
  return (
    <div className="flex-1 min-h-0">
      <div className="text-xs font-semibold text-gray-700 mb-2">
        {DAYS[today.getDay()]}, {MONTHS[today.getMonth()]} {today.getDate()}
      </div>
      {todayEvents.length === 0 && <div className="text-xs text-gray-400">No events today</div>}
      {todayEvents.map((e) => (
        <div key={e.id} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLOR[e.category] }} />
          <span className="text-xs text-gray-700">{e.title}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Long-term goals Gantt chart ─────────────────────────── */
function GoalsTimeline() {
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // 1-based

  return (
    <div className="mt-3 flex-shrink-0">
      {/* Section header — elevated card style */}
      <div
        className="flex items-center gap-2 px-3 py-2 mb-2 rounded-t-xl bg-white"
        style={{
          borderLeft: "3px solid #7C3AED",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#7C3AED]">Long Term Goals Calendar</span>
      </div>

      {/* Gantt card */}
      <div className="bg-white rounded-b-xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 440 }}>
            {/* Month column headers */}
            <div
              className="grid border-b border-gray-100"
              style={{ gridTemplateColumns: "88px repeat(12, 1fr)" }}
            >
              <div className="px-2 py-1.5" />
              {TIMELINE_MONTHS.map((m, i) => (
                <div
                  key={m}
                  className={`text-center py-1.5 text-[9px] font-semibold uppercase tracking-wide ${
                    i + 1 === currentMonth ? "text-[#7C3AED]" : "text-gray-400"
                  }`}
                >
                  {m}
                  {i + 1 === currentMonth && (
                    <div className="mx-auto mt-0.5 w-1 h-1 rounded-full bg-[#7C3AED]" />
                  )}
                </div>
              ))}
            </div>

            {/* Project rows */}
            {MILESTONES.map((ms, rowIdx) => (
              <div
                key={ms.project}
                className={`grid items-center ${rowIdx < MILESTONES.length - 1 ? "border-b border-gray-50" : ""}`}
                style={{ gridTemplateColumns: "88px repeat(12, 1fr)" }}
              >
                {/* Row label */}
                <div className="px-2 py-2">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide truncate block"
                    style={{ color: ms.color }}
                  >
                    {ms.project}
                  </span>
                </div>

                {/* Month cells */}
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = i + 1
                  const inRange = monthNum >= ms.start && monthNum <= ms.end
                  const isFirst = monthNum === ms.start
                  const isLast = monthNum === ms.end
                  return (
                    <div key={i} className="py-2 px-0.5">
                      {inRange ? (
                        <div
                          className="h-5 w-full"
                          style={{
                            backgroundColor: ms.color + "28",
                            borderTop: `1.5px solid ${ms.color}55`,
                            borderBottom: `1.5px solid ${ms.color}55`,
                            borderLeft: isFirst ? `1.5px solid ${ms.color}55` : "none",
                            borderRight: isLast ? `1.5px solid ${ms.color}55` : "none",
                            borderRadius: isFirst && isLast ? 9999 : isFirst ? "9999px 0 0 9999px" : isLast ? "0 9999px 9999px 0" : 0,
                          }}
                        />
                      ) : (
                        <div className="h-5" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── EXPORT ─────────────────────────────────────────────── */
export function EventCalendarPanel() {
  const today = new Date()
  const [view, setView] = useState<CalView>("month")
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events] = useState<CalEvent[]>(SAMPLE_EVENTS)

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-[#F9FAFB] rounded-t-lg"
        style={{ borderLeft: "3px solid #7C3AED", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">Event Calendar</h2>
        <div className="flex items-center gap-1">
          {(["day", "week", "month"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors capitalize ${
                view === v ? "bg-[#7C3AED] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col">
        {/* Month nav (only for month/week) */}
        {view !== "day" && (
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600 text-xs px-1">&#8249;</button>
            <span className="text-xs font-semibold text-gray-700">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600 text-xs px-1">&#8250;</button>
          </div>
        )}

        {view === "month" && <MonthView year={year} month={month} events={events} />}
        {view === "week" && <WeekView year={year} month={month} events={events} />}
        {view === "day" && <DayView events={events} />}

        <GoalsTimeline />
      </div>
    </div>
  )
}
