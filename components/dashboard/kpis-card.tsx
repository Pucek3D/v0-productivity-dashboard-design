'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
  IconMoon, IconRun, IconCheckbox, IconChartCandle,
  IconPigMoney, IconMicrophone, IconMessage, IconPlus, IconTrash, IconTargetArrow,
} from '@tabler/icons-react'
import { KPI_CATEGORIES, KPI_CATEGORY_PALETTE, KPI_DAYS, pastel, KpiCategory, Kpi } from '@/lib/data'
import { closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ClientDnd } from './client-dnd'
import { useMounted } from '@/lib/use-mounted'

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  moon: IconMoon,
  run: IconRun,
  checkbox: IconCheckbox,
  'chart-candle': IconChartCandle,
  'piggy-bank': IconPigMoney,
  microphone: IconMicrophone,
  message: IconMessage,
}

const STORAGE_KEY = 'dashboard:kpis:v1'

function totalDone(days: number[]): number {
  return days.reduce((sum, d) => sum + (d ? 1 : 0), 0)
}

function getMondayStartIdx(): number {
  const jsDay = new Date().getDay()
  return (jsDay + 6) % 7
}

function withStreaks(cats: KpiCategory[]): KpiCategory[] {
  return cats.map(cat => ({ ...cat, kpis: cat.kpis.map(k => ({ ...k, streak: totalDone(k.days) })) }))
}

/** Smooth red → yellow → green hue based on how close `done` is to `target`. */
function ringColor(done: number, target: number): string {
  if (target <= 0 || done <= 0) return '#475569'
  const pct = Math.min(1, done / target)
  const hue = Math.round(pct * 140) // 0deg red → 140deg green (passes through yellow)
  return `hsl(${hue}, 78%, 52%)`
}

/* ── Activity-style progress ring (done / weekly target) ── */
function ProgressRing({ done, target, size = 22, stroke = 3 }: { done: number; target: number; size?: number; stroke?: number }) {
  const pct = target > 0 ? Math.min(1, done / target) : 0
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const color = ringColor(done, target)
  const complete = target > 0 && done >= target
  return (
    <span className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}
      title={`${done} of ${target}× this week${complete ? ' — goal reached' : ''}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ transition: 'stroke-dashoffset .5s ease, stroke .5s ease' }} />
      </svg>
      <span className="absolute text-[8px] font-bold tabular leading-none" style={{ color: complete ? color : '#cbd5e1' }}>{done}</span>
    </span>
  )
}

/* ── Double-click-to-edit text ── */
function EditableLabel({ value, onChange, className, style }: { value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select() } }, [editing])
  useEffect(() => { setDraft(value) }, [value])
  const commit = () => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }
  if (editing) return (
    <input ref={ref} value={draft} onPointerDown={(e) => e.stopPropagation()} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value) } }}
      className={className} style={{ ...style, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 4, padding: '0 4px', outline: 'none', maxWidth: 140 }} />
  )
  return <span className={className} style={{ ...style, cursor: 'text' }} title="Double-click to rename" onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

/* ── Weekly target stepper (1-7), edited inline ── */
function TargetEditor({ value, color, onChange }: { value: number; color: string; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const clamp = (n: number) => Math.max(1, Math.min(7, n))
  if (editing) {
    return (
      <span className="inline-flex items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => onChange(clamp(value - 1))} className="w-3.5 h-3.5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 text-[11px] leading-none">−</button>
        <span className="text-[10px] font-bold tabular w-6 text-center" style={{ color }}>{value}×</span>
        <button onClick={() => onChange(clamp(value + 1))} className="w-3.5 h-3.5 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 text-[11px] leading-none">+</button>
        <button onClick={() => setEditing(false)} className="text-[8px] text-slate-500 hover:text-white ml-0.5 uppercase">ok</button>
      </span>
    )
  }
  return (
    <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setEditing(true)} title="Set weekly goal"
      className="text-[9.5px] font-semibold tabular rounded px-1 py-[1px] hover:bg-white/10 transition-colors flex items-center gap-0.5"
      style={{ color: '#94a3b8' }}>
      /{value}×<span className="text-[8px] text-slate-500">wk</span>
    </button>
  )
}

export function KpisCard() {
  const [view, setView] = useState<'day' | 'week'>('day')
  const [todayIdx, setTodayIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setTodayIdx(getMondayStartIdx()) }, [])

  const [categories, setCategories] = useState<KpiCategory[]>(() => withStreaks(KPI_CATEGORIES))

  // Hydrate from localStorage after mount (KPIs are configured once, tracked for weeks).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setCategories(withStreaks(parsed))
      }
    } catch { /* ignore malformed storage */ }
    setLoaded(true)
  }, [])

  // Persist on every change once hydrated.
  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(categories)) } catch { /* quota / private mode */ }
  }, [categories, loaded])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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

  const editKpi = (catId: string, kpiId: string, patch: Partial<Kpi>) =>
    setCategories(prev => prev.map(cat => cat.id !== catId ? cat : { ...cat, kpis: cat.kpis.map(k => k.id === kpiId ? { ...k, ...patch } : k) }))

  const addKpi = (catId: string) =>
    setCategories(prev => prev.map(cat => cat.id !== catId ? cat : {
      ...cat,
      kpis: [...cat.kpis, { id: `k${Date.now()}`, label: 'New KPI', icon: 'checkbox', type: 'check', checked: false, weeklyTarget: 7, streak: 0, days: [0, 0, 0, 0, 0, 0, 0] }],
    }))

  const deleteKpi = (catId: string, kpiId: string) =>
    setCategories(prev => prev.map(cat => cat.id !== catId ? cat : { ...cat, kpis: cat.kpis.filter(k => k.id !== kpiId) }))

  const editCategory = (catId: string, label: string) =>
    setCategories(prev => prev.map(cat => cat.id === catId ? { ...cat, label } : cat))

  const deleteCategory = (catId: string) =>
    setCategories(prev => prev.filter(cat => cat.id !== catId))

  const addCategory = () =>
    setCategories(prev => [
      ...prev,
      { id: `c${Date.now()}`, label: 'New category', color: KPI_CATEGORY_PALETTE[prev.length % KPI_CATEGORY_PALETTE.length], kpis: [] },
    ])

  // Reorder KPIs within a single category (cross-category moves are intentionally
  // not allowed — each category keeps its own ordering). Used by the Day view,
  // which has one DndContext per category.
  const handleDragEnd = (catId: string) => (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat
      const oi = cat.kpis.findIndex(k => k.id === active.id)
      const ni = cat.kpis.findIndex(k => k.id === over.id)
      return oi >= 0 && ni >= 0 ? { ...cat, kpis: arrayMove([...cat.kpis], oi, ni) } : cat
    }))
  }

  const handleWeekDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setCategories(prev => {
      const cat = prev.find(c => c.kpis.some(k => k.id === active.id))
      if (!cat || !cat.kpis.some(k => k.id === over.id)) return prev
      return prev.map(c => {
        if (c.id !== cat.id) return c
        const oi = c.kpis.findIndex(k => k.id === active.id)
        const ni = c.kpis.findIndex(k => k.id === over.id)
        return oi >= 0 && ni >= 0 ? { ...c, kpis: arrayMove([...c.kpis], oi, ni) } : c
      })
    })
  }

  return (
    <div className="card-base halo-teal">
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
          <DayView categories={categories} toggleDay={toggleDay} todayIdx={todayIdx} sensors={sensors} handleDragEnd={handleDragEnd}
            editKpi={editKpi} addKpi={addKpi} deleteKpi={deleteKpi} editCategory={editCategory} deleteCategory={deleteCategory} addCategory={addCategory} />
        ) : (
          <WeekView categories={categories} toggleDay={toggleDay} todayIdx={todayIdx} sensors={sensors} onDragEnd={handleWeekDragEnd} />
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
            onPointerDown={(e) => e.stopPropagation()}
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

function SortableKpiDay({
  kpi: k, cat, ki, toggleDay, todayIdx, editKpi, deleteKpi,
}: {
  kpi: Kpi
  cat: KpiCategory
  ki: number
  toggleDay: (catId: string, kpiId: string, dayIdx: number) => void
  todayIdx: number
  editKpi: (catId: string, kpiId: string, patch: Partial<Kpi>) => void
  deleteKpi: (catId: string, kpiId: string) => void
}) {
  const mounted = useMounted()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: k.id })
  const dndProps = mounted ? { ...attributes, ...listeners } : {}
  const Icon = ICONS[k.icon]
  const done = totalDone(k.days)
  const target = k.weeklyTarget ?? 7
  return (
    <div
      ref={setNodeRef}
      {...dndProps}
      className="cursor-grab active:cursor-grabbing select-none group/kpi"
      style={{
        marginTop: ki > 0 ? '8px' : '0',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="flex justify-between items-center mb-1 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <span style={{ color: cat.color, opacity: 0.7 }} className="flex-shrink-0">
              <Icon size={12} />
            </span>
          )}
          <EditableLabel value={k.label} onChange={(v) => editKpi(cat.id, k.id, { label: v })} className="text-[12px] font-medium text-slate-200 truncate" />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {k.type === 'check' && <TargetEditor value={target} color={cat.color} onChange={(v) => editKpi(cat.id, k.id, { weeklyTarget: v })} />}
          {k.type === 'num' && k.val && k.target && (
            <span className="font-display text-[13px] tabular leading-none" style={{ color: cat.color }}>
              {k.val}<span className="text-slate-500"> / {k.target}</span>
            </span>
          )}
          {k.type === 'check' && <ProgressRing done={done} target={target} />}
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => deleteKpi(cat.id, k.id)}
            className="opacity-0 group-hover/kpi:opacity-100 transition-opacity text-slate-600 hover:text-rose-400 flex-shrink-0" title="Delete KPI">
            <IconTrash size={11} />
          </button>
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
}

function DayView({
  categories, toggleDay, todayIdx, sensors, handleDragEnd, editKpi, addKpi, deleteKpi, editCategory, deleteCategory, addCategory,
}: {
  categories: KpiCategory[]
  toggleDay: (catId: string, kpiId: string, dayIdx: number) => void
  todayIdx: number
  sensors: ReturnType<typeof useSensors>
  handleDragEnd: (catId: string) => (e: DragEndEvent) => void
  editKpi: (catId: string, kpiId: string, patch: Partial<Kpi>) => void
  addKpi: (catId: string) => void
  deleteKpi: (catId: string, kpiId: string) => void
  editCategory: (catId: string, label: string) => void
  deleteCategory: (catId: string) => void
  addCategory: () => void
}) {
  return (
    <>
      {categories.map((cat, ci) => (
        <div key={cat.id} className="group/cat">
          {ci > 0 && <div className="h-px bg-white/5 my-2.5" />}
          <div className="flex items-center justify-between mb-2">
            <div
              className="text-[9.5px] font-semibold tracking-[0.14em] uppercase flex items-center gap-1.5"
              style={{ color: cat.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <EditableLabel value={cat.label} onChange={(v) => editCategory(cat.id, v)} className="tracking-[0.14em]" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => addKpi(cat.id)} className="text-slate-600 hover:text-slate-300 transition-colors" title="Add KPI">
                <IconPlus size={12} />
              </button>
              <button onClick={() => deleteCategory(cat.id)} className="opacity-0 group-hover/cat:opacity-100 transition-opacity text-slate-700 hover:text-rose-400" title="Delete category">
                <IconTrash size={11} />
              </button>
            </div>
          </div>
          <ClientDnd sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(cat.id)}>
            <SortableContext items={cat.kpis.map(k => k.id)} strategy={verticalListSortingStrategy}>
              {cat.kpis.map((k, ki) => (
                <SortableKpiDay key={k.id} kpi={k} cat={cat} ki={ki} toggleDay={toggleDay} todayIdx={todayIdx} editKpi={editKpi} deleteKpi={deleteKpi} />
              ))}
            </SortableContext>
          </ClientDnd>
          {cat.kpis.length === 0 && (
            <button onClick={() => addKpi(cat.id)} className="w-full text-[10px] text-slate-600 hover:text-slate-400 italic py-1.5 flex items-center justify-center gap-1">
              <IconPlus size={10} /> Add a KPI
            </button>
          )}
        </div>
      ))}
      <button onClick={addCategory} className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 hover:text-slate-200 border border-dashed border-white/10 hover:border-white/25 rounded-lg py-2 transition-colors">
        <IconTargetArrow size={13} /> Add category
      </button>
    </>
  )
}

function SortableKpiWeek({
  kpi: k, cat, toggleDay, todayIdx,
}: {
  kpi: Kpi
  cat: KpiCategory
  toggleDay: (catId: string, kpiId: string, dayIdx: number) => void
  todayIdx: number
}) {
  const mounted = useMounted()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: k.id })
  const dndProps = mounted ? { ...attributes, ...listeners } : {}
  const done = totalDone(k.days)
  const target = k.weeklyTarget ?? 7
  return (
    <tr
      ref={setNodeRef}
      {...dndProps}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <td className="text-[10.5px] font-medium text-slate-200 py-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
        {k.label}
      </td>
      {k.days.map((d, i) => (
        <td key={i} className="text-center py-0.5 px-0">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => toggleDay(cat.id, k.id, i)}
            className="w-[9px] h-[9px] rounded-full mx-auto cursor-pointer hover:scale-125 transition-transform block"
            style={{
              background: d ? cat.color : 'rgba(255,255,255,0.08)',
              boxShadow: i === todayIdx ? `0 0 0 1.5px ${pastel(cat.color, 0.65)}` : 'none',
            }}
          />
        </td>
      ))}
      <td className="py-0.5 pl-1">
        <span className="flex justify-end">
          <ProgressRing done={done} target={target} size={18} stroke={2.5} />
        </span>
      </td>
    </tr>
  )
}

function WeekView({
  categories, toggleDay, todayIdx, sensors, onDragEnd,
}: {
  categories: KpiCategory[]
  toggleDay: (catId: string, kpiId: string, dayIdx: number) => void
  todayIdx: number
  sensors: ReturnType<typeof useSensors>
  onDragEnd: (e: DragEndEvent) => void
}) {
  return (
    <>
      <ClientDnd sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <table className="w-full border-collapse table-fixed">
        <colgroup>
          <col style={{ width: '50px' }} />
          {KPI_DAYS.map((_, i) => <col key={i} style={{ width: '14px' }} />)}
          <col style={{ width: '24px' }} />
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
            <th className="text-[8.5px] text-slate-500 text-right pb-1 font-semibold uppercase">goal</th>
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
              <SortableContext items={cat.kpis.map(k => k.id)} strategy={verticalListSortingStrategy}>
                {cat.kpis.map(k => (
                  <SortableKpiWeek key={k.id} kpi={k} cat={cat} toggleDay={toggleDay} todayIdx={todayIdx} />
                ))}
              </SortableContext>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </ClientDnd>
    </>
  )
}
