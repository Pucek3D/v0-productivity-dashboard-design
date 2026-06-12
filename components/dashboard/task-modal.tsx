'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconCalendar, IconUser, IconClock, IconFlag, IconLink, IconPlus, IconTrash, IconTarget } from '@tabler/icons-react'
import { type TaskMeta, getDateLabel } from '@/lib/task-meta'

interface TaskModalProps {
  taskKey: string; taskLabel: string; meta: TaskMeta
  onUpdate: (u: Partial<TaskMeta>) => void; onClose: () => void
  onStartFocus?: (k: string, l: string) => void
}

const PRIOS = [
  { value: 'high', label: 'High', color: '#fb7185' },
  { value: 'medium', label: 'Medium', color: '#fbbf24' },
  { value: 'low', label: 'Low', color: '#64748b' },
]
const TIMES = [15, 30, 45, 60, 90, 120, 180, 240]

export function TaskModal({ taskKey, taskLabel, meta, onUpdate, onClose, onStartFocus }: TaskModalProps) {
  const [desc, setDesc] = useState(meta.description || '')
  const [newLink, setNewLink] = useState('')
  const [newSub, setNewSub] = useState('')

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [onClose])

  const saveDesc = () => { if (desc !== (meta.description || '')) onUpdate({ description: desc || undefined }) }
  const addLink = () => { if (!newLink.trim()) return; onUpdate({ links: [...(meta.links||[]), newLink.trim()] }); setNewLink('') }
  const removeLink = (i: number) => { const u = [...(meta.links||[])]; u.splice(i, 1); onUpdate({ links: u.length ? u : undefined }) }
  const addSub = () => { if (!newSub.trim()) return; onUpdate({ subtasks: [...(meta.subtasks||[]), { id: `st-${Date.now()}`, text: newSub.trim(), done: false }] }); setNewSub('') }
  const toggleSub = (id: string) => { onUpdate({ subtasks: (meta.subtasks||[]).map(s => s.id === id ? { ...s, done: !s.done } : s) }) }
  const removeSub = (id: string) => { const u = (meta.subtasks||[]).filter(s => s.id !== id); onUpdate({ subtasks: u.length ? u : undefined }) }

  const dateInfo = meta.deadline ? getDateLabel(meta.deadline) : null
  const sDone = (meta.subtasks||[]).filter(s => s.done).length
  const sTotal = (meta.subtasks||[]).length

  const S: React.CSSProperties = { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }

  return createPortal(<>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      zIndex: 10001, width: 520, maxHeight: '85vh', overflowY: 'auto',
      background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>{taskKey}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>{taskLabel}</h2>
          {onStartFocus && (
            <button onClick={() => { onStartFocus(taskKey, taskLabel); onClose() }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <IconTarget size={14} /> Start Focus
            </button>
          )}
          {/* Focus time display */}
          {meta.actualTime && meta.actualTime > 0 && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconClock size={14} color="#2dd4bf" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2dd4bf' }}>
                {meta.actualTime >= 60 ? `${Math.floor(meta.actualTime / 60)}h ${meta.actualTime % 60}m` : `${meta.actualTime}m`}
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>focused</span>
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, alignSelf: 'flex-start' }}><IconX size={20} color="#64748b" /></button>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          {/* Deadline */}
          <div>
            <div style={S}><IconCalendar size={16} color="#64748b" /> Deadline</div>
            <input type="date" value={meta.deadline||''} onChange={e => onUpdate({ deadline: e.target.value || undefined })}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none', colorScheme: 'dark', width: '100%' }} />
            {dateInfo && <span style={{ fontSize: 11, fontWeight: 700, display: 'inline-block', marginTop: 4 }} className={`px-2 py-0.5 rounded ${dateInfo.className}`}>{dateInfo.text}</span>}
          </div>
          {/* Owner */}
          <div>
            <div style={S}><IconUser size={16} color="#64748b" /> Owner</div>
            <input value={meta.owner||''} onChange={e => onUpdate({ owner: e.target.value || undefined })} placeholder="Assign owner..."
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none', width: '100%' }} />
          </div>
          {/* Priority */}
          <div>
            <div style={S}><IconFlag size={16} color="#64748b" /> Priority</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {PRIOS.map(p => <button key={p.value} onClick={() => onUpdate({ priority: meta.priority === p.value ? undefined : p.value as any })}
                style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: 'none', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: meta.priority === p.value ? `${p.color}22` : 'rgba(255,255,255,0.04)', color: meta.priority === p.value ? p.color : '#475569',
                  boxShadow: meta.priority === p.value ? `inset 0 0 0 1px ${p.color}44` : 'none' }}>{p.label}</button>)}
            </div>
          </div>
          {/* Estimate */}
          <div>
            <div style={S}><IconClock size={16} color="#64748b" /> Estimate</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TIMES.map(t => <button key={t} onClick={() => onUpdate({ timeEstimate: meta.timeEstimate === t ? undefined : t })}
                style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 500, border: 'none', fontVariantNumeric: 'tabular-nums',
                  background: meta.timeEstimate === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: meta.timeEstimate === t ? '#818cf8' : '#475569',
                  boxShadow: meta.timeEstimate === t ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none' }}>{t >= 60 ? `${t/60}h` : `${t}m`}</button>)}
            </div>
          </div>
        </div>

        {/* Recurring */}
        <Sec label="🔄 Recurring">
          <div style={{ display: 'flex', gap: 5 }}>
            {(['daily','weekly','monthly'] as const).map(f => <button key={f} onClick={() => onUpdate({ recurring: meta.recurring === f ? null : f })}
              style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: 'none', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: meta.recurring === f ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.04)', color: meta.recurring === f ? '#2dd4bf' : '#475569',
                boxShadow: meta.recurring === f ? 'inset 0 0 0 1px rgba(45,212,191,0.3)' : 'none' }}>{f}</button>)}
          </div>
        </Sec>

        {/* Notes */}
        <Sec label="Notes / Description">
          <textarea value={desc} onChange={e => setDesc(e.target.value)} onBlur={saveDesc} placeholder="Add notes, context, links..." rows={4}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#e2e8f0', resize: 'vertical', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }} />
        </Sec>

        {/* Checklist */}
        <Sec label={`Checklist${sTotal > 0 ? ` (${sDone}/${sTotal})` : ''}`}>
          {sTotal > 0 && <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${sTotal > 0 ? (sDone/sTotal)*100 : 0}%`, background: '#6366f1', borderRadius: 2, transition: 'width 0.3s' }} /></div>}
          {(meta.subtasks||[]).map(st => (
            <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
              <button onClick={() => toggleSub(st.id)} style={{ width: 18, height: 18, borderRadius: 4, border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: st.done ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', boxShadow: st.done ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>
                {st.done && <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700 }}>✓</span>}
              </button>
              <span style={{ fontSize: 14, color: st.done ? '#475569' : '#e2e8f0', textDecoration: st.done ? 'line-through' : 'none', flex: 1 }}>{st.text}</span>
              <button onClick={() => removeSub(st.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}><IconTrash size={14} color="#64748b" /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSub() }} placeholder="Add subtask..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} />
            <button onClick={addSub} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}><IconPlus size={14} color="#818cf8" /></button>
          </div>
        </Sec>

        {/* Links */}
        <Sec label="Links">
          {(meta.links||[]).map((link, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <IconLink size={14} color="#64748b" />
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</a>
              <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}><IconTrash size={14} color="#64748b" /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLink() }} placeholder="Paste URL..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: '#fff', outline: 'none' }} />
            <button onClick={addLink} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}><IconPlus size={14} color="#818cf8" /></button>
          </div>
        </Sec>
      </div>
    </div>
  </>, document.body)
}

function Sec({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 22 }}><div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 10 }}>{label}</div>{children}</div>
}