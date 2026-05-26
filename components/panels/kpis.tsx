"use client"

import { useState } from "react"

/* ── Sparkline ───────────────────────────────────────────── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const w = 64
  const h = 24
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`)
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── KPI row ─────────────────────────────────────────────── */
type KpiItem = {
  id: number
  icon: string
  label: string
  value: string
  target: string
  sparkData: number[]
  color: string
  borderColor: string
}

const INIT_KPIS: KpiItem[] = [
  { id: 0, icon: "✓", label: "Tasks Done", value: "7", target: "10", sparkData: [3, 5, 4, 7, 6, 8, 7], color: "#7C3AED", borderColor: "#7C3AED" },
  { id: 1, icon: "🛏", label: "Sleep", value: "6.5h", target: "7h", sparkData: [7, 6.5, 7.5, 6, 7, 6.5, 7], color: "#2563EB", borderColor: "#2563EB" },
  { id: 2, icon: "🎧", label: "Podcast", value: "1 ep", target: "1 ep", sparkData: [1, 0, 1, 1, 0, 1, 1], color: "#16A34A", borderColor: "#16A34A" },
  { id: 3, icon: "🏃", label: "Steps", value: "8k", target: "10k", sparkData: [6, 7, 9, 8, 10, 7, 8], color: "#d97706", borderColor: "#16A34A" },
]

function KpiRow({
  kpi,
  onEdit,
}: {
  kpi: KpiItem
  onEdit: (id: number, label: string, value: string) => void
}) {
  const [editLabel, setEditLabel] = useState(false)
  const [editValue, setEditValue] = useState(false)
  const [labelVal, setLabelVal] = useState(kpi.label)
  const [valueVal, setValueVal] = useState(kpi.value)

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white"
      style={{
        borderLeft: `3px solid ${kpi.borderColor}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Icon */}
      <span className="text-lg w-6 flex-shrink-0 text-center leading-none">{kpi.icon}</span>

      {/* Label */}
      <div className="flex flex-col min-w-0 flex-1">
        {editLabel ? (
          <input
            autoFocus
            value={labelVal}
            onChange={(e) => setLabelVal(e.target.value)}
            onBlur={() => { setEditLabel(false); onEdit(kpi.id, labelVal, kpi.value) }}
            onKeyDown={(e) => { if (e.key === "Enter") { setEditLabel(false); onEdit(kpi.id, labelVal, kpi.value) } }}
            className="text-xs border border-gray-300 rounded px-1 outline-none w-full"
          />
        ) : (
          <span
            onClick={() => setEditLabel(true)}
            className="text-[11px] text-gray-500 cursor-text truncate font-medium"
          >
            {kpi.label}
          </span>
        )}

        {/* Value */}
        <div className="flex items-baseline gap-1 mt-0.5">
          {editValue ? (
            <input
              autoFocus
              value={valueVal}
              onChange={(e) => setValueVal(e.target.value)}
              onBlur={() => { setEditValue(false); onEdit(kpi.id, kpi.label, valueVal) }}
              onKeyDown={(e) => { if (e.key === "Enter") { setEditValue(false); onEdit(kpi.id, kpi.label, valueVal) } }}
              className="w-16 text-sm border border-gray-300 rounded px-1 outline-none font-bold"
            />
          ) : (
            <span
              onClick={() => setEditValue(true)}
              className="text-lg font-bold cursor-text leading-none"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </span>
          )}
          <span className="text-[10px] text-gray-400">/ {kpi.target}</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="flex-shrink-0">
        <Sparkline values={kpi.sparkData} color={kpi.color} />
      </div>
    </div>
  )
}

/* ── Donut chart ─────────────────────────────────────────── */
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
  const R = 38
  const circ = 2 * Math.PI * R
  const dash = (pct / 100) * circ

  const commit = () => {
    setEditing(false)
    const n = Math.min(100, Math.max(0, parseInt(inputVal) || 0))
    onEdit(n)
    setInputVal(String(n))
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative cursor-pointer"
        onClick={() => !editing && setEditing(true)}
        title="Click to edit"
      >
        <svg width="92" height="92" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={R} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          <circle
            cx="46" cy="46" r={R}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 46 46)"
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
              className="w-12 text-center text-sm font-bold border border-gray-300 rounded outline-none"
            />
          ) : (
            <span className="text-base font-bold" style={{ color }}>{pct}%</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">{label}</div>
        <div
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
          style={{ backgroundColor: color + "18", color }}
        >
          {pct >= 70 ? "On track" : pct >= 40 ? "In progress" : "Early stage"}
        </div>
      </div>
    </div>
  )
}

/* ── EXPORT ─────────────────────────────────────────────── */
export function KpisPanel() {
  const [kpis, setKpis] = useState<KpiItem[]>(INIT_KPIS)
  const [donuts, setDonuts] = useState([
    { label: "LP GAP", pct: 67, color: "#7C3AED" },
    { label: "CASE TRACKER", pct: 90, color: "#2563EB" },
    { label: "KOMUNITA", pct: 30, color: "#16A34A" },
  ])

  const editKpi = (id: number, label: string, value: string) =>
    setKpis((prev) => prev.map((k) => k.id === id ? { ...k, label, value } : k))

  const editDonut = (i: number, val: number) =>
    setDonuts((prev) => prev.map((d, idx) => idx === i ? { ...d, pct: val } : d))

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Section header — elevated */}
      <div
        className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0 bg-[#F9FAFB] rounded-t-lg"
        style={{ borderLeft: "3px solid #7C3AED", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">KPIs to Track</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* KPI rows */}
        <div className="mb-4">
          {kpis.map((k) => (
            <KpiRow key={k.id} kpi={k} onEdit={editKpi} />
          ))}
        </div>

        {/* Donut section */}
        <div
          className="bg-white rounded-lg border border-gray-100 p-3"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Project Progress</div>
          <div className="flex justify-around">
            {donuts.map((d, i) => (
              <DonutChart key={d.label} pct={d.pct} color={d.color} label={d.label} onEdit={(v) => editDonut(i, v)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
