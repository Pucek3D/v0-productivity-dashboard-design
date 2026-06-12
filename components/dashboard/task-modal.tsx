'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconCalendar, IconUser, IconClock, IconFlag, IconLink, IconPlus, IconTrash, IconPlayerPlay, IconPlayerStop, IconStar } from '@tabler/icons-react'
import { type TaskMeta, getDateLabel } from '@/lib/task-meta'

interface TaskModalProps {
  taskKey: string; taskLabel: string; meta: TaskMeta
  onUpdate: (u: Partial<TaskMeta>) => void; onClose: () => void
  onStartFocus?: (k: string, l: string) => void
  starSubtaskToPrio?: (text: string) => void
}
const PRIOS = [{ value:'high',label:'High',color:'#fb7185' },{ value:'medium',label:'Medium',color:'#fbbf24' },{ value:'low',label:'Low',color:'#64748b' }]
const TIMES = [15,30,45,60,90,120,180,240]

export function TaskModal({ taskKey, taskLabel, meta, onUpdate, onClose, onStartFocus, starSubtaskToPrio }: TaskModalProps) {
  const [desc, setDesc] = useState(meta.description || '')
  const [newLink, setNewLink] = useState('')
  const [newSub, setNewSub] = useState('')

  /* ── Built-in focus timer ── */
  const [focusing, setFocusing] = useState(false)
  const [focusSeconds, setFocusSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startBuiltInFocus = () => {
    setFocusing(true); setFocusSeconds(0)
    intervalRef.current = setInterval(() => setFocusSeconds(s => s + 1), 1000)
  }
  const stopBuiltInFocus = () => {
    setFocusing(false)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    const mins = Math.max(1, Math.round(focusSeconds / 60))
    const now = new Date()
    const dateStr = `${now.getDate()}/${now.getMonth()+1} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    const sessions = [...((meta as any).focusSessions || []), { date: dateStr, minutes: mins }]
    onUpdate({ focusSessions: sessions } as any)
    setFocusSeconds(0)
  }
  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current) } }, [])

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !focusing) onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [onClose, focusing])

  const saveDesc = () => { if (desc !== (meta.description || '')) onUpdate({ description: desc || undefined }) }
  const addLink = () => { if (!newLink.trim()) return; onUpdate({ links: [...(meta.links||[]), newLink.trim()] }); setNewLink('') }
  const removeLink = (i: number) => { const u = [...(meta.links||[])]; u.splice(i,1); onUpdate({ links: u.length ? u : undefined }) }
  const addSub = () => { if (!newSub.trim()) return; onUpdate({ subtasks: [...(meta.subtasks||[]), { id:`st-${Date.now()}`,text:newSub.trim(),done:false }] }); setNewSub('') }
  const toggleSub = (id: string) => { onUpdate({ subtasks: (meta.subtasks||[]).map(s => s.id===id ? {...s,done:!s.done} : s) }) }
  const removeSub = (id: string) => { const u = (meta.subtasks||[]).filter(s => s.id!==id); onUpdate({ subtasks: u.length ? u : undefined }) }
  const updateSubOwner = (id: string, owner: string) => { onUpdate({ subtasks: (meta.subtasks||[]).map(s => s.id===id ? {...s,owner:owner||undefined} : s) }) }
  const updateSubDeadline = (id: string, deadline: string) => { onUpdate({ subtasks: (meta.subtasks||[]).map(s => s.id===id ? {...s,deadline:deadline||undefined} : s) }) }

  const dateInfo = meta.deadline ? getDateLabel(meta.deadline) : null
  const sDone = (meta.subtasks||[]).filter(s => s.done).length; const sTotal = (meta.subtasks||[]).length
  const focusSessions: { date: string; minutes: number }[] = (meta as any).focusSessions || []
  const totalFocusMin = focusSessions.reduce((sum, s) => sum + s.minutes, 0)
  const fmtTimer = (sec: number) => { const m = Math.floor(sec/60); const s = sec%60; return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` }

  const S: React.CSSProperties = { fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.10em',fontWeight:600,marginBottom:6,display:'flex',alignItems:'center',gap:5 }

  return createPortal(<>
    <div onClick={() => { if (!focusing) onClose() }} style={{ position:'fixed',inset:0,zIndex:10000,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)' }} />
    <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10001,width:540,maxHeight:'85vh',overflowY:'auto',background:'#0f1623',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,boxShadow:'0 16px 48px rgba(0,0,0,0.5)' }}>
      <div style={{ padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between' }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:600,marginBottom:6 }}>{taskKey}</div>
          <h2 style={{ fontSize:22,fontWeight:700,color:'#fff',margin:0,lineHeight:1.3 }}>{taskLabel}</h2>

          {/* Focus button — built-in */}
          <div style={{ marginTop:10,display:'flex',alignItems:'center',gap:10 }}>
            {!focusing ? (
              <button onClick={startBuiltInFocus} style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(244,63,94,0.12)',border:'1px solid rgba(244,63,94,0.25)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12,fontWeight:600,color:'#fb7185',textTransform:'uppercase',letterSpacing:'0.06em' }}>
                <IconPlayerPlay size={14} /> Start Focus
              </button>
            ) : (
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:24,fontWeight:700,color:'#fb7185',fontVariantNumeric:'tabular-nums',fontFamily:'var(--font-geist-mono, monospace)' }}>{fmtTimer(focusSeconds)}</span>
                <button onClick={stopBuiltInFocus} style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(244,63,94,0.25)',border:'1px solid rgba(244,63,94,0.4)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12,fontWeight:600,color:'#fff',textTransform:'uppercase',letterSpacing:'0.06em' }}>
                  <IconPlayerStop size={14} /> Stop
                </button>
              </div>
            )}
          </div>

          {/* Focus log */}
          {totalFocusMin > 0 && (
            <div style={{ marginTop:10,padding:'8px 10px',background:'rgba(244,63,94,0.08)',borderRadius:8,border:'1px solid rgba(244,63,94,0.15)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:focusSessions.length>0?6:0 }}>
                <IconClock size={14} color="#fb7185" />
                <span style={{ fontSize:15,fontWeight:700,color:'#fb7185' }}>{totalFocusMin >= 60 ? `${Math.floor(totalFocusMin/60)}h ${totalFocusMin%60}m` : `${totalFocusMin}m`}</span>
                <span style={{ fontSize:11,color:'#64748b' }}>total focused</span>
              </div>
              {focusSessions.length > 0 && <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:4 }}>
                {focusSessions.slice(-8).map((s,i) => <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'2px 0',fontSize:10 }}><span style={{ color:'#94a3b8' }}>{s.date}</span><span style={{ fontWeight:700,color:'#fb7185',fontVariantNumeric:'tabular-nums' }}>{s.minutes}m</span></div>)}
              </div>}
            </div>
          )}
        </div>
        <button onClick={() => { if (!focusing) onClose() }} style={{ background:'none',border:'none',cursor:'pointer',padding:4,flexShrink:0,alignSelf:'flex-start' }}><IconX size={20} color="#64748b" /></button>
      </div>

      <div style={{ padding:'20px 24px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24 }}>
          <div><div style={S}><IconCalendar size={16} color="#64748b" /> Deadline</div><input type="date" value={meta.deadline||''} onChange={e => onUpdate({ deadline:e.target.value||undefined,label:taskLabel })} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'6px 10px',fontSize:13,color:'#e2e8f0',outline:'none',colorScheme:'dark',width:'100%' }} />{dateInfo && <span style={{ fontSize:11,fontWeight:700,display:'inline-block',marginTop:4 }} className={`px-2 py-0.5 rounded ${dateInfo.className}`}>{dateInfo.text}</span>}</div>
          <div><div style={S}><IconUser size={16} color="#64748b" /> Owner</div><input value={meta.owner||''} onChange={e => onUpdate({ owner:e.target.value||undefined })} placeholder="Assign owner..." style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'6px 10px',fontSize:13,color:'#e2e8f0',outline:'none',width:'100%' }} /></div>
          <div><div style={S}><IconFlag size={16} color="#64748b" /> Priority</div><div style={{ display:'flex',gap:5 }}>{PRIOS.map(p => <button key={p.value} onClick={() => onUpdate({ priority:meta.priority===p.value?undefined:p.value as any })} style={{ padding:'4px 10px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600,border:'none',textTransform:'uppercase',letterSpacing:'0.06em',background:meta.priority===p.value?`${p.color}22`:'rgba(255,255,255,0.04)',color:meta.priority===p.value?p.color:'#475569',boxShadow:meta.priority===p.value?`inset 0 0 0 1px ${p.color}44`:'none' }}>{p.label}</button>)}</div></div>
          <div><div style={S}><IconClock size={16} color="#64748b" /> Estimate</div><div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>{TIMES.map(t => <button key={t} onClick={() => onUpdate({ timeEstimate:meta.timeEstimate===t?undefined:t })} style={{ padding:'3px 8px',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:500,border:'none',fontVariantNumeric:'tabular-nums',background:meta.timeEstimate===t?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.04)',color:meta.timeEstimate===t?'#818cf8':'#475569',boxShadow:meta.timeEstimate===t?'inset 0 0 0 1px rgba(99,102,241,0.3)':'none' }}>{t>=60?`${t/60}h`:`${t}m`}</button>)}</div></div>
        </div>

        <Sec label="🔄 Recurring"><div style={{ display:'flex',gap:5 }}>{(['daily','weekly','monthly'] as const).map(f => <button key={f} onClick={() => onUpdate({ recurring:meta.recurring===f?null:f })} style={{ padding:'4px 10px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600,border:'none',textTransform:'uppercase',letterSpacing:'0.06em',background:meta.recurring===f?'rgba(45,212,191,0.15)':'rgba(255,255,255,0.04)',color:meta.recurring===f?'#2dd4bf':'#475569',boxShadow:meta.recurring===f?'inset 0 0 0 1px rgba(45,212,191,0.3)':'none' }}>{f}</button>)}</div></Sec>

        {/* Schedule — week picker for LT goals */}
        <Sec label="📅 Schedule (weeks)">
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => {
              const sched = (meta as any).schedule || {}
              onUpdate({ schedule: { ...sched, ongoing: !sched.ongoing } } as any)
            }} style={{
              padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: 'none',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: (meta as any).schedule?.ongoing ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
              color: (meta as any).schedule?.ongoing ? '#34d399' : '#475569',
              boxShadow: (meta as any).schedule?.ongoing ? 'inset 0 0 0 1px rgba(52,211,153,0.3)' : 'none',
            }}>Ongoing</button>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Click weeks to toggle:</div>
          <WeekGrid
            selectedWeeks={(meta as any).schedule?.weeks || []}
            onChange={(weeks: number[]) => {
              const sched = (meta as any).schedule || {}
              onUpdate({ schedule: { ...sched, weeks } } as any)
            }}
          />
        </Sec>
        <Sec label="Notes"><textarea value={desc} onChange={e => setDesc(e.target.value)} onBlur={saveDesc} placeholder="Add notes..." rows={3} style={{ width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 12px',fontSize:14,color:'#e2e8f0',resize:'vertical',outline:'none',lineHeight:1.5,fontFamily:'inherit' }} /></Sec>

        <Sec label={`Checklist${sTotal>0?` (${sDone}/${sTotal})`:''}`}>
          {sTotal>0 && <div style={{ height:4,background:'rgba(255,255,255,0.05)',borderRadius:2,marginBottom:10,overflow:'hidden' }}><div style={{ height:'100%',width:`${(sDone/sTotal)*100}%`,background:'#6366f1',borderRadius:2,transition:'width 0.3s' }} /></div>}
          {(meta.subtasks||[]).map(st => {
            const dl = (st as any).deadline; const dlInfo = dl ? getDateLabel(dl) : null
            return <div key={st.id} style={{ padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <button onClick={() => toggleSub(st.id)} style={{ width:18,height:18,borderRadius:4,border:'none',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:st.done?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.05)',boxShadow:st.done?'none':'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>{st.done && <span style={{ color:'#a5b4fc',fontSize:11,fontWeight:700 }}>✓</span>}</button>
                <span style={{ fontSize:14,color:st.done?'#475569':'#e2e8f0',textDecoration:st.done?'line-through':'none',flex:1 }}>{st.text}</span>
                {starSubtaskToPrio && <button onClick={() => starSubtaskToPrio(st.text)} style={{ background:'none',border:'none',cursor:'pointer',padding:2 }} title="Add to prio"><IconStar size={13} className="text-slate-500 hover:text-amber-400" /></button>}
                <button onClick={() => removeSub(st.id)} style={{ background:'none',border:'none',cursor:'pointer',padding:2,opacity:0.4 }}><IconTrash size={14} color="#64748b" /></button>
              </div>
              <div style={{ display:'flex',gap:6,marginLeft:26,marginTop:4,flexWrap:'wrap',alignItems:'center' }}>
                <input value={(st as any).owner||''} onChange={e => updateSubOwner(st.id,e.target.value)} placeholder="Owner" style={{ width:90,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:5,padding:'2px 6px',fontSize:10,color:'#94a3b8',outline:'none' }} />
                <input type="date" value={dl||''} onChange={e => updateSubDeadline(st.id,e.target.value)} style={{ width:120,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:5,padding:'2px 6px',fontSize:10,color:'#94a3b8',outline:'none',colorScheme:'dark' }} />
                {dlInfo && <span style={{ fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3 }} className={dlInfo.className}>{dlInfo.text}</span>}
              </div>
            </div>
          })}
          <div style={{ display:'flex',gap:8,marginTop:8 }}><input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => { if (e.key==='Enter') addSub() }} placeholder="Add subtask..." style={{ flex:1,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'6px 10px',fontSize:13,color:'#fff',outline:'none' }} /><button onClick={addSub} style={{ background:'rgba(99,102,241,0.15)',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer' }}><IconPlus size={14} color="#818cf8" /></button></div>
        </Sec>

        <Sec label="Links">
          {(meta.links||[]).map((link,i) => <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0' }}><IconLink size={14} color="#64748b" /><a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize:13,color:'#818cf8',textDecoration:'none',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{link}</a><button onClick={() => removeLink(i)} style={{ background:'none',border:'none',cursor:'pointer',padding:2,opacity:0.4 }}><IconTrash size={14} color="#64748b" /></button></div>)}
          <div style={{ display:'flex',gap:8,marginTop:6 }}><input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => { if (e.key==='Enter') addLink() }} placeholder="Paste URL..." style={{ flex:1,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'6px 10px',fontSize:13,color:'#fff',outline:'none' }} /><button onClick={addLink} style={{ background:'rgba(99,102,241,0.15)',border:'none',borderRadius:8,padding:'6px 10px',cursor:'pointer' }}><IconPlus size={14} color="#818cf8" /></button></div>
        </Sec>
      </div>
    </div>
  </>, document.body)
}

function Sec({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom:22 }}><div style={{ fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:600,marginBottom:10 }}>{label}</div>{children}</div>
}

function WeekGrid({ selectedWeeks, onChange }: { selectedWeeks: number[]; onChange: (w: number[]) => void }) {
  const now = new Date()
  const currentWeek = Math.ceil((Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const toggle = (w: number) => {
    if (selectedWeeks.includes(w)) onChange(selectedWeeks.filter(x => x !== w))
    else onChange([...selectedWeeks, w].sort((a, b) => a - b))
  }

  // Select range by shift-clicking
  const selectRange = (start: number, end: number) => {
    const [lo, hi] = [Math.min(start, end), Math.max(start, end)]
    const range = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
    const allSelected = range.every(w => selectedWeeks.includes(w))
    if (allSelected) onChange(selectedWeeks.filter(w => w < lo || w > hi))
    else onChange([...new Set([...selectedWeeks, ...range])].sort((a, b) => a - b))
  }

  return (
    <div>
      {/* Month labels */}
      <div style={{ display: 'flex', gap: 1, marginBottom: 2 }}>
        {months.map((m, i) => (
          <div key={m} style={{ width: `${100/12}%`, textAlign: 'center', fontSize: 8, color: '#475569', fontWeight: 600 }}>{m}</div>
        ))}
      </div>
      {/* Week grid — 52 weeks */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Array.from({ length: 52 }, (_, i) => {
          const w = i + 1
          const isSelected = selectedWeeks.includes(w)
          const isCurrent = w === currentWeek
          return (
            <button key={w} onClick={() => toggle(w)}
              title={`Week ${w}`}
              style={{
                width: 14, height: 14, borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: 7, fontWeight: 600,
                background: isSelected ? '#818cf8' : isCurrent ? 'rgba(251,113,133,0.2)' : 'rgba(255,255,255,0.04)',
                color: isSelected ? '#fff' : isCurrent ? '#fb7185' : '#475569',
                boxShadow: isSelected ? '0 0 4px rgba(99,102,241,0.4)' : 'none',
              }}>{w}</button>
          )
        })}
      </div>
      {selectedWeeks.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
          Selected: W{selectedWeeks[0]}{selectedWeeks.length > 1 ? `–W${selectedWeeks[selectedWeeks.length - 1]}` : ''} ({selectedWeeks.length} weeks)
        </div>
      )}
    </div>
  )
}
