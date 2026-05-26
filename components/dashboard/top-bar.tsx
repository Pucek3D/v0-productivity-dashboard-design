"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, Command } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopBarProps {
  onQuickCapture?: (text: string) => void
}

export function TopBar({ onQuickCapture }: TopBarProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [captureOpen, setCaptureOpen] = useState(false)
  const [captureText, setCaptureText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      )
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }))
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "a") {
        e.preventDefault()
        setCaptureOpen(true)
      }
      if (e.key === "Escape") {
        setCaptureOpen(false)
        setCaptureText("")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (captureOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [captureOpen])

  const handleCapture = () => {
    if (captureText.trim()) {
      onQuickCapture?.(captureText.trim())
      setCaptureText("")
      setCaptureOpen(false)
    }
  }

  return (
    <>
      <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-background shrink-0">
        {/* Date */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-muted">{date}</span>
          <span className="text-xs text-foreground-subtle font-mono">{time}</span>
        </div>

        {/* Command bar hint */}
        <button
          onClick={() => setCaptureOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-foreground-muted text-xs hover:border-border hover:text-foreground transition-colors w-64 group"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Search or capture...</span>
          <kbd className="flex items-center gap-0.5 text-[10px] font-mono text-foreground-subtle">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </kbd>
        </button>

        {/* Quick capture button */}
        <button
          onClick={() => setCaptureOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent-color text-white text-xs font-medium hover:bg-accent-color-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Capture</span>
          <kbd className="text-[10px] font-mono opacity-70 ml-0.5">⇧⌘A</kbd>
        </button>
      </header>

      {/* Quick capture overlay */}
      {captureOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCaptureOpen(false)
              setCaptureText("")
            }
          }}
        >
          <div className="w-[560px] rounded-xl bg-card border border-border shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Plus className="w-4 h-4 text-accent-color shrink-0" />
              <input
                ref={inputRef}
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCapture()
                  if (e.key === "Escape") {
                    setCaptureOpen(false)
                    setCaptureText("")
                  }
                }}
                placeholder='e.g. "Call Sarah about Q3 plan Friday 3pm #ACME @work"'
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <p className="text-xs text-foreground-subtle">
                Captures land in <span className="text-foreground-muted">Inbox</span>. Process during weekly review.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCaptureOpen(false); setCaptureText("") }}
                  className="text-xs text-foreground-subtle hover:text-foreground transition-colors px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCapture}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
                    captureText.trim()
                      ? "bg-accent-color text-white hover:bg-accent-color-hover"
                      : "bg-muted text-foreground-subtle cursor-not-allowed"
                  )}
                >
                  Add to Inbox
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
