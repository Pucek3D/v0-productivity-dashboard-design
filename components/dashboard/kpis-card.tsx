'use client'
import React, { useState, useEffect } from 'react'
import {
  IconMoon, IconRun, IconCheckbox, IconChartCandle,
  IconPigMoney, IconMicrophone, IconMessage
} from '@tabler/icons-react'
import { KPI_CATEGORIES, KPI_DAYS, pastel, KpiCategory, Kpi } from '@/lib/data'

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  moon: IconMoon,
  run: IconRun,
  checkbox: IconCheckbox,
  'chart-candle': IconChartCandle,
  'piggy-bank': IconPigMoney,
  microphone: IconMicrophone,
  message: IconMessage,
}

function totalDone(days: number[]): number {
  return days.reduce((sum, d) => sum + (d ? 1 : 0), 0)
}

function getMondayStartIdx(): number {
  const jsDay = new Date().getDay()
  return (jsDay + 6) % 7
}

export function KpisCard() {
  const [view, setView] = useState<'day' | 'week'>('day')
  const [todayIdx, setTodayIdx] = useState(0)
  useEffect(() => { setTodayIdx(getMondayStartIdx()) }, [])

  const [categories, setCategories] = useState<KpiCategory[]>(() =>
    KPI_CATEGORIES.map(cat => ({
      ...cat,
      kpis: cat.kpis.map(k => ({ ...k, streak: totalDone(k.days) })),
    }))
  )

  const toggleDay = (catId: string, kpiId: string, dayIdx: number) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        kpis: cat.kpis.map(k => {
          if (k.id !== kpiId) return k
          const newDays = [...k.days]
          newDays[dayIdx] = newDays[dayIdx] === 1 ? 0 : 1
          const newChecked = k.type === 'check' ? newDays[todayIdx] === 1 : k.checked
          return { ...k, days: newDays, streak: totalDone(newDays), checked: newChecked }
        }),
      }
    }))
  }

  return (
    <div className="card-base 'halo-teal">
      <div className="section-header header-teal px-4 py-2.5">
        <div className="flex justify-between items-center">
          <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
            KPIs to track
          </span>
          <div className="seg-toggle flex">
            <button
              onClick={() => setView('day')}
              className={`seg-toggle-btn px-1.5 py-0.5 text-[9.5px] uppercase ${
                view === 'day' ? 'seg-toggle-btn-active' : 'seg-toggle-btn-inactive'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`seg-toggle-btn px-1.5 py-0.5 text-[9.5px] uppercase ${
                view === 'week' ? 'seg-toggle-btn-active' : 'seg-toggle-btn-inactive'
              }`}
            >
              Wk
            </button>
          </div>
        </div>
      </div>
      <div className="px-3.5 py-3">
        {view === 'day' ? (
          <DayView categories={categories} toggleDay={toggleDay} todayIdx={todayIdx} />
        ) : (
          <WeekView categories={categories} toggleDay={toggleDay} todayIdx={todayIdx} />
        )}
      </div>
    </div>
  )
}

function DotRow({
  kpi, cat, toggleDay, todayIdx,
}: {
  kpi: Kpi
  cat: KpiCategory
  toggleDay: (catId: string, kpiId: string, dayIdx: number) => void
  todayIdx: number
}) {
  return (
    <div style={{ marginBottom: kpi.type === 'num' ? '3px' : '0' }}>
      <div className="flex gap-1 mb-0.5">
        {kpi.days.map((d, i) => (
          <button
            key={i}
            onClick={() => toggleDay(cat.id, kpi.id, i)}
            className="w-[12px] h-[12px] rounded-full flex-shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{
              background: d ? cat.color : 'rgba(255,255,255,0.08)',
              boxShadow: i === todayIdx ? `0 0 0 1.5px ${pastel(cat.color, 0.55)}` : 'none',
            }}
            title={`${KPI_DAYS[i]}: ${d ? 'done — click to undo' : 'not done — click to mark'}`}
          />
        ))}
      </div>
      <div className="flex gap-1">
        {KPI_DAYS.map((d, i) => (
          <div
            key={i}
            className="w-[12px] text-center text-[8px] tabular"
            style={{
              fontWeight: i === todayIdx ? 700 : 500,
              color: i === todayIdx ? cat.color : '#475569',
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
  categories, toggleDay, todayIdx,
}: {
  categories: KpiCategory[]
  toggleDay: (catId: string, kpiId: string, dayIdx: number) => void
  todayIdx: number
}) {
  return (
    <>
      {categories.map((cat, ci) => (
        <div key={cat.id}>
          {ci > 0 && <div className="h-px bg-white/5 my-2.5" />}
          <div
            className="text-[9.5px] font-semibold tracking-[0.14em] uppercase mb-2 flex items-center gap-1.5"
            style={{ color: cat.color }}
          >
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
            {cat.label}
          </div>
          {cat.kpis.map((k, ki) => {
            const Icon = ICONS[k.icon]
            return (
              <div key={k.id} style={{ marginTop: ki > 0 ? '8px' : '0' }}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {Icon && (
                      <span style={{ color: cat.color, opacity: 0.7 }}>
                        <Icon size={12} />
                      </span>
                    )}
                    <span className="text-[12px] font-medium text-slate-200 truncate">{k.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {k.type === 'num' && k.val && k.target && (
                      <span className="font-display text-[13px] tabular leading-none" style={{ color: cat.color }}>
                        {k.val}<span className="text-slate-500"> / {k.target}</span>
                      </span>
                    )}
                    {k.streak > 0 && (
                      <span
                        className="text-[9px] font-bold rounded-full px-1.5 py-[1px] whitespace-nowrap tabular uppercase tracking-wider"
                        style={{ background: `${cat.color}22`, color: cat.color }}
                      >
                        🔥 {k.streak}
                      </span>
                    )}
                  </div>
                </div>
                <DotRow kpi={k} cat={cat} toggleDay={toggleDay} todayIdx={todayIdx} />
                {k.type === 'num' && k.val && k.target && (
                  <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${k.pct}%`, background: cat.color }}
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

function WeekView({
  categories, toggleDay, todayIdx,
}: {
  categories: KpiCategory[]
  toggleDay: (catId: string, kpiId: string, dayIdx: number) => void
  todayIdx: number
}) {
  let bestStreak = { label: '', streak: 0 }

  return (
    <>
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col style={{ width: '50px' }} />
          {KPI_DAYS.map((_, i) => <col key={i} style={{ width: '14px' }} />)}
          <col style={{ width: '20px' }} />
        </colgroup>
        <thead>
          <tr>
            <th />
            {KPI_DAYS.map((d, i) => (
              <th
                key={i}
                className="text-[8.5px] text-center pb-1 uppercase tabular"
                style={{
                  fontWeight: i === todayIdx ? 800 : 600,
                  color: i === todayIdx ? '#818cf8' : '#64748b',
                }}
              >
                {d}
              </th>
            ))}
            <th className="text-[8.5px] text-slate-500 text-right pb-1 font-semibold uppercase">%</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <React.Fragment key={cat.id}>
              <tr>
                <td colSpan={9} className="pt-2 pb-1">
                  <span
                    className="text-[9px] font-semibold tracking-[0.14em] uppercase flex items-center gap-1.5"
                    style={{ color: cat.color }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    {cat.label}
                  </span>
                </td>
              </tr>
              {cat.kpis.map(k => {
                const done = k.days.filter(Boolean).length
                const pct = Math.round((done / k.days.length) * 100)
                const pctColor = pct >= 80 ? '#2dd4bf' : pct >= 50 ? '#fbbf24' : '#64748b'
                if (k.streak > bestStreak.streak) bestStreak = { label: k.label, streak: k.streak }
                return (
                  <tr key={k.id}>
                    <td className="text-[10.5px] font-medium text-slate-200 py-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                      {k.label}
                    </td>
                    {k.days.map((d, i) => (
                      <td key={i} className="text-center py-0.5 px-0">
                        <button
                          onClick={() => toggleDay(cat.id, k.id, i)}
                          className="w-[9px] h-[9px] rounded-full mx-auto cursor-pointer hover:scale-125 transition-transform block"
                          style={{
                            background: d ? cat.color : 'rgba(255,255,255,0.08)',
                            boxShadow: i === todayIdx ? `0 0 0 1.5px ${pastel(cat.color, 0.65)}` : 'none',
                          }}
                        />
                      </td>
                    ))}
                    <td
                      className="text-right text-[10px] font-bold py-0.5 tabular"
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
      {bestStreak.streak > 0 && (
        <div className="mt-3 pt-2 border-t border-white/5 flex gap-2 items-center flex-wrap">
          <span className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold">Most done</span>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.15)' }}
          >
            🔥 {bestStreak.label} — {bestStreak.streak}d
          </span>
        </div>
      )}
    </>
  )
}