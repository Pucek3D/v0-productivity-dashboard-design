'use client'
import { useState, useRef, useEffect } from 'react'
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
  const sz = compact ? 10 : 12

  return (
    <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
      {dateInfo && (
        <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-[1px] rounded ${dateInfo.className}`}>
          {dateInfo.text}
        </span>
      )}
      {meta?.owner && (
        <span className="text-[8px] font-medium text-teal-300 bg-teal-500/15 px-1 py-[1px] rounded tracking-wider">
          {meta.owner}
        </span>
      )}
      <button ref={calRef} onClick={() => setShowCal(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0 leading-none">
        <IconCalendar size={sz} className="text-slate-500 hover:text-slate-300" />
      </button>
      <button ref={ownerRef} onClick={() => setShowOwner(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0 leading-none">
        <IconUser size={sz} className="text-slate-500 hover:text-slate-300" />
      </button>

      {showCal && calRef.current && createPortal(
        <MiniCalendar
          anchor={calRef.current.getBoundingClientRect()}
          value={meta?.deadline}
          onSelect={d => { updateTaskMeta(taskKey, { deadline: d, label: taskLabel }); setShowCal(false) }}
          onClear={() => { updateTaskMeta(taskKey, { deadline: undefined }); setShowCal(false) }}
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

/* ── Mini Calendar Popover ── */
function MiniCalendar({ anchor, value, onSelect, onClear, onClose }: {
  anchor: DOMRect; value?: string
  onSelect: (d: string) => void; onClear: () => void; onClose: () => void
}) {
  const now = new Date()
  const [m, setM] = useState(value ? new Date(value + 'T00:00').getMonth() : now.getMonth())
  const [y, setY] = useState(value ? new Date(value + 'T00:00').getFullYear() : now.getFullYear())

  const days = getDaysInMonth(m, y)
  const start = getFirstDayOfMonth(m, y)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const nav = (d: number) => {
    let nm = m + d, ny = y
    if (nm < 0) { nm = 11; ny-- }
    if (nm > 11) { nm = 0; ny++ }
    setM(nm); setY(ny)
  }

  const pick = (day: number) => {
    onSelect(`${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }

  const top = Math.min(anchor.bottom + 6, window.innerHeight - 280)
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
            const isSel = ds === value
            const isToday = ds === todayStr
            return (
              <button key={day} onClick={() => pick(day)} style={{
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
          <button onClick={() => onSelect(todayStr)} style={{ background: 'none', border: 'none', color: '#2dd4bf', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Today
          </button>
          {value && (
            <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Clear
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Owner Input Popover ── */
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
          {value && (
            <button onClick={() => onSave('')} style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clear</button>
          )}
          <button onClick={() => onSave(name)} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Save</button>
        </div>
      </div>
    </>
  )
}