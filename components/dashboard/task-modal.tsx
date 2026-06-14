'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconCalendar, IconUser, IconClock, IconFlag, IconLink, IconPlus, IconTrash, IconPlayerPlay, IconStar, IconBookmark, IconPaperclip, IconCalendarWeek } from '@tabler/icons-react'
import { type TaskMeta, getDateLabel } from '@/lib/task-meta'
import { TimePickerPopover } from './event-calendar'
import { MONTH_NAMES } from '@/lib/data'

interface TaskModalProps { taskKey: string; taskLabel: string; meta: TaskMeta; onUpdate: (u: Partial<TaskMeta>) => void; onClose: () => void; onStartFocus?: (k: string, l: string) => void; starSubtaskToPrio?: (text: string, details?: Partial<TaskMeta>) => void; bookmarkSubtaskToOther?: (text: string, details?: Partial<TaskMeta>) => void; isTaskStarred?: (text: string) => boolean; isTaskBookmarked?: (text: string) => boolean; onRenameTask?: (newName: string) => void }
const PRIOS = [{ value: 'high', label: 'High', color: '#fb7185' }, { value: 'medium', label: 'Medium', color: '#fbbf24' }, { value: 'low', label: 'Low', color: '#64748b' }]
const TIMES = [5, 10, 15, 30, 45, 60, 90, 120, 180, 240]

// ── FIX #7: ISO 8601 week number (Monday-start) ──
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Get the Monday of the ISO week containing a given date
function getMondayOfISOWeek(weekNum: number, year: number): Date {
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7 // Monday=1..Sunday=7
  const mondayOfWeek1 = new Date(jan4)
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1)
  const result = new Date(mondayOfWeek1)
  result.setUTCDate(result.getUTCDate() + (weekNum - 1) * 7)
  return result
}

export function TaskModal({ taskKey, taskLabel, meta, onUpdate, onClose, onStartFocus, starSubtaskToPrio, bookmarkSubtaskToOther, isTaskStarred, isTaskBookmarked, onRenameTask }: TaskModalProps) {
  const [desc, setDesc] = useState(meta.description || '')
  const [newLink, setNewLink] = useState('')
  const [newSub, setNewSub] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(taskLabel)
  const nameRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const deadlineBtnRef = useRef<HTMLButtonElement>(null)
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false)

  // Focus runs as a floating page-level widget (FocusTimer) so the modal can be
  // closed and the user can keep working on the dashboard while the timer runs.
  useEffect(() => { if (editingName) nameRef.current?.focus() }, [editingName])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [onClose])

  const saveDesc = () => { if (desc !== (meta.description || '')) onUpdate({ description: desc || undefined }) }
  const addLink = () => { if (!newLink.trim()) return; onUpdate({ links: [...(meta.links || []), newLink.trim()] }); setNewLink('') }
  const removeLink = (i: number) => { const u = [...(meta.links || [])]; u.splice(i, 1); onUpdate({ links: u.length ? u : undefined }) }
  const addFiles = (list: FileList | null) => { if (!list || !list.length) return; const added = Array.from(list).map(f => ({ name: f.name, url: URL.createObjectURL(f) })); onUpdate({ files: [...(meta.files || []), ...added] }) }
  const removeFile = (i: number) => { const u = [...(meta.files || [])]; u.splice(i, 1); onUpdate({ files: u.length ? u : undefined }) }
  const addSub = () => { if (!newSub.trim()) return; onUpdate({ subtasks: [...(meta.subtasks || []), { id: `st-${Date.now()}`, text: newSub.trim(), done: false }] }); setNewSub('') }
  const toggleSub = (id: string) => { onUpdate({ subtasks: (meta.subtasks || []).map(s => s.id === id ? { ...s, done: !s.done } : s) }) }
  const removeSub = (id: string) => { const u = (meta.subtasks || []).filter(s => s.id !== id); onUpdate({ subtasks: u.length ? u : undefined }) }
  const updateSubOwner = (id: string, owner: string) => { onUpdate({ subtasks: (meta.subtasks || []).map(s => s.id === id ? { ...s, owner: owner || undefined } : s) }) }
  const updateSubDeadline = (id: string, deadline: string) => { onUpdate({ subtasks: (meta.subtasks || []).map(s => s.id === id ? { ...s, deadline: deadline || undefined } : s) }) }
  const updateSubEstimate = (id: string, timeEstimate: number | undefined) => { onUpdate({ subtasks: (meta.subtasks || []).map(s => s.id === id ? { ...s, timeEstimate } : s) }) }
  const saveName = () => { setEditingName(false); if (nameDraft.trim() && nameDraft !== taskLabel && onRenameTask) onRenameTask(nameDraft.trim()) }

  const dateInfo = meta.deadline ? getDateLabel(meta.deadline) : null
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const timeStr = meta.hour !== undefined ? `${pad2(meta.hour)}:${pad2(meta.minute || 0)}` : ''
  // Combined deadline date+time: parse the stored YYYY-MM-DD so the calendar-style
  // picker can pre-select the right day, and fall back to today when unset.
  const nowD = new Date()
  const dl = meta.deadline ? new Date(meta.deadline + 'T00:00') : null
  const dlYear = dl ? dl.getFullYear() : nowD.getFullYear()
  const dlMonth = dl ? dl.getMonth() : nowD.getMonth()
  const dlDay = dl ? dl.getDate() : nowD.getDate()
  const todayObj = { d: nowD.getDate(), m: nowD.getMonth(), y: nowD.getFullYear() }
  const deadlineLabel = dl ? `${MONTH_NAMES[dlMonth].slice(0, 3)} ${dlDay}${timeStr ? ` · ${timeStr}` : ''}` : 'Set deadline'
  const sDone = (meta.subtasks || []).filter(s => s.done).length; const sTotal = (meta.subtasks || []).length
  const focusSessions: { date: string; seconds?: number; minutes?: number }[] = (meta as any).focusSessions || []
  const secsOf = (s: { seconds?: number; minutes?: number }) => s.seconds ?? (s.minutes ? s.minutes * 60 : 0)
  const totalFocusSec = focusSessions.reduce((sum, s) => sum + secsOf(s), 0)
  // Smart duration: seconds under 1 min, minutes under 1 hr, else h + m.
  const fmtDur = (sec: number) => { if (sec < 60) return `${sec}s`; const m = Math.round(sec / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m` }

  const S: React.CSSProperties = { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }

  return createPortal(<>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
    <div className="modal-scroll" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10001, width: 560, maxHeight: '85vh', overflowY: 'auto', background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
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
          {/* Focus — launches the floating widget so the modal can be closed */}
          {onStartFocus && <div style={{ marginTop: 8 }}>
            <button onClick={() => { onStartFocus(taskKey, taskLabel); onClose() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}><IconPlayerPlay size={11} /> Start Focus</button>
          </div>}
          {totalFocusSec > 0 && <div style={{ marginTop: 8, padding: '5px 8px', background: 'rgba(244,63,94,0.08)', borderRadius: 6, border: '1px solid rgba(244,63,94,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: focusSessions.length > 0 ? 4 : 0 }}><IconClock size={11} color="#fb7185" /><span style={{ fontSize: 11, fontWeight: 700, color: '#fb7185' }}>{fmtDur(totalFocusSec)}</span><span style={{ fontSize: 9, color: '#64748b' }}>total</span></div>
            {focusSessions.length > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 3 }}>{focusSessions.slice(-5).map((s, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: 9 }}><span style={{ color: '#94a3b8' }}>{s.date}</span><span style={{ fontWeight: 700, color: '#fb7185' }}>{fmtDur(secsOf(s))}</span></div>)}</div>}
          </div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, alignSelf: 'flex-start' }}><IconX size={20} color="#64748b" /></button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div><div style={S}><IconCalendar size={16} color="#64748b" /> Deadline</div><button ref={deadlineBtnRef} onClick={() => setShowDeadlinePicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${meta.deadline ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, color: meta.deadline ? '#e2e8f0' : '#64748b', outline: 'none', cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}><IconCalendar size={13} color="#64748b" />{deadlineLabel}</button>{dateInfo && <span style={{ fontSize: 11, fontWeight: 700, display: 'inline-block', marginTop: 4 }} className={`px-2 py-0.5 rounded ${dateInfo.className}`}>{dateInfo.text}{timeStr ? ` · ${timeStr}` : ''}</span>}
            {showDeadlinePicker && deadlineBtnRef.current && (
              <TimePickerPopover
                anchor={deadlineBtnRef.current.getBoundingClientRect()}
                navigable z={10002} clearLabel="Clear deadline"
                month={dlMonth} year={dlYear} today={todayObj}
                day={dlDay} hour={meta.hour ?? 9} minute={meta.minute ?? 0}
                onSelect={(d, h, mi, m, y) => { onUpdate({ deadline: `${y ?? dlYear}-${pad2((m ?? dlMonth) + 1)}-${pad2(d)}`, hour: h, minute: mi, label: taskLabel }); setShowDeadlinePicker(false) }}
                onClear={() => { onUpdate({ deadline: undefined, hour: undefined, minute: undefined }); setShowDeadlinePicker(false) }}
                onClose={() => setShowDeadlinePicker(false)}
              />
            )}</div>
          <div><div style={S}><IconUser size={16} color="#64748b" /> Owner</div><input value={meta.owner || ''} onChange={e => onUpdate({ owner: e.target.value || undefined })} placeholder="Assign owner..." style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none', width: '100%' }} /></div>
          <div><div style={S}><IconFlag size={16} color="#64748b" /> Priority</div><div style={{ display: 'flex', gap: 5 }}>{PRIOS.map(p => <button key={p.value} onClick={() => onUpdate({ priority: meta.priority === p.value ? undefined : p.value as any })} style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: 'none', textTransform: 'uppercase', background: meta.priority === p.value ? `${p.color}22` : 'rgba(255,255,255,0.04)', color: meta.priority === p.value ? p.color : '#475569', boxShadow: meta.priority === p.value ? `inset 0 0 0 1px ${p.color}44` : 'none' }}>{p.label}</button>)}</div></div>
          <div><div style={S}><IconClock size={16} color="#64748b" /> Estimate</div><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>{TIMES.map(t => <button key={t} onClick={() => onUpdate({ timeEstimate: meta.timeEstimate === t ? undefined : t })} style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 500, border: 'none', background: meta.timeEstimate === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: meta.timeEstimate === t ? '#818cf8' : '#475569', boxShadow: meta.timeEstimate === t ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none' }}>{t >= 60 ? `${t / 60}h` : `${t}m`}</button>)}<span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><input type="number" min={0} step={5} value={meta.timeEstimate && !TIMES.includes(meta.timeEstimate) ? meta.timeEstimate : ''} onChange={e => { const v = parseInt(e.target.value, 10); onUpdate({ timeEstimate: Number.isFinite(v) && v > 0 ? v : undefined }) }} placeholder="min" title="Set estimate manually" className="estimate-num" style={{ width: 52, background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 6px', fontSize: 12, color: meta.timeEstimate && !TIMES.includes(meta.timeEstimate) ? '#818cf8' : '#94a3b8', outline: 'none', colorScheme: 'dark', boxShadow: meta.timeEstimate && !TIMES.includes(meta.timeEstimate) ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none' }} /><span style={{ fontSize: 10, color: '#475569' }}>m</span></span></div></div>
        </div>

        <Sec label={`Checklist${sTotal > 0 ? ` (${sDone}/${sTotal})` : ''}`}>
          {sTotal > 0 && <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(sDone / sTotal) * 100}%`, background: '#6366f1', borderRadius: 2, transition: 'width 0.3s' }} /></div>}
          {(meta.subtasks || []).map(st => { const dl = (st as any).deadline; const dlInfo = dl ? getDateLabel(dl) : null; const starred = isTaskStarred ? isTaskStarred(st.text) : false; const bookmarked = isTaskBookmarked ? isTaskBookmarked(st.text) : false; return <div key={st.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => toggleSub(st.id)} style={{ width: 18, height: 18, borderRadius: 4, border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: st.done ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', boxShadow: st.done ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>{st.done && <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700 }}>✓</span>}</button><span style={{ fontSize: 14, color: st.done ? '#475569' : '#e2e8f0', textDecoration: st.done ? 'line-through' : 'none', flex: 1 }}>{st.text}</span>{starSubtaskToPrio && <button onClick={() => starSubtaskToPrio(st.text, { owner: (st as any).owner, deadline: (st as any).deadline, timeEstimate: (st as any).timeEstimate })} className={starred ? 'order-last' : ''} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} title={starred ? 'Starred to Top Prio' : 'Star to Top Prio'}><IconStar size={13} className={starred ? 'fill-yellow-500 text-yellow-500' : 'text-slate-500 hover:text-amber-400'} /></button>}{bookmarkSubtaskToOther && <button onClick={() => bookmarkSubtaskToOther(st.text, { owner: (st as any).owner, deadline: (st as any).deadline, timeEstimate: (st as any).timeEstimate })} className={bookmarked ? 'order-last' : ''} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} title={bookmarked ? 'Added to Other to-dos' : 'Add to Other to-dos'}><IconBookmark size={13} className={bookmarked ? 'fill-indigo-400 text-indigo-400' : 'text-slate-500 hover:text-indigo-300'} /></button>}<button onClick={() => removeSub(st.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}><IconTrash size={14} color="#64748b" /></button></div><div style={{ display: 'flex', gap: 6, marginLeft: 26, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}><input value={(st as any).owner || ''} onChange={e => updateSubOwner(st.id, e.target.value)} placeholder="Owner" style={{ width: 90, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: '#94a3b8', outline: 'none' }} /><input type="date" value={dl || ''} onChange={e => updateSubDeadline(st.id, e.target.value)} style={{ width: 120, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: '#94a3b8', outline: 'none', colorScheme: 'dark' }} />{dlInfo && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }} className={dlInfo.className}>{dlInfo.text}</span>}<SubEstimateInput value={(st as any).timeEstimate} onChange={(v) => updateSubEstimate(st.id, v)} /></div></div> })}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSub() }} placeholder="Add subtask..." style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} /><button onClick={addSub} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}><IconPlus size={14} color="#818cf8" /></button></div>
        </Sec>

        <Sec label="Links">
          {(meta.links || []).map((link, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}><IconLink size={14} color="#64748b" /><a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</a><button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}><IconTrash size={14} color="#64748b" /></button></div>)}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}><input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLink() }} placeholder="Paste URL..." style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} /><button onClick={addLink} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}><IconPlus size={14} color="#818cf8" /></button></div>
        </Sec>

        <Sec label={<><IconPaperclip size={14} color="#64748b" /> Files</>}>
          {(meta.files || []).map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}><IconPaperclip size={14} color="#64748b" /><a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</a><button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}><IconTrash size={14} color="#64748b" /></button></div>)}
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); if (fileRef.current) fileRef.current.value = '' }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#818cf8' }}><IconPlus size={14} /> Add files</button>
        </Sec>

        <Sec label="Notes"><textarea value={desc} onChange={e => setDesc(e.target.value)} onBlur={saveDesc} placeholder="Add notes..." rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#e2e8f0', resize: 'vertical', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }} /></Sec>

        {/* Schedule — 6-month week picker */}
        <Sec label={<><IconCalendarWeek size={14} color="#64748b" /> Schedule (weeks)</>}>
          <MonthWeekPicker selectedWeeks={(meta as any).schedule?.weeks || []} onChange={(weeks: number[]) => { const s = (meta as any).schedule || {}; onUpdate({ schedule: { ...s, weeks } } as any) }} />
        </Sec>
      </div>
    </div>
  </>, document.body)
}

function Sec({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return <div style={{ marginBottom: 22 }}><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>{label}</div>{children}</div>
}

/* Per-subtask time estimate: manual number + unit (min / h) */
function SubEstimateInput({ value, onChange }: { value?: number; onChange: (v: number | undefined) => void }) {
  const isHour = value !== undefined && value % 60 === 0 && value >= 60
  const [unit, setUnit] = useState<'min' | 'h'>(isHour ? 'h' : 'min')
  const display = value === undefined ? '' : String(unit === 'h' ? value / 60 : value)
  const commit = (raw: string, u: 'min' | 'h') => {
    const num = parseFloat(raw)
    if (!raw || isNaN(num) || num <= 0) { onChange(undefined); return }
    onChange(Math.round(u === 'h' ? num * 60 : num))
  }
  const inputStyle: React.CSSProperties = { width: 44, background: '#0f1623', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: '#94a3b8', outline: 'none', colorScheme: 'dark' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <IconClock size={11} color="#475569" />
      <input type="number" min={0} step="any" value={display} onChange={e => commit(e.target.value, unit)} placeholder="0" className="estimate-num" style={inputStyle} />
      {(['min', 'h'] as const).map(u => (
        <button key={u} onClick={() => { setUnit(u); if (value !== undefined) commit(display || '0', u) }} style={{ padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600, border: 'none', background: unit === u ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: unit === u ? '#818cf8' : '#475569' }}>{u}</button>
      ))}
    </span>
  )
}

/* ── FIX #7: 6-month week picker — now uses ISO 8601 weeks (Monday-start) ── */
function MonthWeekPicker({ selectedWeeks, onChange }: { selectedWeeks: number[]; onChange: (w: number[]) => void }) {
  const months = useMemo(() => {
    const now = new Date()
    const result: { name: string; year: number; month: number; weeks: { weekNum: number; label: string; dateRange: string; mondayLabel: string }[] }[] = []

    for (let offset = 0; offset < 6; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      const monthName = d.toLocaleString('en', { month: 'short' })
      const year = d.getFullYear()
      const month = d.getMonth()

      // Get ISO weeks that overlap this month
      const weeks: { weekNum: number; label: string; dateRange: string; mondayLabel: string }[] = []
      const seenWeeks = new Set<number>()
      let monthWeekIdx = 0 // 1-based position of the week within this month

      // Walk through every Monday that has days in this month
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // Find the Monday on or before the first day of the month
      let current = new Date(firstDay)
      const dayOfWeek = current.getDay() || 7 // Monday=1..Sunday=7
      current.setDate(current.getDate() - (dayOfWeek - 1)) // Go back to Monday

      while (current <= lastDay) {
        // Only include if this week overlaps the month (at least one day in this month)
        const weekEnd = new Date(current)
        weekEnd.setDate(weekEnd.getDate() + 6) // Sunday

        if (weekEnd.getMonth() === month || current.getMonth() === month ||
            (current < firstDay && weekEnd > firstDay)) {
          const weekNum = getISOWeekNumber(current)
          if (!seenWeeks.has(weekNum)) {
            seenWeeks.add(weekNum)
            monthWeekIdx += 1
            const rangeStart = current.getDate()
            const rangeEnd = Math.min(weekEnd.getDate(), lastDay.getDate())
            // `current` is the Monday that starts this ISO week
            weeks.push({
              weekNum,
              label: `W${monthWeekIdx}`,
              dateRange: `${rangeStart}–${rangeEnd}`,
              mondayLabel: current.toLocaleString('en', { day: 'numeric', month: 'short' }),
            })
          }
        }
        current.setDate(current.getDate() + 7)
        if (weeks.length >= 6) break // safety cap
      }

      result.push({ name: monthName, year, month, weeks })
    }
    return result
  }, [])

  const currentWeek = getISOWeekNumber(new Date())

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
                  <button key={w.weekNum} onClick={() => toggle(w.weekNum)}
                    title={`${w.label} · starts Mon ${w.mondayLabel} (ISO week ${w.weekNum}, ${w.dateRange})`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      minHeight: 34, padding: '3px 2px', borderRadius: 4, border: 'none', cursor: 'pointer', fontWeight: 600,
                      background: isSelected ? '#818cf8' : isCurrent ? 'rgba(251,113,133,0.15)' : 'rgba(255,255,255,0.04)',
                      color: isSelected ? '#fff' : isCurrent ? '#fb7185' : '#64748b',
                      boxShadow: isSelected ? '0 0 6px rgba(99,102,241,0.4)' : 'none',
                    }}>
                    <span style={{ fontSize: 10, lineHeight: 1 }}>{w.label}</span>
                    <span style={{ fontSize: 8, lineHeight: 1, opacity: isSelected ? 0.85 : 0.7 }}>{w.mondayLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {selectedWeeks.length > 0 && <div style={{ marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
        {selectedWeeks.length} week{selectedWeeks.length > 1 ? 's' : ''} selected (ISO weeks, Mon–Sun)
      </div>}
    </div>
  )
}
