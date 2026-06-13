'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconMoon, IconChevronDown } from '@tabler/icons-react'

interface JournalEntry { date:string; well:string; improve:string; completed:number; total:number; focused:number; messages:number }
const JOURNAL_KEY = 'kornelia-daily-journal'
function loadJournal(): JournalEntry[] { if (typeof window==='undefined') return []; try { return JSON.parse(localStorage.getItem(JOURNAL_KEY)||'[]') } catch { return [] } }
function saveJournal(entries: JournalEntry[]) { if (typeof window!=='undefined') localStorage.setItem(JOURNAL_KEY,JSON.stringify(entries)) }

interface Props { onClose:()=>void; tasksCompleted:number; tasksTotal:number; focusedMin?:number; messagesAnswered?:number; onCleanup:()=>void }

export function DailyShutdown({ onClose, tasksCompleted, tasksTotal, focusedMin=0, messagesAnswered=0, onCleanup }: Props) {
  const [well,setWell]=useState(''); const [improve,setImprove]=useState('')
  const [journal,setJournal]=useState<JournalEntry[]>([]); const [showHistory,setShowHistory]=useState(false)
  const carryForward = tasksTotal - tasksCompleted

  useEffect(()=>{setJournal(loadJournal())}, [])

  const closeDay = () => {
    const now=new Date(); const dateStr=now.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})
    const entry:JournalEntry = {date:dateStr,well:well.trim(),improve:improve.trim(),completed:tasksCompleted,total:tasksTotal,focused:focusedMin,messages:messagesAnswered}
    const updated=[entry,...journal].slice(0,90); saveJournal(updated); setJournal(updated); onCleanup(); onClose()
  }
  const fmtMin = (m:number) => { const total=Math.round((m||0)*60); if(total<60) return `${total}s`; const h=Math.floor(total/3600); const mm=Math.round((total%3600)/60); return h>0?(mm>0?`${h}h ${mm}m`:`${h}h`):`${mm}m` }

  return createPortal(<>
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} />
    <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10001,width:440,maxHeight:'85vh',overflowY:'auto',background:'#0f1623',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,boxShadow:'0 16px 48px rgba(0,0,0,0.5)'}}>
      <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><IconMoon size={20} color="#818cf8" /><h2 style={{fontSize:20,fontWeight:700,color:'#fff',margin:0}}>Daily Shutdown</h2></div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4}}><IconX size={20} color="#64748b" /></button>
      </div>
      <div style={{padding:'20px 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:8,marginBottom:12}}>
          <SB value={tasksCompleted} label="Tasks done" color="#818cf8" />
          <SB value={carryForward} label="Carry fwd" color="#fbbf24" />
          <SB value={tasksTotal} label="Total" color="#2dd4bf" />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:8,marginBottom:20}}>
          <SB value={fmtMin(focusedMin)} label="Focused" color="#fb7185" small />
          <SB value={messagesAnswered} label="Msgs done" color="#a78bfa" />
          <SB value={`${tasksTotal>0?Math.round(tasksCompleted/tasksTotal*100):0}%`} label="Completion" color="#34d399" small />
        </div>
        <div style={{marginBottom:14}}><div style={{fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:600,marginBottom:6}}>What went well?</div><input value={well} onChange={e=>setWell(e.target.value)} placeholder="One thing that worked..." style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'8px 12px',fontSize:14,color:'#e2e8f0',outline:'none'}} /></div>
        <div style={{marginBottom:18}}><div style={{fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:600,marginBottom:6}}>What to improve?</div><textarea value={improve} onChange={e=>setImprove(e.target.value)} placeholder="What would you do differently..." rows={3} style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'8px 12px',fontSize:14,color:'#e2e8f0',outline:'none',resize:'vertical',fontFamily:'inherit'}} /></div>
        <div style={{background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.15)',borderRadius:8,padding:'10px 12px',marginBottom:16,display:'flex',gap:8,alignItems:'flex-start'}}><span style={{fontSize:14}}>⚡</span><span style={{fontSize:12,color:'#fbbf24',lineHeight:1.4}}>Closing removes completed tasks from Top Prio and done messages.</span></div>
        <button onClick={closeDay} style={{width:'100%',padding:'12px 0',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.10em',background:'#6366f1',color:'#fff',border:'none',boxShadow:'0 0 16px rgba(99,102,241,0.4)'}}>Close the Day</button>
        {journal.length>0&&<div style={{marginTop:20,borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:14}}>
          <button onClick={()=>setShowHistory(!showHistory)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,color:'#64748b',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.10em',width:'100%'}}><IconChevronDown size={14} style={{transform:showHistory?'rotate(180deg)':'none',transition:'transform 0.2s'}} />Past entries ({journal.length})</button>
          {showHistory&&<div style={{marginTop:8,maxHeight:300,overflowY:'auto'}}>{journal.map((e,i)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.03)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,fontWeight:600,color:'#818cf8'}}>{e.date}</span><span style={{fontSize:10,color:'#64748b'}}>{e.completed}/{e.total} done · {e.messages} msgs · {e.focused?fmtMin(e.focused):'0m'}</span></div>{e.well&&<div style={{fontSize:12,color:'#94a3b8',marginBottom:2}}>✅ {e.well}</div>}{e.improve&&<div style={{fontSize:12,color:'#94a3b8'}}>💡 {e.improve}</div>}{!e.well&&!e.improve&&<div style={{fontSize:11,color:'#475569',fontStyle:'italic'}}>No notes</div>}</div>)}</div>}
        </div>}
      </div>
    </div>
  </>, document.body)
}

function SB({value,label,color,small}:{value:string|number;label:string;color:string;small?:boolean}) {
  return <div style={{textAlign:'center',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'8px 6px'}}><div style={{fontSize:small?16:28,fontWeight:700,color,fontVariantNumeric:'tabular-nums'}}>{value}</div><div style={{fontSize:8,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:600}}>{label}</div></div>
}
