'use client'

import React, { useState } from 'react'
import { 
  IconMoon, IconRun, IconCheckbox, IconChartCandle, 
  IconPigMoney, IconMicrophone, IconMessage 
} from '@tabler/icons-react'
import { KPI_CATEGORIES, KPI_DAYS, TODAY_IDX, pastel, KpiCategory, Kpi } from '@/lib/data'

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  moon: IconMoon,
  run: IconRun,
  checkbox: IconCheckbox,
  'chart-candle': IconChartCandle,
  'piggy-bank': IconPigMoney,
  microphone: IconMicrophone,
  message: IconMessage,
}

export function KpisCard() {
  const [view, setView] = useState<'day' | 'week'>('day')
  const [categories, setCategories] = useState<KpiCategory[]>(KPI_CATEGORIES)

  const toggleKpi = (catId: string, kpiId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        kpis: cat.kpis.map(k => {
          if (k.id !== kpiId || k.type !== 'check') return k
          const newChecked = !k.checked
          const newDays = [...k.days]
          newDays[TODAY_IDX] = newChecked ? 1 : 0
          return { ...k, checked: newChecked, days: newDays }
        })
      }
    }))
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#6d28d9] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
            KPIs to track
          </span>
          <div className="flex bg-white/[0.18] rounded-[5px] overflow-hidden">
            <button
              onClick={() => setView('day')}
              className={`px-2 py-[3px] border-none cursor-pointer text-[10px] font-bold ${
                view === 'day' ? 'bg-white/30 text-white' : 'bg-transparent text-white/60'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-2 py-[3px] border-none cursor-pointer text-[10px] font-bold ${
                view === 'week' ? 'bg-white/30 text-white' : 'bg-transparent text-white/60'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>
      <div className="p-[11px_13px]">
        {view === 'day' ? (
          <DayView categories={categories} toggleKpi={toggleKpi} />
        ) : (
          <WeekView categories={categories} />
        )}
      </div>
    </div>
  )
}

function DotRow({ kpi, cat }: { kpi: Kpi; cat: KpiCategory }) {
  return (
    <div style={{ marginBottom: kpi.type === 'num' ? '3px' : '0' }}>
      <div className="flex gap-1 mb-0.5">
        {kpi.days.map((d, i) => (
          <div
            key={i}
            className="w-[9px] h-[9px] rounded-full flex-shrink-0"
            style={{ background: d ? pastel(cat.color, 0.42) : '#ececec' }}
          />
        ))}
      </div>
      <div className="flex gap-1">
        {KPI_DAYS.map((d, i) => (
          <div
            key={i}
            className="w-[9px] text-center text-[7px]"
            style={{ 
              fontWeight: i === TODAY_IDX ? 800 : 400,
              color: i === TODAY_IDX ? cat.color : '#d1d5db'
            }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({ 
  categories, 
  toggleKpi 
}: { 
  categories: KpiCategory[]
  toggleKpi: (catId: string, kpiId: string) => void 
}) {
  return (
    <>
      {categories.map((cat, ci) => (
        <div key={cat.id}>
          {ci > 0 && <div className="h-px bg-[#f9fafb] my-[9px] mb-[7px]" />}
          <div
            className="text-[9px] font-extrabold tracking-[0.06em] uppercase px-[7px] py-[3px] rounded inline-block mb-1.5"
            style={{ background: pastel(cat.color, 0.88), color: cat.color }}
          >
            {cat.label}
          </div>
          {cat.kpis.map((k, ki) => {
            const Icon = ICONS[k.icon]
            return (
              <div key={k.id} style={{ marginTop: ki > 0 ? '7px' : '0' }}>
                <div className="flex justify-between items-center mb-[3px]">
                  <div className="flex items-center gap-1.5">
                    {Icon && (
                      <span style={{ color: pastel(cat.color, 0.3) }}>
                        <Icon size={13} />
                      </span>
                    )}
                    <span className="text-[11.5px] font-semibold text-[#374151]">{k.label}</span>
                  </div>
                  <div className="flex items-center gap-[5px]">
                    {k.type === 'num' ? (
                      <span className="text-[11px] font-bold" style={{ color: cat.color }}>
                        {k.val} / {k.target}
                      </span>
                    ) : (
                      <div
                        onClick={() => toggleKpi(cat.id, k.id)}
                        className="w-3.5 h-3.5 rounded-[3px] border-[1.5px] flex items-center justify-center cursor-pointer flex-shrink-0"
                        style={{
                          background: k.checked ? pastel(cat.color, 0.45) : 'transparent',
                          borderColor: k.checked ? pastel(cat.color, 0.45) : '#e5e7eb',
                        }}
                      >
                        {k.checked && (
                          <span style={{ color: cat.color, fontSize: '9px', fontWeight: 800 }}>✓</span>
                        )}
                      </div>
                    )}
                    <span
                      className="text-[10px] font-bold rounded-full px-[5px] py-[1px] whitespace-nowrap"
                      style={{ background: pastel(cat.color, 0.88), color: cat.color }}
                    >
                      🔥 {k.streak}
                    </span>
                  </div>
                </div>
                <DotRow kpi={k} cat={cat} />
                {k.type === 'num' && (
                  <div className="h-[3px] bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${k.pct}%`, background: pastel(cat.color, 0.45) }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}

function WeekView({ categories }: { categories: KpiCategory[] }) {
  let bestStreak = { label: '', streak: 0 }

  return (
    <>
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col style={{ width: '72px' }} />
          {KPI_DAYS.map((_, i) => <col key={i} style={{ width: '18px' }} />)}
          <col style={{ width: '26px' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="text-[9px] text-[#9ca3af] text-left p-[2px_0] font-bold" />
            {KPI_DAYS.map((d, i) => (
              <th
                key={i}
                className="text-[9px] text-center p-[2px_0]"
                style={{
                  fontWeight: i === TODAY_IDX ? 800 : 600,
                  color: i === TODAY_IDX ? '#7c3aed' : '#9ca3af',
                }}
              >
                {i === TODAY_IDX ? <u>{d}</u> : d}
              </th>
            ))}
            <th className="text-[9px] text-[#9ca3af] text-right p-[2px_0] font-bold">%</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <React.Fragment key={cat.id}>
              <tr>
                <td colSpan={9} className="py-[5px_0_2px]">
                  <span
                    className="text-[9px] font-extrabold tracking-[0.05em] uppercase px-[5px] py-[2px] rounded-[3px]"
                    style={{ background: pastel(cat.color, 0.88), color: cat.color }}
                  >
                    {cat.label}
                  </span>
                </td>
              </tr>
              {cat.kpis.map(k => {
                const done = k.days.filter(Boolean).length
                const pct = Math.round((done / k.days.length) * 100)
                const pctColor = pct >= 80 ? '#059669' : pct >= 50 ? '#d97706' : '#9ca3af'
                if (k.streak > bestStreak.streak) bestStreak = { label: k.label, streak: k.streak }
                return (
                  <tr key={k.id}>
                    <td className="text-[9.5px] font-semibold text-[#374151] p-[2px_0] overflow-hidden text-ellipsis whitespace-nowrap">
                      {k.label}
                    </td>
                    {k.days.map((d, i) => (
                      <td key={i} className="text-center p-[2px_1px]">
                        <div
                          className="w-[9px] h-[9px] rounded-full mx-auto"
                          style={{
                            background: d ? pastel(cat.color, 0.42) : '#ececec',
                            boxShadow: i === TODAY_IDX ? `0 0 0 2px ${pastel(cat.color, 0.65)}` : 'none',
                          }}
                        />
                      </td>
                    ))}
                    <td
                      className="text-right text-[9.5px] font-bold p-[2px_0]"
                      style={{ color: pctColor }}
                    >
                      {pct}%
                    </td>
                  </tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="mt-[9px] pt-[7px] border-t border-[#f9fafb] flex gap-[7px] items-center">
        <span className="text-[9px] text-[#9ca3af]">Best streak:</span>
        <span
          className="text-[9.5px] font-bold px-[7px] py-[1px] rounded-full"
          style={{ color: '#d97706', background: pastel('#d97706', 0.88) }}
        >
          🔥 {bestStreak.label} — {bestStreak.streak} days
        </span>
      </div>
    </>
  )
}
