'use client'
import { useState, useEffect, useRef } from 'react'
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconTarget } from '@tabler/icons-react'

interface FocusTimerProps {
  task: { key: string; label: string } | null
  onStop: (key: string, elapsedSeconds: number) => void
  onClear: () => void
}

export function FocusTimer({ task, onStop, onClear }: FocusTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const startRef = useRef(Date.now())
  const pausedElapsed = useRef(0)

  useEffect(() => {
    if (!task) { setElapsed(0); return }
    startRef.current = Date.now()
    pausedElapsed.current = 0
    setElapsed(0)
    setPaused(false)
  }, [task?.key])

  useEffect(() => {
    if (!task || paused) return
    const interval = setInterval(() => {
      setElapsed(pausedElapsed.current + Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [task, paused])

  const togglePause = () => {
    if (paused) {
      startRef.current = Date.now()
      setPaused(false)
    } else {
      pausedElapsed.current = elapsed
      setPaused(true)
    }
  }

  const stop = () => {
    if (task) onStop(task.key, elapsed)
    onClear()
  }

  if (!task) return null

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9000,
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
      background: '#131c2e', border: '1px solid rgba(244,63,94,0.3)',
      borderRadius: 12, boxShadow: '0 4px 24px rgba(244,63,94,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: paused ? '#fbbf24' : '#f43f5e',
        boxShadow: paused ? '0 0 8px #fbbf24' : '0 0 8px #f43f5e',
        animation: paused ? 'none' : 'pulse-soft 1.5s ease-in-out infinite',
      }} />
      <IconTarget size={14} color="#fb7185" />
      <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', minWidth: 52 }}>
        {timeStr}
      </span>
      <button onClick={togglePause} style={{
        background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer',
        display: 'flex', alignItems: 'center',
      }}>
        {paused ? <IconPlayerPlay size={14} color="#2dd4bf" /> : <IconPlayerPause size={14} color="#fbbf24" />}
      </button>
      <button onClick={stop} style={{
        background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer',
        display: 'flex', alignItems: 'center',
      }}>
        <IconPlayerStop size={14} color="#fb7185" />
      </button>
    </div>
  )
}
