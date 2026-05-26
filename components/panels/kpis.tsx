"use client"

import { useState } from "react"

/* ── Sparkline ───────────────────────────────────────────── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  const w = 56
  const h = 20
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
}

const INIT_KPIS: KpiItem[] = [
  { id: 0, icon: "✓", label: "# Done", value: "7", target: "10", sparkData: [3, 5, 4, 7, 6, 8, 7], color: "#7C3AED" },
  { id: 1, icon: "🛏", label: "Sleep", value: "6.5h", target: "7h", sparkData: [7, 6.5, 7.5, 6, 7, 6.5, 7], color: "#2563EB" },
  { id: 2, icon: "🎧", label: "Podcast", value: "1 ep", target: "1 ep", sparkData: [1, 0, 1, 1, 0, 1, 1], color: "#16A34A" },
  { id: 3, icon: "🏃", label: "Steps", value: "8k", target: "10k", sparkData: [6, 7, 9, 8, 10, 7, 8], color: "#f59e0b" },
]

function KpiRow({ kpi, onEdit }: { kpi: KpiItem; onEdit: (id: number, label: string, value: string) => void }) {
  const [editLabel, setEditLabel] = useState(false)
  const [editValue, setEditValue] = useState(false)
  const [labelVal, setLabelVal] = useState(kpi.label)
  const [valueVal, setValueVal] = useState(kpi.value)

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-base w-5 flex-shrink-0 text-center leading-none">{kpi.icon}</span>
      {editLabel ? (
        <input
          autoFocus
          value={labelVal}
          onChange={(e) => setLabelVal(e.target.value)}
          onBlur={() => { setEditLabel(false); onEdit(kpi.id, labelVal, kpi.value) }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditLabel(false); onEdit(kpi.id, labelVal, kpi.value) } }}
          className="w-20 text-xs border border-gray-300 rounded px-1 outline-none"
        />
      ) : (
        <span onClick={() => setEditLabel(true)} className="text-xs text-gray-700 cursor-text w-20 flex-shrink-0 truncate">{kpi.label}</span>
      )}
      {editValue ? (
        <input
          autoFocus
          value={valueVal}
          onChange={(e) => setValueVal(e.target.value)}
          onBlur={() => { setEditValue(false); onEdit(kpi.id, kpi.label, valueVal) }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditValue(false); onEdit(kpi.id, kpi.label, valueVal) } }}
          className="w-12 text-xs border border-gray-300 rounded px-1 outline-none"
        />
      ) : (
        <span onClick={() => setEditValue(true)} className="text-xs font-semibold cursor-text w-10 flex-shrink-0" style={{ color: kpi.color }}>
          {kpi.value}
        </span>
      )}
      <span className="text-[10px] text-gray-400 flex-shrink-0">/ {kpi.target}</span>
      <div className="ml-auto">
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
  const R = 28
  const circ = 2 * Math.PI * R
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative cursor-pointer" onClick={() => setEditing(true)}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={R} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={R}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {editing ? (
            <input
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={() => {
                setEditing(false)
                const n = Math.min(100, Math.max(0, parseInt(inputVal) || 0))
                onEdit(n)
                setInputVal(String(n))
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditing(false)
                  const n = Math.min(100, Math.max(0, parseInt(inputVal) || 0))
                  onEdit(n)
                  setInputVal(String(n))
                }
              }}
              className="w-10 text-center text-xs font-bold border border-gray-300 rounded outline-none"
            />
          ) : (
            <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{label}</span>
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
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">KPIs to Track</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-4">
          {kpis.map((k) => (
            <KpiRow key={k.id} kpi={k} onEdit={editKpi} />
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Project Progress</div>
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
