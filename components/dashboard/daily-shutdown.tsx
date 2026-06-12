'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconMoon, IconChevronDown } from '@tabler/icons-react'

interface JournalEntry {
  date: string
  well: string
  improve: string
  completed: number
  total: number
}

const JOURNAL_KEY = 'kornelia-daily-journal'

function loadJournal(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]') } catch { return [] }
}

function saveJournal(entries: JournalEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries))
}

interface DailyShutdownProps {
  onClose: () => void
  tasksCompleted: number
  tasksTotal: number
  onCleanup: () => void
}

export function DailyShutdown({ onClose, tasksCompleted, tasksTotal, onCleanup }: DailyShutdownProps) {
  const [well, setWell] = useState('')
  const [improve, setImprove] = useState('')
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const carryForward = tasksTotal - tasksCompleted

  useEffect(() => { setJournal(loadJournal()) }, [])

  const closeDay = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    const entry: JournalEntry = {
      date: dateStr,
      well: well.trim(),
      improve: improve.trim(),
      completed: tasksCompleted,
      total: tasksTotal,
    }
    const updated = [entry, ...journal].slice(0, 90) // keep 90 days
    saveJournal(updated)
    setJournal(updated)
    onCleanup()
    onClose()
  }

  return createPortal(<>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10001, width: 420, maxHeight: '85vh', overflowY: 'auto', background: '#0f1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconMoon size={20} color="#818cf8" />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Daily Shutdown</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IconX size={20} color="#64748b" /></button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 8px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#818cf8', fontVariantNumeric: 'tabular-nums' }}>{tasksCompleted}</div>
            <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Completed</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 8px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{carryForward}</div>
            <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Carry Forward</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 8px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2dd4bf', fontVariantNumeric: 'tabular-nums' }}>{tasksTotal}</div>
            <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Total</div>
          </div>
        </div>

        {/* Journal */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>What went well?</div>
          <input value={well} onChange={e => setWell(e.target.value)} placeholder="One thing that worked..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#e2e8f0', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 6 }}>Improve?</div>
          <textarea value={improve} onChange={e => setImprove(e.target.value)} placeholder="What would you do differently..." rows={3}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#e2e8f0', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        {/* Warning */}
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontSize: 12, color: '#fbbf24', lineHeight: 1.4 }}>Closing will remove all completed tasks from Top Prio, Messages, and Other To-Do.</span>
        </div>

        {/* Close button */}
        <button onClick={closeDay} style={{ width: '100%', padding: '12px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', background: '#6366f1', color: '#fff', border: 'none', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
          Close the Day
        </button>

        {/* Journal history */}
        {journal.length > 0 && (
          <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
            <button onClick={() => setShowHistory(!showHistory)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', width: '100%' }}>
              <IconChevronDown size={14} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              Past entries ({journal.length})
            </button>
            {showHistory && (
              <div style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto' }}>
                {journal.map((entry, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#818cf8' }}>{entry.date}</span>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{entry.completed}/{entry.total} done</span>
                    </div>
                    {entry.well && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>✅ {entry.well}</div>}
                    {entry.improve && <div style={{ fontSize: 12, color: '#94a3b8' }}>💡 {entry.improve}</div>}
                    {!entry.well && !entry.improve && <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>No notes</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </>, document.body)
}
