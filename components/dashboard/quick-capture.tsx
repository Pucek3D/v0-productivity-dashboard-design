'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  IconX, IconMicrophone, IconPhoto, IconTable, IconSparkles,
  IconCheck, IconTrash, IconLoader2, IconPlayerStopFilled, IconWand,
} from '@tabler/icons-react'
import {
  analyzeCapture, splitIntoItems, DEST_META, NEW_TARGET,
  type ProposedTask, type CaptureDest, type AnalyzeContext,
} from '@/lib/capture-analyze'
import {
  isSpeechSupported, isInIframe, startVoiceCapture, ocrImage, parseSpreadsheetFile, parsePastedCells,
  type VoiceSession,
} from '@/lib/capture-inputs'

interface Props {
  context: AnalyzeContext
  /** Route the confirmed proposals into the app's task surfaces. */
  onCommit: (tasks: ProposedTask[]) => void
}

const TEAL = '#2dd4bf'
const PANEL_BG = '#0d1422'

export function SmartCapture({ context, onCommit }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrPct, setOcrPct] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [proposals, setProposals] = useState<ProposedTask[] | null>(null)
  const [notice, setNotice] = useState('')
  const voiceRef = useRef<VoiceSession | null>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const sheetInputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const itemCount = splitIntoItems(text).length

  // Close on Escape; stop voice when panel closes.
  useEffect(() => {
    if (!open) { voiceRef.current?.stop(); voiceRef.current = null; setRecording(false); return }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const appendText = useCallback((extra: string) => {
    if (!extra.trim()) return
    setText(prev => (prev.trim() ? prev.replace(/\s*$/, '') + '\n' : '') + extra.trim())
  }, [])

  // ── Voice ──
  const toggleVoice = useCallback(() => {
    if (recording) { voiceRef.current?.stop(); voiceRef.current = null; setRecording(false); return }
    if (!isSpeechSupported()) { setNotice('Voice input is not supported in this browser. Try Chrome or Edge.'); return }
    if (isInIframe()) { setNotice('Microphone is blocked inside the preview. Open the app in its own browser tab to use voice.'); return }
    const baseLen = text.length
    const session = startVoiceCapture(
      (transcript) => setText(prev => prev.slice(0, baseLen) + (baseLen && transcript ? '\n' : '') + transcript),
      () => { setRecording(false); voiceRef.current = null },
      (message) => { setNotice(message); setRecording(false); voiceRef.current = null },
    )
    if (session) { voiceRef.current = session; setRecording(true); setNotice('') }
  }, [recording, text])

  // ── Image OCR ──
  const handleImage = useCallback(async (file: Blob) => {
    setOcrBusy(true); setOcrPct(0); setNotice('Reading image…')
    try {
      const out = await ocrImage(file, p => setOcrPct(Math.round(p * 100)))
      if (out) { appendText(out); setNotice('Read text from image.') }
      else setNotice('No text found in that image.')
    } catch { setNotice('Could not read that image.') }
    finally { setOcrBusy(false); setOcrPct(0) }
  }, [appendText])

  // ── Spreadsheet ──
  const handleSheet = useCallback(async (file: File) => {
    setNotice('Reading spreadsheet…')
    try {
      const out = await parseSpreadsheetFile(file)
      if (out) { appendText(out); setNotice('Imported rows from spreadsheet.') }
      else setNotice('No rows found in that file.')
    } catch { setNotice('Could not read that file.') }
  }, [appendText])

  // ── Paste: images + spreadsheet cells ──
  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const img = items.find(i => i.type.startsWith('image/'))
    if (img) { const f = img.getAsFile(); if (f) { e.preventDefault(); handleImage(f); return } }
    const pasted = e.clipboardData.getData('text/plain')
    const cells = parsePastedCells(pasted)
    if (cells) { e.preventDefault(); appendText(cells); setNotice('Imported pasted spreadsheet cells.') }
  }, [handleImage, appendText])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) handleImage(file)
    else if (/\.(xlsx?|csv)$/i.test(file.name)) handleSheet(file)
  }, [handleImage, handleSheet])

  // ── Analyze ──
  const runAnalyze = useCallback(async () => {
    if (!text.trim()) return
    setAnalyzing(true); setNotice('')
    voiceRef.current?.stop(); voiceRef.current = null; setRecording(false)
    try {
      const result = await analyzeCapture(text, context)
      setProposals(result)
    } finally { setAnalyzing(false) }
  }, [text, context])

  const updateProposal = (id: string, patch: Partial<ProposedTask>) =>
    setProposals(prev => prev?.map(p => (p.id === id ? { ...p, ...patch } : p)) ?? prev)
  const removeProposal = (id: string) =>
    setProposals(prev => prev?.filter(p => p.id !== id) ?? prev)

  const commit = useCallback(() => {
    if (!proposals?.length) return
    onCommit(proposals)
    setNotice(`Added ${proposals.length} task${proposals.length > 1 ? 's' : ''}.`)
    setText(''); setProposals(null)
    setTimeout(() => { setOpen(false); setNotice('') }, 700)
  }, [proposals, onCommit])

  const reset = () => { setProposals(null); setNotice('') }

  // ── Slim trigger bar (replaces the old header input) ──
  const trigger = (
    <button
      onClick={() => setOpen(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.18)',
        borderRadius: 10, padding: '8px 12px', cursor: 'text', textAlign: 'left',
      }}
    >
      <IconSparkles size={15} color={TEAL} />
      <span style={{ flex: 1, color: '#64748b', fontSize: 12 }}>Capture anything — type, talk, paste a photo or sheet…</span>
      <span style={{ display: 'flex', gap: 8, color: '#475569' }}>
        <IconMicrophone size={14} /><IconPhoto size={14} /><IconTable size={14} />
      </span>
    </button>
  )

  if (!open) return trigger

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10050, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', background: 'rgba(3,7,15,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          width: '100%', maxWidth: 720, background: PANEL_BG,
          border: '1px solid rgba(45,212,191,0.20)', borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(45,212,191,0.06), 0 0 60px rgba(45,212,191,0.08)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '88vh',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <IconSparkles size={18} color={TEAL} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Smart Capture</div>
            <div style={{ fontSize: 10.5, color: '#64748b' }}>Brain-dump anything — it gets sorted into your tasks</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}><IconX size={18} /></button>
        </div>

        {!proposals ? (
          <>
            {/* Input */}
            <div style={{ padding: 18, overflowY: 'auto' }}>
              <textarea
                ref={textRef}
                value={text}
                autoFocus
                onChange={e => setText(e.target.value)}
                onPaste={onPaste}
                placeholder={'e.g.\nReply to Giulia about the deck\nMeeting with Jan at 3pm\nBuy groceries\nLearn Spanish'}
                style={{
                  width: '100%', minHeight: 150, resize: 'vertical', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12,
                  fontSize: 13, lineHeight: 1.6, color: '#e2e8f0', outline: 'none', fontFamily: 'inherit',
                }}
              />

              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <ToolBtn active={recording} onClick={toggleVoice} icon={recording ? <IconPlayerStopFilled size={14} /> : <IconMicrophone size={14} />} label={recording ? 'Stop' : 'Voice'} accentColor={recording ? '#fb7185' : TEAL} />
                <ToolBtn disabled={ocrBusy} onClick={() => imgInputRef.current?.click()} icon={ocrBusy ? <IconLoader2 size={14} className="animate-spin" /> : <IconPhoto size={14} />} label={ocrBusy ? `Reading ${ocrPct}%` : 'Image'} accentColor={TEAL} />
                <ToolBtn onClick={() => sheetInputRef.current?.click()} icon={<IconTable size={14} />} label="Spreadsheet" accentColor={TEAL} />
                <div style={{ flex: 1 }} />
                {!!itemCount && <span style={{ fontSize: 11, color: '#64748b' }}>{itemCount} item{itemCount > 1 ? 's' : ''}</span>}
              </div>

              {recording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 11, color: '#fb7185' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb7185' }} className="animate-pulse" /> Listening… speak now
                </div>
              )}
              {notice && <div style={{ marginTop: 10, fontSize: 11, color: TEAL }}>{notice}</div>}

              <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = '' }} />
              <input ref={sheetInputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleSheet(f); e.target.value = '' }} />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setOpen(false)} style={btnGhost}>Cancel</button>
              <button onClick={runAnalyze} disabled={!text.trim() || analyzing} style={{ ...btnPrimary, opacity: !text.trim() || analyzing ? 0.5 : 1 }}>
                {analyzing ? <IconLoader2 size={14} className="animate-spin" /> : <IconWand size={14} />}
                {analyzing ? 'Analyzing…' : 'Analyze & sort'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Review */}
            <div style={{ padding: '8px 18px 4px', fontSize: 11, color: '#64748b' }}>
              Review where each task goes, then add them all. {proposals.length} suggestion{proposals.length > 1 ? 's' : ''}.
            </div>
            <div style={{ padding: '6px 18px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proposals.length === 0 && <div style={{ fontSize: 12, color: '#64748b', padding: '12px 0' }}>Nothing to add. Go back and capture something.</div>}
              {proposals.map(p => (
                <ProposalRow key={p.id} p={p} context={context} onChange={patch => updateProposal(p.id, patch)} onRemove={() => removeProposal(p.id)} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={reset} style={btnGhost}>← Back to edit</button>
              <button onClick={commit} disabled={!proposals.length} style={{ ...btnPrimary, opacity: proposals.length ? 1 : 0.5 }}>
                <IconCheck size={14} /> Add {proposals.length} task{proposals.length > 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (<>{trigger}{typeof document !== 'undefined' && createPortal(modal, document.body)}</>)
}

// ── Review row ──
function ProposalRow({ p, context, onChange, onRemove }: {
  p: ProposedTask
  context: AnalyzeContext
  onChange: (patch: Partial<ProposedTask>) => void
  onRemove: () => void
}) {
  const dotColor = p.confidence >= 0.7 ? '#34d399' : p.confidence >= 0.5 ? '#fbbf24' : '#94a3b8'
  const todoSections = context.todoSections ?? []
  const onDest = (dest: CaptureDest) => {
    if (dest === 'project') { const t = context.projects[0]; onChange({ dest, targetKey: t?.key, targetName: t?.name, targetColor: t?.color }) }
    else if (dest === 'goal') { const t = context.goals[0]; onChange({ dest, targetKey: t?.key, targetName: t?.name, targetColor: t?.color }) }
    else if (dest === 'todo') { const t = todoSections[0]; onChange({ dest, targetKey: t?.key, targetName: t?.name, targetColor: undefined }) }
    else onChange({ dest, targetKey: undefined, targetName: undefined })
  }
  const targets: { key: string; name: string; color?: string }[] =
    p.dest === 'project' ? context.projects : p.dest === 'goal' ? context.goals : p.dest === 'todo' ? todoSections : []
  const hasTargets = p.dest === 'project' || p.dest === 'goal' || p.dest === 'todo'
  const isNew = p.targetKey === NEW_TARGET
  const newLabel = p.dest === 'project' ? '+ New project' : p.dest === 'goal' ? '+ New goal' : '+ New section'
  const onTarget = (val: string) => {
    if (val === NEW_TARGET) onChange({ targetKey: NEW_TARGET, targetName: undefined, targetColor: undefined })
    else { const t = targets.find(x => x.key === val); onChange({ targetKey: t?.key, targetName: t?.name, targetColor: t?.color }) }
  }
  // Priority badge cycles high → medium → low on click.
  const PRI_NEXT: Record<'high' | 'medium' | 'low', 'high' | 'medium' | 'low'> = { high: 'medium', medium: 'low', low: 'high' }
  const priColor = p.priority === 'high' ? '#fb7185' : p.priority === 'medium' ? '#fbbf24' : '#94a3b8'
  const showCategory = p.dest === 'prio' || p.dest === 'message' || p.dest === 'meeting' || p.dest === 'todo'
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span title={`${Math.round(p.confidence * 100)}% confident`} style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 6, flexShrink: 0 }} />
        <input
          value={p.label}
          onChange={e => onChange({ label: e.target.value })}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e2e8f0', fontFamily: 'inherit', minWidth: 0 }}
        />
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 2 }}><IconTrash size={14} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap', paddingLeft: 16 }}>
        <ThemedSelect
          value={p.dest}
          onChange={v => onDest(v as CaptureDest)}
          options={(Object.keys(DEST_META) as CaptureDest[]).map(d => ({ value: d, label: DEST_META[d].label }))}
        />
        {hasTargets && (
          <ThemedSelect
            value={isNew ? NEW_TARGET : (p.targetKey || '')}
            onChange={onTarget}
            minWidth={130}
            options={[...targets.map(t => ({ value: t.key, label: t.name })), { value: NEW_TARGET, label: newLabel }]}
          />
        )}
        {hasTargets && isNew && (
          <input
            value={p.newTargetName ?? ''}
            onChange={e => onChange({ newTargetName: e.target.value })}
            placeholder={p.dest === 'todo' ? 'New section name…' : p.dest === 'goal' ? 'New goal name…' : 'New project name…'}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(45,212,191,0.30)', borderRadius: 7, padding: '3px 8px', fontSize: 11, color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', minWidth: 130 }}
          />
        )}
        {/* Priority badge — click to cycle */}
        <button
          onClick={() => onChange({ priority: PRI_NEXT[p.priority] })}
          title="Click to change priority"
          style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: `${priColor}22`, color: priColor, border: `1px solid ${priColor}55`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}
        >{p.priority}</button>
        {/* Owner / delegate */}
        {p.owner && (
          <span style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.30)', borderRadius: 5, padding: '2px 7px' }}>@{p.owner}</span>
        )}
        {showCategory && (
          <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
            {(['work', 'home'] as const).map(c => (
              <button key={c} onClick={() => onChange({ category: c })} style={{ padding: '3px 9px', fontSize: 10, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer', border: 'none', background: p.category === c ? 'rgba(45,212,191,0.18)' : 'transparent', color: p.category === c ? TEAL : '#64748b' }}>{c}</button>
            ))}
          </div>
        )}
        {/* Prio half — top (urgent) vs other */}
        {p.dest === 'prio' && (
          <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
            {([['top', 'Top'], ['other', 'Other']] as const).map(([s, lbl]) => (
              <button key={s} onClick={() => onChange({ section: s })} style={{ padding: '3px 9px', fontSize: 10, fontWeight: 600, cursor: 'pointer', border: 'none', background: (p.section ?? 'top') === s ? 'rgba(129,140,248,0.20)' : 'transparent', color: (p.section ?? 'top') === s ? '#818cf8' : '#64748b' }}>{lbl}</button>
            ))}
          </div>
        )}
        {p.dest === 'meeting' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>on</span>
            <input
              type="date"
              value={p.deadline ?? todayISO()}
              onChange={e => onChange({ deadline: e.target.value })}
              style={dateTimeStyle}
            />
            <input
              type="time"
              value={`${String(p.hour ?? 9).padStart(2, '0')}:${String(p.minute ?? 0).padStart(2, '0')}`}
              onChange={e => { const [h, m] = e.target.value.split(':').map(Number); onChange({ hour: h, minute: m }) }}
              style={dateTimeStyle}
            />
          </div>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}>{p.reason}</span>
      </div>
    </div>
  )
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Themed dropdown ──
// Replaces the native <select> so the popup list uses the dark app background
// instead of the OS default (white), which can't be styled reliably.
function ThemedSelect({ value, options, onChange, minWidth }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, minWidth ?? 0) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close) }
  }, [open])

  const current = options.find(o => o.value === value)
  return (
    <>
      <button ref={btnRef} type="button" onClick={openMenu} style={{ ...selStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current?.label ?? '—'}</span>
        <span style={{ color: '#64748b', fontSize: 9 }}>▾</span>
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10060 }} />
          <div style={{
            position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width, zIndex: 10061,
            background: PANEL_BG, border: '1px solid rgba(45,212,191,0.25)', borderRadius: 8,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)', padding: 4, maxHeight: 280, overflowY: 'auto',
          }}>
            {options.map(o => {
              const selected = o.value === value
              const hovered = hover === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  onMouseEnter={() => setHover(o.value)}
                  onMouseLeave={() => setHover(h => (h === o.value ? null : h))}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 6,
                    border: 'none', cursor: 'pointer', fontSize: 11.5, fontFamily: 'inherit',
                    background: selected ? 'rgba(45,212,191,0.16)' : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: selected ? TEAL : '#e2e8f0',
                  }}
                >{o.label}</button>
              )
            })}
          </div>
        </>,
        document.body,
      )}
    </>
  )
}

// ── Small styled helpers ──
function ToolBtn({ icon, label, onClick, active, disabled, accentColor }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; disabled?: boolean; accentColor: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 8,
      cursor: disabled ? 'default' : 'pointer', fontSize: 11, fontWeight: 600,
      background: active ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? accentColor + '55' : 'rgba(255,255,255,0.08)'}`,
      color: active ? accentColor : '#94a3b8', opacity: disabled ? 0.6 : 1,
    }}>{icon}{label}</button>
  )
}

const btnGhost: React.CSSProperties = { background: 'none', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#94a3b8' }
const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: TEAL, border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#04211c' }
const selStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '3px 8px', fontSize: 11, color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', colorScheme: 'dark' }
// Native date/time inputs — colorScheme dark keeps their picker/popups dark too.
const dateTimeStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 7, padding: '3px 6px', fontSize: 10.5, color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }
