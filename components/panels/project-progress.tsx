"use client"

import { useState } from "react"

/* ── Donut chart (large) ─────────────────────────────────── */
function DonutChart({
  pct,
  color,
  label,
  onEdit,
}: {
  pct: number
  color: string
  label: string
  onEdit: (val: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(String(pct))
  const R = 44
  const circ = 2 * Math.PI * R
  const dash = (pct / 100) * circ

  const commit = () => {
    setEditing(false)
    const n = Math.min(100, Math.max(0, parseInt(inputVal) || 0))
    onEdit(n)
    setInputVal(String(n))
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative cursor-pointer" onClick={() => setEditing(true)}>
        <svg width="108" height="108" viewBox="0 0 108 108">
          <circle cx="54" cy="54" r={R} fill="none" stroke="#e5e7eb" strokeWidth="9" />
          <circle
            cx="54" cy="54" r={R}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 54 54)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {editing ? (
            <input
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit() }}
              className="w-14 text-center text-sm font-bold border border-gray-300 rounded outline-none"
            />
          ) : (
            <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-gray-800">{label}</div>
        <div
          className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block"
          style={{ backgroundColor: color + "18", color }}
        >
          {pct >= 70 ? "On track" : pct >= 40 ? "In progress" : "Early stage"}
        </div>
      </div>
    </div>
  )
}

/* ── EXPORT ─────────────────────────────────────────────── */
export function ProjectProgressPanel() {
  const [charts, setCharts] = useState([
    { label: "LP GAP", pct: 67, color: "#7C3AED", category: "Work" },
    { label: "CASE TRACKER", pct: 90, color: "#2563EB", category: "Work" },
    { label: "KOMUNITA", pct: 30, color: "#16A34A", category: "Home" },
  ])

  const editChart = (i: number, val: number) =>
    setCharts((prev) => prev.map((c, idx) => idx === i ? { ...c, pct: val } : c))

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div
        className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0 bg-[#F9FAFB] rounded-t-lg"
        style={{ borderLeft: "3px solid #7C3AED", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">Projects Progress Charts</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] text-gray-400 mb-4">Click a percentage to edit it.</p>
        <div className="flex items-center justify-around gap-4">
          {charts.map((c, i) => (
            <DonutChart
              key={c.label}
              pct={c.pct}
              color={c.color}
              label={c.label}
              onEdit={(v) => editChart(i, v)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
