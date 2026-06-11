'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconMoon, IconX, IconCheck } from '@tabler/icons-react'
import { saveJournalEntry, getYesterdayEntry } from '@/lib/journal'

interface DailyShutdownProps {
  onClose: () => void
  tasksCompleted: number
  tasksTotal: number
}

export function DailyShutdown({ onClose, tasksCompleted, tasksTotal }: DailyShutdownProps) {
  const [wentWell, setWentWell] = useState('')
  const [reflection, setReflection] = useState('')
  const [saved, setSaved] = useState(false)
  const yesterday = getYesterdayEntry()
  const incomplete = tasksTotal - tasksCompleted

  const save = () => {
    const today = new Date()
    const ds = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    saveJournalEntry({
      date: ds, reflection, wentWell, tasksCompleted, tasksCarriedForward: incomplete,
    })
    setSaved(true)
    setTimeout(onClose, 1200)
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 10001, width: 400, maxHeight: '80vh', overflowY: 'auto',
        background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 24,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        {saved ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <IconCheck size={40} color="#2dd4bf" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Day closed</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>See you tomorrow!</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconMoon size={20} color="#818cf8" />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Daily Shutdown</span>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <IconX size={16} color="#64748b" />
              </button>
            </div>

            {/* Yesterday's note */}
            {yesterday && (
              <div style={{
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 10, padding: 12, marginBottom: 16,
              }}>
                <div style={{ fontSize: 9, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4 }}>
                  Yesterday's note
                </div>
                {yesterday.wentWell && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>✓ {yesterday.wentWell}</div>}
                {yesterday.reflection && <div style={{ fontSize: 12, color: '#64748b' }}>→ {yesterday.reflection}</div>}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <StatBox label="Completed" value={tasksCompleted} color="#2dd4bf" />
              <StatBox label="Carry forward" value={incomplete} color={incomplete > 0 ? '#fbbf24' : '#2dd4bf'} />
              <StatBox label="Total" value={tasksTotal} color="#818cf8" />
            </div>

            {/* What went well */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                What went well today?
              </label>
              <input value={wentWell} onChange={e => setWentWell(e.target.value)}
                placeholder="One thing that worked..."
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e2e8f0', outline: 'none',
                }}
              />
            </div>

            {/* Reflection */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Anything to improve?
              </label>
              <textarea value={reflection} onChange={e => setReflection(e.target.value)}
                placeholder="What would you do differently..."
                rows={3}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e2e8f0', outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                }}
              />
            </div>

            {/* Save button */}
            <button onClick={save} style={{
              width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              background: '#6366f1', color: '#fff',
              boxShadow: '0 0 16px rgba(99,102,241,0.4)',
            }}>
              Close the day
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '10px 0',
      background: 'rgba(255,255,255,0.03)', borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}