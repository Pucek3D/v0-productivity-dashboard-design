'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { IconCalendar, IconUser } from '@tabler/icons-react'
import { type TaskMeta, getDateLabel } from '@/lib/task-meta'
import { getDaysInMonth, getFirstDayOfMonth } from '@/lib/data'

const MINI_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MINI_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  taskKey: string
  taskLabel: string
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (key: string, updates: Partial<TaskMeta>) => void
  compact?: boolean
}

export function TaskActions({ taskKey, taskLabel, taskMeta, updateTaskMeta, compact }: Props) {
  const meta = taskMeta[taskKey]
  const [showCal, setShowCal] = useState(false)
  const [showOwner, setShowOwner] = useState(false)
  const calRef = useRef<HTMLButtonElement>(null)
  const ownerRef = useRef<HTMLButtonElement>(null)

  const dateInfo = meta?.deadline ? getDateLabel(meta.deadline) : null
  const timeStr = meta?.hour !== undefined
    ? `${meta.hour.toString().padStart(2, '0')}:${(meta.minute ?? 0).toString().padStart(2, '0')}`
    : null
  const sz = compact ? 14 : 16

  return (
    <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
      <span className="flex items-center gap-0.5">
        {dateInfo ? (
          <button ref={calRef} onClick={() => setShowCal(true)}
            className={`text-[7px] font-bold uppercase tracking-wider px-1 py-[1px] rounded cursor-pointer border-none ${dateInfo.className}`}>
            {dateInfo.text}{timeStr ? ` ${timeStr}` : ''}
          </button>
        ) : (
          <button ref={calRef} onClick={() => setShowCal(true)}
            className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none">
            <IconCalendar size={sz} className="text-slate-500 hover:text-slate-300" />
          </button>
        )}
      </span>
      <span className="flex items-center gap-0.5">
        {meta?.owner ? (
          <button ref={ownerRef} onClick={() => setShowOwner(true)}
            className="text-[7px] font-medium text-teal-300 bg-teal-500/15 px-1 py-[1px] rounded tracking-wider cursor-pointer border-none">
            {meta.owner}
          </button>
        ) : (
          <button ref={ownerRef} onClick={() => setShowOwner(true)}
            className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none">
            <IconUser size={sz} className="text-slate-500 hover:text-slate-300" />
          </button>
        )}
      </span>

      {showCal && calRef.current && createPortal(
        <MiniCalendar
          anchor={calRef.current.getBoundingClientRect()}
          value={meta?.deadline}
          selectedHour={meta?.hour}
          selectedMinute={meta?.minute}
          onSelect={(d, h, min) => { updateTaskMeta(taskKey, { deadline: d, hour: h, minute: min, label: taskLabel }); setShowCal(false) }}
          onClear={() => { updateTaskMeta(taskKey, { deadline: undefined, hour: undefined, minute: undefined }); setShowCal(false) }}
          onClose={() => setShowCal(false)}
        />, document.body
      )}

      {showOwner && ownerRef.current && createPortal(
        <OwnerInput
          anchor={ownerRef.current.getBoundingClientRect()}
          value={meta?.owner || ''}
          onSave={name => { updateTaskMeta(taskKey, { owner: name || undefined }); setShowOwner(false) }}
          onClose={() => setShowOwner(false)}
        />, document.body
      )}
    </span>
  )
}

/* ── Scroll Wheel ── */
const ITEM_H = 32

function ScrollWheel({ items, value, onChange, width }: {
  items: { value: number; label: string }[]
  value: number
  onChange: (v: number) => void
  width: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const timeout = useRef<ReturnType<typeof setTimeout>>()
  const isInit = useRef(true)

  useEffect(() => {
    const idx = items.findIndex(i => i.value === value)
    if (idx >= 0 && ref.current) {
      ref.current.scrollTop = idx * ITEM_H
      isInit.current = false
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (isInit.current) return
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      if (!ref.current) return
      const idx = Math.round(ref.current.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      if (items[clamped].value !== value) onChange(items[clamped].value)
    }, 60)
  }, [items, value, onChange])

  return (
    <div style={{ position: 'relative', width, height: ITEM_H * 3 }}>
      <div style={{
        position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H,
        background: 'rgba(99,102,241,0.12)', borderRadius: 5,
        border: '1px solid rgba(99,102,241,0.25)', zIndex: 1, pointerEvents: 'none',
      }} />
      <div ref={ref} onScroll={handleScroll} className="scroll-wheel" style={{
        height: ITEM_H * 3, overflowY: 'auto', scrollSnapType: 'y mandatory',
        position: 'relative', zIndex: 2,
        maskImage: 'linear-gradient(transparent 0%, black 33%, black 66%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(transparent 0%, black 33%, black 66%, transparent 100%)',
      }}>
        <div style={{ height: ITEM_H }} />
        {items.map(item => (
          <div key={item.value} style={{
            height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            scrollSnapAlign: 'start',
            fontSize: item.value === value ? 15 : 12,
            fontWeight: item.value === value ? 700 : 400,
            color: item.value === value ? '#fff' : '#475569',
            fontVariantNumeric: 'tabular-nums',
            cursor: 'pointer',
          }} onClick={() => {
            const idx = items.findIndex(i => i.value === item.value)
            if (ref.current) ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
            onChange(item.value)
          }}>
            {item.label}
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  )
}

const HOUR_ITEMS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: i.toString().padStart(2, '0') }))
const MINUTE_ITEMS = Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: (i * 5).toString().padStart(2, '0') }))

/* ── Mini Calendar ── */
function MiniCalendar({ anchor, value, selectedHour, selectedMinute, onSelect, onClear, onClose }: {
  anchor: DOMRect; value?: string; selectedHour?: number; selectedMinute?: number
  onSelect: (d: string, h?: number, min?: number) => void; onClear: () => void; onClose: () => void
}) {
  const now = new Date()
  const [m, setM] = useState(value ? new Date(value + 'T00:00').getMonth() : now.getMonth())
  const [y, setY] = useState(value ? new Date(value + 'T00:00').getFullYear() : now.getFullYear())
  const [pickedDate, setPickedDate] = useState<string | null>(value || null)
  const [step, setStep] = useState<'date' | 'time'>(value ? 'time' : 'date')
  const [hour, setHour] = useState(selectedHour ?? 9)
  const [minute, setMinute] = useState(selectedMinute ?? 0)

  const days = getDaysInMonth(m, y)
  const start = getFirstDayOfMonth(m, y)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const nav = (d: number) => {
    let nm = m + d, ny = y
    if (nm < 0) { nm = 11; ny-- }
    if (nm > 11) { nm = 0; ny++ }
    setM(nm); setY(ny)
  }

  const pickDay = (day: number) => {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setPickedDate(ds)
    setStep('time')
  }

  const confirm = (allDay: boolean) => {
    if (pickedDate) onSelect(pickedDate, allDay ? undefined : hour, allDay ? undefined : minute)
  }

  const top = Math.min(anchor.bottom + 6, window.innerHeight - 380)
  const left = Math.max(8, Math.min(anchor.left - 90, window.innerWidth - 220))

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: 'fixed', zIndex: 9999, top, left, width: 210,
        background: '#131c2e', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12, padding: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      }}>
        {/* Step tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <button onClick={() => setStep('date')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: step === 'date' ? '#fff' : '#475569',
            borderBottom: step === 'date' ? '1px solid #6366f1' : '1px solid transparent',
            paddingBottom: 2,
          }}>Date</button>
          <button onClick={() => pickedDate && setStep('time')} style={{
            background: 'none', border: 'none', cursor: pickedDate ? 'pointer' : 'default',
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: step === 'time' ? '#fff' : '#475569',
            borderBottom: step === 'time' ? '1px solid #6366f1' : '1px solid transparent',
            paddingBottom: 2, opacity: pickedDate ? 1 : 0.4,
          }}>Time</button>
        </div>

        {step === 'date' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>‹</button>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{MINI_MONTHS[m]} {y}</span>
              <button onClick={() => nav(1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
              {MINI_DAYS.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 8, fontWeight: 600, color: '#64748b', padding: '2px 0' }}>{d}</div>
              ))}
              {Array.from({ length: start }).map((_, i) => <div key={`e${i}`} style={{ height: 26 }} />)}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1
                const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSel = ds === pickedDate
                const isToday = ds === todayStr
                return (
                  <button key={day} onClick={() => pickDay(day)} style={{
                    height: 26, width: '100%', border: 'none', borderRadius: 4, cursor: 'pointer',
                    fontSize: 10, fontWeight: 500, transition: 'all 0.1s',
                    background: isSel ? '#6366f1' : 'transparent',
                    color: isSel ? '#fff' : isToday ? '#2dd4bf' : '#cbd5e1',
                    boxShadow: isSel ? '0 0 8px rgba(99,102,241,0.5)' : isToday ? 'inset 0 0 0 1px rgba(45,212,191,0.4)' : 'none',
                  }}
                    onMouseEnter={e => { if (!isSel) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!isSel) (e.target as HTMLElement).style.background = 'transparent' }}>
                    {day}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => { setPickedDate(todayStr); setStep('time') }} style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today</button>
              {value && <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clear</button>}
            </div>
          </>
        )}

        {step === 'time' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>
                {pickedDate ? new Date(pickedDate + 'T00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>

            {/* All day button */}
            <button onClick={() => confirm(true)} style={{
              width: '100%', padding: '6px 0', borderRadius: 6, cursor: 'pointer',
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 10,
              background: selectedHour === undefined && value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              color: selectedHour === undefined && value ? '#818cf8' : '#94a3b8',
              border: selectedHour === undefined && value ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.06)',
            }}>All day</button>

            {/* Scroll wheels */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <ScrollWheel items={HOUR_ITEMS} value={hour} onChange={setHour} width={60} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#475569', lineHeight: 1 }}>:</span>
              <ScrollWheel items={MINUTE_ITEMS} value={minute} onChange={setMinute} width={60} />
            </div>

            {/* Confirm button */}
            <button onClick={() => confirm(false)} style={{
              width: '100%', padding: '6px 0', borderRadius: 6, cursor: 'pointer',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              marginTop: 10,
              background: '#6366f1', color: '#fff', border: 'none',
              boxShadow: '0 0 12px rgba(99,102,241,0.4)',
            }}>
              Set {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
            </button>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => setStep('date')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>← Back</button>
              {value && <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clear</button>}
            </div>
          </>
        )}
      </div>
    </>
  )
}

/* ── Owner Input ── */
function OwnerInput({ anchor, value, onSave, onClose }: {
  anchor: DOMRect; value: string
  onSave: (name: string) => void; onClose: () => void
}) {
  const [name, setName] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  const top = Math.min(anchor.bottom + 6, window.innerHeight - 80)
  const left = Math.max(8, Math.min(anchor.left - 50, window.innerWidth - 170))

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: 'fixed', zIndex: 9999, top, left, width: 160,
        background: '#131c2e', border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10, padding: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <input ref={ref} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(name); if (e.key === 'Escape') onClose() }}
          placeholder="Owner name..."
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6,
            padding: '4px 8px', fontSize: 11, color: '#fff', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          {value && <button onClick={() => onSave('')} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clear</button>}
          <button onClick={() => onSave(name)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Save</button>
        </div>
      </div>
    </>
  )
}