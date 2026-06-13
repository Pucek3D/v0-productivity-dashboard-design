'use client'
import { useState, useRef, useEffect } from 'react'

/**
 * Inline-editable task label. Double-click to edit, Enter/blur to commit,
 * Escape to cancel. Used across every dashboard card so any task name can be
 * renamed in place. Commits flow up through `onRename` which propagates the
 * new name to synced surfaces (Top Prio, Projects, Goals, etc.).
 */
export function EditableLabel({
  value,
  onRename,
  className,
  style,
  as = 'span',
  title,
}: {
  value: string
  onRename: (newName: string) => void
  className?: string
  style?: React.CSSProperties
  as?: 'span' | 'div'
  title?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select() } }, [editing])
  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onRename(trimmed)
    else setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          else if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={className}
        style={{
          ...style,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(129,140,248,0.5)',
          borderRadius: 4,
          padding: '1px 4px',
          outline: 'none',
          font: 'inherit',
          color: 'inherit',
          width: '100%',
          minWidth: 0,
        }}
      />
    )
  }

  const Tag = as as any
  return (
    <Tag
      className={className}
      style={style}
      title={title ?? 'Double-click to rename'}
      onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditing(true) }}
    >
      {value}
    </Tag>
  )
}
