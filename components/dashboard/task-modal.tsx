'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconCalendar, IconUser, IconClock, IconFlag, IconLink, IconPlus, IconTrash, IconPlayerPlay, IconPlayerStop, IconStar } from '@tabler/icons-react'
import { type TaskMeta, getDateLabel } from '@/lib/task-meta'

interface TaskModalProps { taskKey: string; taskLabel: string; meta: TaskMeta; onUpdate: (u: Partial<TaskMeta>) => void; onClose: () => void; onStartFocus?: (k: string, l: string) => void; starSubtaskToPrio?: (text: string) => void; onRenameTask?: (newName: string) => void }
const PRIOS = [{ value: 'high', label: 'High', color: '#fb7185' }, { value: 'medium', label: 'Medium', color: '#fbbf24' }, { value: 'low', label: 'Low', color: '#64748b' }]
const TIMES = [15, 30, 45, 60, 90, 120, 180, 240]

export function TaskModal({ taskKey, taskLabel, meta, onUpdate, onClose, onStartFocus, starSubtaskToPrio, onRenameTask }: TaskModalProps) {
  const [desc, setDesc] = useState(meta.description || '')
  const [newLink, setNewLink] = useState('')
  const [newSub, setNewSub] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(taskLabel)
  const nameRef = useRef<HTMLInputElement>(null)

  // Built-in focus timer
  const [focusing, setFocusing] = useState(false)
  const [focusSec, setFocusSec] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startFocus = () => { setFocusing(true); setFocusSec(0); intervalRef.current = setInterval(() => setFocusSec(s => s + 1), 1000) }
  const stopFocus = () => {
    setFocusing(false); if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    const mins = Math.max(1, Math.round(focusSec / 60)); const now = new Date()
    const ds = `${now.getDate()}/${now.getMonth() + 1} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    onUpdate({ focusSessions: [...((meta as any).focusSessions || []), { date: ds, minutes: mins }] } as any); setFocusSec(0)
  }
  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current) } }, [])
  useEffect(() => { if (editingName) nameRef.current?.focus() }, [editingName])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !focusing) onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [onClose, focusing])

  const saveDesc = () => { if (desc !== (meta.description || '')) onUpdate({ description: desc || undefined }) }
  const addLink = () => { if (!newLink.trim()) return; onUpdate({ links: [...(meta.links || []), newLink.trim()] }); setNewLink('') }
  const removeLink = (i: number) => { const u = [...(meta.links || [])]; u.splice(i, 1); onUpdate({ links: u.length ? u : undefined }) }
  const addSub = () => { if (!newSub.trim()) return; onUpdate({ subtasks: [...(meta.subtasks || []), { id: `st-${Date.now()}`, text: newSub.trim(), done: false }] }); setNewSub('') }
  const toggleSub = (id: string) => { onUpdate({ subtasks: (meta.subtasks || []).map(s => s.id === id ? { ...s, done: !s.done } : s) }) }
  const removeSub = (id: string) => { const u = (meta.subtasks || []).filter(s => s.id !== id); onUpdate({ subtasks: u.length ? u : undefined }) }
  const updateSubOwner = (id: string, owner: string) => { onUpdate({ subtasks: (meta.subtasks || []).map(s => s.id === id ? { ...s, owner: owner || undefined } : s) }) }
  const updateSubDeadline = (id: string, deadline: string) => { onUpdate({ subtasks: (meta.subtasks || []).map(s => s.id === id ? { ...s, deadline: deadline || undefined } : s) }) }
  const saveName = () => { setEditingName(false); if (nameDraft.trim() && nameDraft !== taskLabel && onRenameTask) onRenameTask(nameDraft.trim()) }

  const dateInfo = meta.deadline ? getDateLabel(meta.deadline) : null
  const sDone = (meta.subtasks || []).filter(s => s.done).length; const sTotal = (meta.subtasks || []).length
  const focusSessions: { date: string; minutes: number }[] = (meta as any).focusSessions || []
  const totalFocusMin = focusSessions.reduce((sum, s) => sum + s.minutes, 0)
  const fmtTimer = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`

  const S: React.CSSProperties = { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }

  return createPortal(<>
    <div onClick={() => { if (!focusing) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10001, width: 560, maxHeight: '85vh', overflowY: 'auto', background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>{taskKey}</div>
          {/* Editable name */}
          {editingName ? (
            <input ref={nameRef} value={nameDraft} onChange={e => setNameDraft(e.target.value)}
              onBlur={saveName} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameDraft(taskLabel) } }}
              style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, padding: '2px 8px', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
          ) : (
            <h2 onClick={() => setEditingName(true)} style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3, cursor: 'text' }} title="Click to edit">{taskLabel}</h2>
          )}
          {/* Focus */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            {!focusing ? <button onClick={startFocus} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em' }}><IconPlayerPlay size={14} /> Start Focus</button>
              : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 24, fontWeight: 700, color: '#fb7185', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-geist-mono, monospace)' }}>{fmtTimer(focusSec)}</span><button onClick={stopFocus} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(244,63,94,0.25)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}><IconPlayerStop size={14} /> Stop</button></div>}
          </div>
          {totalFocusMin > 0 && <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(244,63,94,0.08)', borderRadius: 8, border: '1px solid rgba(244,63,94,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: focusSessions.length > 0 ? 6 : 0 }}><IconClock size={14} color="#fb7185" /><span style={{ fontSize: 15, fontWeight: 700, color: '#fb7185' }}>{totalFocusMin >= 60 ? `${Math.floor(totalFocusMin / 60)}h ${totalFocusMin % 60}m` : `${totalFocusMin}m`}</span><span style={{ fontSize: 11, color: '#64748b' }}>total</span></div>
            {focusSessions.length > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 4 }}>{focusSessions.slice(-5).map((s, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 10 }}><span style={{ color: '#94a3b8' }}>{s.date}</span><span style={{ fontWeight: 700, color: '#fb7185' }}>{s.minutes}m</span></div>)}</div>}
          </div>}
        </div>
        <button onClick={() => { if (!focusing) onClose() }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, alignSelf: 'flex-start' }}><IconX size={20} color="#64748b" /></button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div><div style={S}><IconCalendar size={16} color="#64748b" /> Deadline</div><input type="date" value={meta.deadline || ''} onChange={e => onUpdate({ deadline: e.target.value || undefined, label: taskLabel })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none', colorScheme: 'dark', width: '100%' }} />{dateInfo && <span style={{ fontSize: 11, fontWeight: 700, display: 'inline-block', marginTop: 4 }} className={`px-2 py-0.5 rounded ${dateInfo.className}`}>{dateInfo.text}</span>}</div>
          <div><div style={S}><IconUser size={16} color="#64748b" /> Owner</div><input value={meta.owner || ''} onChange={e => onUpdate({ owner: e.target.value || undefined })} placeholder="Assign owner..." style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none', width: '100%' }} /></div>
          <div><div style={S}><IconFlag size={16} color="#64748b" /> Priority</div><div style={{ display: 'flex', gap: 5 }}>{PRIOS.map(p => <button key={p.value} onClick={() => onUpdate({ priority: meta.priority === p.value ? undefined : p.value as any })} style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: 'none', textTransform: 'uppercase', background: meta.priority === p.value ? `${p.color}22` : 'rgba(255,255,255,0.04)', color: meta.priority === p.value ? p.color : '#475569', boxShadow: meta.priority === p.value ? `inset 0 0 0 1px ${p.color}44` : 'none' }}>{p.label}</button>)}</div></div>
          <div><div style={S}><IconClock size={16} color="#64748b" /> Estimate</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{TIMES.map(t => <button key={t} onClick={() => onUpdate({ timeEstimate: meta.timeEstimate === t ? undefined : t })} style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 500, border: 'none', background: meta.timeEstimate === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: meta.timeEstimate === t ? '#818cf8' : '#475569', boxShadow: meta.timeEstimate === t ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none' }}>{t >= 60 ? `${t / 60}h` : `${t}m`}</button>)}</div></div>
        </div>

        {/* Recurring + start date */}
        <Sec label="🔄 Recurring">
          <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>{(['daily', 'weekly', 'monthly'] as const).map(f => <button key={f} onClick={() => onUpdate({ recurring: meta.recurring === f ? null : f })} style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: 'none', textTransform: 'uppercase', background: meta.recurring === f ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.04)', color: meta.recurring === f ? '#2dd4bf' : '#475569', boxShadow: meta.recurring === f ? 'inset 0 0 0 1px rgba(45,212,191,0.3)' : 'none' }}>{f}</button>)}</div>
          {meta.recurring && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>Start date:</span>
            <input type="date" value={(meta as any).recurringStart || ''} onChange={e => onUpdate({ recurringStart: e.target.value || undefined } as any)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#e2e8f0', outline: 'none', colorScheme: 'dark' }} />
          </div>}
        </Sec>

        {/* Schedule — 6-month week picker */}
        <Sec label="📅 Schedule (weeks)">
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => { const s = (meta as any).schedule || {}; onUpdate({ schedule: { ...s, ongoing: !s.ongoing } } as any) }} style={{ padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: 'none', textTransform: 'uppercase', background: (meta as any).schedule?.ongoing ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)', color: (meta as any).schedule?.ongoing ? '#34d399' : '#475569', boxShadow: (meta as any).schedule?.ongoing ? 'inset 0 0 0 1px rgba(52,211,153,0.3)' : 'none' }}>Ongoing</button>
          </div>
          <MonthWeekPicker selectedWeeks={(meta as any).schedule?.weeks || []} onChange={(weeks: number[]) => { const s = (meta as any).schedule || {}; onUpdate({ schedule: { ...s, weeks } } as any) }} />
        </Sec>

        <Sec label="Notes"><textarea value={desc} onChange={e => setDesc(e.target.value)} onBlur={saveDesc} placeholder="Add notes..." rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#e2e8f0', resize: 'vertical', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }} /></Sec>

        <Sec label={`Checklist${sTotal > 0 ? ` (${sDone}/${sTotal})` : ''}`}>
          {sTotal > 0 && <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(sDone / sTotal) * 100}%`, background: '#6366f1', borderRadius: 2, transition: 'width 0.3s' }} /></div>}
          {(meta.subtasks || []).map(st => { const dl = (st as any).deadline; const dlInfo = dl ? getDateLabel(dl) : null; return <div key={st.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => toggleSub(st.id)} style={{ width: 18, height: 18, borderRadius: 4, border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: st.done ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', boxShadow: st.done ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>{st.done && <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700 }}>✓</span>}</button><span style={{ fontSize: 14, color: st.done ? '#475569' : '#e2e8f0', textDecoration: st.done ? 'line-through' : 'none', flex: 1 }}>{st.text}</span>{starSubtaskToPrio && <button onClick={() => starSubtaskToPrio(st.text)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><IconStar size={13} className="text-slate-500 hover:text-amber-400" /></button>}<button onClick={() => removeSub(st.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}><IconTrash size={14} color="#64748b" /></button></div><div style={{ display: 'flex', gap: 6, marginLeft: 26, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}><input value={(st as any).owner || ''} onChange={e => updateSubOwner(st.id, e.target.value)} placeholder="Owner" style={{ width: 90, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: '#94a3b8', outline: 'none' }} /><input type="date" value={dl || ''} onChange={e => updateSubDeadline(st.id, e.target.value)} style={{ width: 120, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: '#94a3b8', outline: 'none', colorScheme: 'dark' }} />{dlInfo && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }} className={dlInfo.className}>{dlInfo.text}</span>}</div></div> })}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSub() }} placeholder="Add subtask..." style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} /><button onClick={addSub} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}><IconPlus size={14} color="#818cf8" /></button></div>
        </Sec>

        <Sec label="Links">
          {(meta.links || []).map((link, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}><IconLink size={14} color="#64748b" /><a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</a><button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}><IconTrash size={14} color="#64748b" /></button></div>)}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}><input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLink() }} placeholder="Paste URL..." style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} /><button onClick={addLink} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}><IconPlus size={14} color="#818cf8" /></button></div>
        </Sec>
      </div>
    </div>
  </>, document.body)
}

function Sec({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 22 }}><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 10 }}>{label}</div>{children}</div>
}

/* ── 6-month week picker — calendar-aligned ── */
function MonthWeekPicker({ selectedWeeks, onChange }: { selectedWeeks: number[]; onChange: (w: number[]) => void }) {
  const months = useMemo(() => {
    const now = new Date()
    const result: { name: string; year: number; month: number; weeks: { weekNum: number; label: string }[] }[] = []

    for (let offset = 0; offset < 6; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      const monthName = d.toLocaleString('en', { month: 'short' })
      const year = d.getFullYear()
      const month = d.getMonth()

      // Get weeks in this month
      const weeks: { weekNum: number; label: string }[] = []
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      let weekCount = 1
      let current = new Date(firstDay)
      // Align to Monday
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 1) {
        current.setDate(current.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      }

      while (current <= lastDay || weekCount <= 4) {
        const startOfYear = new Date(year, 0, 1)
        const weekNum = Math.ceil(((current.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
        weeks.push({ weekNum, label: `W${weekCount}` })
        weekCount++
        current.setDate(current.getDate() + 7)
        if (weekCount > 5) break
      }

      result.push({ name: monthName, year, month, weeks })
    }
    return result
  }, [])

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

  const toggle = (w: number) => {
    if (selectedWeeks.includes(w)) onChange(selectedWeeks.filter(x => x !== w))
    else onChange([...selectedWeeks, w].sort((a, b) => a - b))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {months.map(m => (
          <div key={`${m.month}-${m.year}`} style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 3 }}>
              {m.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {m.weeks.map(w => {
                const isSelected = selectedWeeks.includes(w.weekNum)
                const isCurrent = w.weekNum === currentWeek
                return (
                  <button key={w.weekNum} onClick={() => toggle(w.weekNum)} style={{
                    height: 22, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 600,
                    background: isSelected ? '#818cf8' : isCurrent ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.04)',
                    color: isSelected ? '#fff' : isCurrent ? '#fb7185' : '#64748b',
                    boxShadow: isSelected ? '0 0 6px rgba(99,102,241,0.4)' : 'none',
                  }}>{w.label}</button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {selectedWeeks.length > 0 && <div style={{ marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
        {selectedWeeks.length} week{selectedWeeks.length > 1 ? 's' : ''} selected
      </div>}
    </div>
  )
}
