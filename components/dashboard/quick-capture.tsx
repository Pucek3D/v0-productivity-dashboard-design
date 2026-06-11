'use client'
import { useState } from 'react'
import { IconPlus, IconInbox, IconX } from '@tabler/icons-react'

interface QuickCaptureProps {
  captured: string[]
  onAdd: (text: string) => void
  onRemove: (idx: number) => void
}

export function QuickCapture({ captured, onAdd, onRemove }: QuickCaptureProps) {
  const [text, setText] = useState('')
  const [showInbox, setShowInbox] = useState(false)

  const submit = () => {
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      {/* Input */}
      <div style={{
        display: 'flex', flex: 1, alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '6px 12px',
      }}>
        <IconPlus size={14} color="#64748b" />
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="Quick capture — type a task and press Enter"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 12, color: '#e2e8f0', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Inbox badge */}
      <button onClick={() => setShowInbox(!showInbox)} style={{
        position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <IconInbox size={14} color="#94a3b8" />
        {captured.length > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#fff', background: '#f43f5e',
            borderRadius: 8, padding: '1px 5px', minWidth: 16, textAlign: 'center',
          }}>
            {captured.length}
          </span>
        )}
      </button>

      {/* Inbox dropdown */}
      {showInbox && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 300,
          background: '#131c2e', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 10, zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 8 }}>
            Inbox ({captured.length})
          </div>
          {captured.length === 0 && (
            <div style={{ fontSize: 11, color: '#334155', padding: '8px 0' }}>Nothing captured yet</div>
          )}
          {captured.map((task, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
              borderBottom: i < captured.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <span style={{ fontSize: 12, color: '#e2e8f0', flex: 1 }}>{task}</span>
              <button onClick={() => onRemove(i)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              }}>
                <IconX size={12} color="#64748b" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}