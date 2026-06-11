'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconCalendar, IconUser, IconClock, IconFlag, IconLink, IconChecklist, IconPlus, IconTrash } from '@tabler/icons-react'
import { type TaskMeta, getDateLabel } from '@/lib/task-meta'

interface TaskModalProps {
  taskKey: string
  taskLabel: string
  meta: TaskMeta
  onUpdate: (updates: Partial<TaskMeta>) => void
  onClose: () => void
}

const PRIORITIES = [
  { value: 'high', label: 'High', color: '#fb7185' },
  { value: 'medium', label: 'Medium', color: '#fbbf24' },
  { value: 'low', label: 'Low', color: '#64748b' },
]

const TIME_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240]

export function TaskModal({ taskKey, taskLabel, meta, onUpdate, onClose }: TaskModalProps) {
  const [desc, setDesc] = useState(meta.description || '')
  const [newLink, setNewLink] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const descRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const saveDesc = () => {
    if (desc !== (meta.description || '')) onUpdate({ description: desc || undefined })
  }

  const addLink = () => {
    if (!newLink.trim()) return
    onUpdate({ links: [...(meta.links || []), newLink.trim()] })
    setNewLink('')
  }

  const removeLink = (idx: number) => {
    const updated = [...(meta.links || [])]
    updated.splice(idx, 1)
    onUpdate({ links: updated.length ? updated : undefined })
  }

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    const st = { id: `st-${Date.now()}`, text: newSubtask.trim(), done: false }
    onUpdate({ subtasks: [...(meta.subtasks || []), st] })
    setNewSubtask('')
  }

  const toggleSubtask = (id: string) => {
    const updated = (meta.subtasks || []).map(s => s.id === id ? { ...s, done: !s.done } : s)
    onUpdate({ subtasks: updated })
  }

  const removeSubtask = (id: string) => {
    const updated = (meta.subtasks || []).filter(s => s.id !== id)
    onUpdate({ subtasks: updated.length ? updated : undefined })
  }

  const dateInfo = meta.deadline ? getDateLabel(meta.deadline) : null
  const timeStr = meta.hour !== undefined ? `${meta.hour.toString().padStart(2, '0')}:${(meta.minute ?? 0).toString().padStart(2, '0')}` : null
  const subtasksDone = (meta.subtasks || []).filter(s => s.done).length
  const subtasksTotal = (meta.subtasks || []).length

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 10001,
        background: '#0f1623', borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 4 }}>
              {taskKey}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
              {taskLabel}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <IconX size={18} color="#64748b" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', flex: 1 }}>

          {/* Meta row: deadline + owner + priority + estimate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {/* Deadline */}
            <MetaField icon={<IconCalendar size={14} />} label="Deadline"
              value={dateInfo ? <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${dateInfo.className}`}>{dateInfo.text}{timeStr ? ` ${timeStr}` : ''}</span> : null}
              empty="No date set"
            />
            {/* Owner */}
            <MetaField icon={<IconUser size={14} />} label="Owner"
              value={meta.owner ? <span style={{ color: '#2dd4bf', fontSize: 12, fontWeight: 600 }}>{meta.owner}</span> : null}
              empty="Unassigned"
            />
            {/* Priority */}
            <div>
              <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconFlag size={14} color="#64748b" /> Priority
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => onUpdate({ priority: meta.priority === p.value ? undefined : p.value as any })}
                    style={{
                      padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                      border: 'none', textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: meta.priority === p.value ? `${p.color}22` : 'rgba(255,255,255,0.04)',
                      color: meta.priority === p.value ? p.color : '#475569',
                      boxShadow: meta.priority === p.value ? `inset 0 0 0 1px ${p.color}44` : 'none',
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Time Estimate */}
            <div>
              <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconClock size={14} color="#64748b" /> Estimate
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {TIME_OPTIONS.map(t => (
                  <button key={t} onClick={() => onUpdate({ timeEstimate: meta.timeEstimate === t ? undefined : t })}
                    style={{
                      padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 500,
                      border: 'none', fontVariantNumeric: 'tabular-nums',
                      background: meta.timeEstimate === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      color: meta.timeEstimate === t ? '#818cf8' : '#475569',
                      boxShadow: meta.timeEstimate === t ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none',
                    }}>
                    {t >= 60 ? `${t / 60}h` : `${t}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <Section label="Notes / Description">
            <textarea ref={descRef} value={desc} onChange={e => setDesc(e.target.value)} onBlur={saveDesc}
              placeholder="Add notes, context, links..."
              rows={4}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e2e8f0', resize: 'vertical',
                outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
              }}
            />
          </Section>

          {/* Subtasks / Checklist */}
          <Section label={`Checklist${subtasksTotal > 0 ? ` (${subtasksDone}/${subtasksTotal})` : ''}`}>
            {subtasksTotal > 0 && (
              <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0}%`, background: '#6366f1', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            )}
            {(meta.subtasks || []).map(st => (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <button onClick={() => toggleSubtask(st.id)} style={{
                  width: 16, height: 16, borderRadius: 3, border: 'none', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: st.done ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                  boxShadow: st.done ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                }}>
                  {st.done && <span style={{ color: '#a5b4fc', fontSize: 10, fontWeight: 700 }}>✓</span>}
                </button>
                <span style={{ fontSize: 12, color: st.done ? '#475569' : '#e2e8f0', textDecoration: st.done ? 'line-through' : 'none', flex: 1 }}>
                  {st.text}
                </span>
                <button onClick={() => removeSubtask(st.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}>
                  <IconTrash size={12} color="#64748b" />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addSubtask() }}
                placeholder="Add subtask..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#fff', outline: 'none',
                }}
              />
              <button onClick={addSubtask} style={{
                background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}>
                <IconPlus size={12} color="#818cf8" />
              </button>
            </div>
          </Section>

          {/* Links */}
          <Section label="Links">
            {(meta.links || []).map((link, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                <IconLink size={12} color="#64748b" />
                <a href={link} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {link}
                </a>
                <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}>
                  <IconTrash size={12} color="#64748b" />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input value={newLink} onChange={e => setNewLink(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addLink() }}
                placeholder="Paste URL..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#fff', outline: 'none',
                }}
              />
              <button onClick={addLink} style={{
                background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}>
                <IconPlus size={12} color="#818cf8" />
              </button>
            </div>
          </Section>

        </div>
      </div>
    </>,
    document.body
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function MetaField({ icon, label, value, empty }: { icon: React.ReactNode; label: string; value: React.ReactNode; empty: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </div>
      {value || <span style={{ fontSize: 11, color: '#334155' }}>{empty}</span>}
    </div>
  )
}