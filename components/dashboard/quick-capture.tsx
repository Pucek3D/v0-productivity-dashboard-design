'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickCaptureProps {
  open: boolean
  onClose: () => void
  onCapture: (text: string) => void
}

export function QuickCapture({ open, onClose, onCapture }: QuickCaptureProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const submit = () => {
    const text = value.trim()
    if (!text) return
    onCapture(text)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-foreground-muted uppercase tracking-widest">Quick Capture</p>
            <p className="text-[11px] text-foreground-subtle mt-0.5">Lands in Inbox — classify during weekly review</p>
          </div>
          <button onClick={onClose} className="text-foreground-subtle hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Capture anything… e.g. &quot;Call Sarah about Q3 plan Friday 3pm #ACME @work&quot;"
            className="w-full bg-transparent text-[15px] text-foreground placeholder:text-foreground-subtle outline-none"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-[11px] text-foreground-subtle">Enter to capture · Esc to dismiss</span>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors',
              value.trim()
                ? 'bg-accent-brand text-primary-foreground hover:bg-accent-brand-hover'
                : 'bg-surface-raised text-foreground-subtle cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
            Send to Inbox
          </button>
        </div>
      </div>
    </div>
  )
}
