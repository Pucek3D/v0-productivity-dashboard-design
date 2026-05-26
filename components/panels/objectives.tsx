"use client"

import { useState } from "react"

/* ── types ───────────────────────────────────────────────── */
type ObjItem = {
  id: number
  text: string
  pct: number
}

const TIMEFRAMES = [
  "Q2 26","Q3 26","Q4 26","H1 26","H2 26","CY 2026",
  "Q1 27","Q2 27","Q3 27","Q4 27","H1 27","H2 27","CY 2027",
  "Q1 28","Q2 28","Q3 28","Q4 28","H1 28","H2 28","CY 2028",
]

/* ── ObjectiveRow ────────────────────────────────────────── */
function ObjectiveRow({
  obj,
  dotColor,
  barColor,
  onEdit,
  onPctChange,
}: {
  obj: ObjItem
  dotColor: string
  barColor: string
  onEdit: (id: number, val: string) => void
  onPctChange: (id: number, val: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [textVal, setTextVal] = useState(obj.text)

  return (
    <div className="py-1 group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        {editing ? (
          <input
            autoFocus
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onBlur={() => { setEditing(false); onEdit(obj.id, textVal) }}
            onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onEdit(obj.id, textVal) } }}
            className="flex-1 text-xs border border-gray-300 rounded px-1 outline-none"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className="flex-1 text-xs text-gray-700 cursor-text"
          >
            {obj.text || <span className="text-gray-300 italic">objective</span>}
          </span>
        )}
        <span className="text-[10px] font-semibold w-8 text-right flex-shrink-0" style={{ color: dotColor }}>
          {obj.pct}%
        </span>
      </div>
      <div className="flex items-center gap-2 pl-4">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${obj.pct}%`, backgroundColor: barColor }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={obj.pct}
          onChange={(e) => onPctChange(obj.id, parseInt(e.target.value))}
          className="w-16 h-1 accent-current flex-shrink-0"
          style={{ accentColor: barColor }}
        />
      </div>
    </div>
  )
}

/* ── ObjectiveSection ────────────────────────────────────── */
function ObjectiveSection({
  label,
  dotColor,
  barColor,
  initialItems,
}: {
  label: string
  dotColor: string
  barColor: string
  initialItems: { text: string; pct: number }[]
}) {
  const [items, setItems] = useState<ObjItem[]>(
    initialItems.map((it, i) => ({ id: i, ...it }))
  )
  const [nextId, setNextId] = useState(initialItems.length)

  const edit = (id: number, val: string) =>
    setItems((prev) => prev.map((o) => o.id === id ? { ...o, text: val } : o))
  const changePct = (id: number, val: number) =>
    setItems((prev) => prev.map((o) => o.id === id ? { ...o, pct: val } : o))
  const add = () => {
    setItems((prev) => [...prev, { id: nextId, text: "", pct: 0 }])
    setNextId((n) => n + 1)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: dotColor }}>
          {label}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((o) => (
          <ObjectiveRow
            key={o.id}
            obj={o}
            dotColor={dotColor}
            barColor={barColor}
            onEdit={edit}
            onPctChange={changePct}
          />
        ))}
      </div>
      <button
        onClick={add}
        className="text-[10px] text-gray-400 hover:text-gray-600 mt-1 transition-colors"
      >
        + Add objective
      </button>
    </div>
  )
}

/* ── EXPORT ─────────────────────────────────────────────── */
export function ObjectivesPanel() {
  const [timeframe, setTimeframe] = useState("Q2 26")

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">Objectives</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-[10px] border border-gray-200 rounded px-2 py-0.5 text-gray-600 bg-white outline-none cursor-pointer hover:border-gray-400 transition-colors"
        >
          {TIMEFRAMES.map((tf) => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-[10px] text-gray-400 mb-3 font-medium">Showing: {timeframe}</div>

        <ObjectiveSection
          label="Work objectives"
          dotColor="#7C3AED"
          barColor="#7C3AED"
          initialItems={[
            { text: "Deliver LP GAP final deck", pct: 67 },
            { text: "Complete Case Tracker v1", pct: 90 },
            { text: "Launch KOMUNITA Q2 campaign", pct: 45 },
          ]}
        />
        <ObjectiveSection
          label="Home objectives"
          dotColor="#16A34A"
          barColor="#16A34A"
          initialItems={[
            { text: "Establish morning routine 5x/wk", pct: 60 },
            { text: "Cook dinner 3x/wk", pct: 75 },
          ]}
        />
        <ObjectiveSection
          label="Other objectives"
          dotColor="#2563EB"
          barColor="#2563EB"
          initialItems={[
            { text: "Read 2 books this quarter", pct: 50 },
            { text: "Podcast episode — 4 eps", pct: 25 },
          ]}
        />
      </div>
    </div>
  )
}
