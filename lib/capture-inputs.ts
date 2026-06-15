// ─────────────────────────────────────────────────────────────────────────
// Smart Capture — input helpers
//
// Browser-side helpers that turn voice, images, and spreadsheets into plain
// text for the analyzer. All run client-side (no API key):
//   • Voice   → Web Speech API (SpeechRecognition)
//   • Image   → tesseract.js OCR (lazy-loaded)
//   • Excel   → xlsx parser (lazy-loaded) + pasted-cell (TSV) handling
// ─────────────────────────────────────────────────────────────────────────

// ── Voice (Web Speech API) ──
type SpeechRec = any

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}

export interface VoiceSession {
  stop: () => void
}

/** True when the app is running inside an iframe (e.g. the v0 preview). */
export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false
  try { return window.self !== window.top } catch { return true }
}

/** Map a SpeechRecognition error code to a human-friendly message. */
function voiceErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return isInIframe()
        ? 'Microphone is blocked in the preview. Open the app in its own browser tab, then allow mic access.'
        : 'Microphone access was denied. Allow it in your browser’s site settings and try again.'
    case 'no-speech':
      return 'No speech detected — try speaking a bit louder.'
    case 'audio-capture':
      return 'No microphone found. Check that one is connected and enabled.'
    case 'network':
      return 'Voice recognition needs a network connection and works best in Chrome or Edge.'
    case 'aborted':
      return ''
    default:
      return `Voice input failed (${code}).`
  }
}

/**
 * Start live voice transcription. `onText` is called with the running
 * transcript; `onEnd` fires when recognition stops; `onError` reports a
 * human-friendly reason. Returns a session you can stop manually, or null if
 * unsupported.
 */
export function startVoiceCapture(
  onText: (transcript: string, isFinal: boolean) => void,
  onEnd: () => void,
  onError?: (message: string) => void,
  lang = 'en-US',
): VoiceSession | null {
  if (!isSpeechSupported()) { onError?.('Voice input is not supported in this browser. Try Chrome or Edge.'); return null }
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const rec: SpeechRec = new Ctor()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = lang
  let finalText = ''
  rec.onresult = (e: any) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalText += r[0].transcript
      else interim += r[0].transcript
    }
    onText((finalText + ' ' + interim).trim(), !interim)
  }
  rec.onerror = (e: any) => {
    const msg = voiceErrorMessage(e?.error || 'unknown')
    if (msg) onError?.(msg)
    try { rec.stop() } catch {}
  }
  rec.onend = () => onEnd()
  try {
    rec.start()
  } catch (err: any) {
    onError?.('Could not start the microphone. Open the app in its own tab and allow mic access.')
    return null
  }
  return { stop: () => { try { rec.stop() } catch {} } }
}

// ── Image OCR (tesseract.js, lazy) ──
/**
 * Extract text from an image blob/file. Uses eng+pol so Polish notes read too.
 * `onProgress` receives 0..1.
 */
export async function ocrImage(file: Blob, onProgress?: (p: number) => void): Promise<string> {
  const Tesseract = (await import('tesseract.js')).default
  const result = await Tesseract.recognize(file, 'eng+pol', {
    logger: (m: any) => { if (m.status === 'recognizing text' && onProgress) onProgress(m.progress) },
  })
  return (result?.data?.text || '').trim()
}

// ── Spreadsheet (xlsx, lazy) ──
/** Parse an uploaded .xlsx/.csv file into newline-separated task lines. */
export async function parseSpreadsheetFile(file: File): Promise<string> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const lines: string[] = []
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1, blankrows: false })
    for (const row of rows) lines.push(rowToLine(row))
  }
  return lines.filter(Boolean).join('\n')
}

/** Detect & parse pasted spreadsheet cells (tab-separated rows). */
export function parsePastedCells(text: string): string | null {
  if (!text.includes('\t')) return null
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 1) return null
  return lines.map(l => rowToLine(l.split('\t'))).filter(Boolean).join('\n')
}

// Turn a spreadsheet row into a single task line: prefer the first non-empty
// cell, but append a short second cell (e.g. owner/notes) when present.
function rowToLine(row: any[]): string {
  if (!Array.isArray(row)) return String(row ?? '').trim()
  const cells = row.map(c => (c == null ? '' : String(c).trim())).filter(Boolean)
  if (!cells.length) return ''
  if (cells.length === 1) return cells[0]
  return `${cells[0]}${cells[1] ? ` — ${cells.slice(1).join(' ')}` : ''}`.trim()
}
