'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { TopPrioCard } from '@/components/dashboard/top-prio-card'
import { MessagesCard } from '@/components/dashboard/messages-card'
import { KpisCard } from '@/components/dashboard/kpis-card'
import { EventCalendar } from '@/components/dashboard/event-calendar'
import { LtGoalsCalendar } from '@/components/dashboard/lt-goals-calendar'
import { ProgressOverview } from '@/components/dashboard/progress-overview'
import { ActiveProjectsCard } from '@/components/dashboard/active-projects-card'
import { OtherTodoCard } from '@/components/dashboard/other-todo-card'
import { LtGoalsCard } from '@/components/dashboard/lt-goals-card'
import { TaskModal } from '@/components/dashboard/task-modal'
import { FocusTimer } from '@/components/dashboard/focus-timer'
import { DailyShutdown } from '@/components/dashboard/daily-shutdown'
import { WeeklyAnalytics } from '@/components/dashboard/weekly-analytics'
import { ProjectGantt } from '@/components/dashboard/project-gantt'
import { PROJECTS, LT_GOALS, TOP_PRIO_TASKS, Project } from '@/lib/data'
import type { TaskMeta, DeadlineEvent } from '@/lib/task-meta'
import { loadTaskMeta, saveTaskMeta, loadProjectDone, saveProjectDone } from '@/lib/task-meta'
import { IconMoon, IconChartBar } from '@tabler/icons-react'

export default function Dashboard() {
  const [headerDate, setHeaderDate] = useState({ weekday:'Tuesday',day:26,month:'May',year:2026 })
  useEffect(() => { const n = new Date(); setHeaderDate({ weekday:n.toLocaleDateString('en-US',{weekday:'long'}),day:n.getDate(),month:n.toLocaleDateString('en-US',{month:'long'}),year:n.getFullYear() }) }, [])

  const [projectDone, setProjectDone] = useState<Record<string,boolean>>(() => { const init: Record<string,boolean> = {}; [...PROJECTS,...LT_GOALS].forEach(p => { p.doneTasks.forEach((_,i) => { init[`${p.key}-done-${i}`] = true }) }); return init })
  useEffect(() => { const s = loadProjectDone(); if (s) setProjectDone(s) }, [])
  useEffect(() => { saveProjectDone(projectDone) }, [projectDone])

  const [taskMeta, setTaskMeta] = useState<Record<string,TaskMeta>>({})
  useEffect(() => { setTaskMeta(loadTaskMeta()) }, [])
  useEffect(() => { saveTaskMeta(taskMeta) }, [taskMeta])
  const updateTaskMeta = useCallback((k:string, u:Partial<TaskMeta>) => { setTaskMeta(p => ({...p,[k]:{...p[k],...u}})) }, [])

  const [prioTasks, setPrioTasks] = useState(() => {
    const imp = TOP_PRIO_TASKS; const w = imp.find(s=>s.section==='Work'); const h = imp.find(s=>s.section==='Home'); const o = imp.find(s=>s.section==='Other')
    return [ w||{section:'Work',color:'#818cf8',tasks:[]}, h||{section:'Home',color:'#2dd4bf',tasks:[]}, {section:'Other Work',color:'#818cf8',tasks:o?.tasks||[]}, {section:'Other Home',color:'#2dd4bf',tasks:[]} ]
  })

  const [hiddenTasks, setHiddenTasks] = useState<Set<string>>(new Set())
  const [modalTask, setModalTask] = useState<{key:string;label:string}|null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showShutdown, setShowShutdown] = useState(false)
  const [showPlanned, setShowPlanned] = useState(false)
  const [showMeetings, setShowMeetings] = useState(false)
  const [focusTask, setFocusTask] = useState<{key:string;label:string}|null>(null)
  const [ganttProject, setGanttProject] = useState<string|null>(null)

  const openModal = useCallback((k:string,l:string) => setModalTask({key:k,label:l}), [])
  const hideTask = useCallback((k:string) => { setHiddenTasks(p => new Set([...p,k])) }, [])

  const getProjectCompletion = useCallback((project:Project) => { const total = project.tasks.length + project.doneTasks.length; if (!total) return 0; let done = 0; project.tasks.forEach((_,i) => { if (projectDone[`${project.key}-task-${i}`]) done++ }); project.doneTasks.forEach((_,i) => { if (projectDone[`${project.key}-done-${i}`] !== false) done++ }); return Math.round((done/total)*100) }, [projectDone])

  const toggleProjectTask = useCallback((pk:string, tt:'task'|'done', idx:number) => {
    const key = tt==='done'?`${pk}-done-${idx}`:`${pk}-task-${idx}`
    setProjectDone(prev => { const nd = !prev[key]; if (tt==='task') { const proj = [...PROJECTS,...LT_GOALS].find(p=>p.key===pk); if (proj?.tasks[idx]) { const txt = proj.tasks[idx]; setPrioTasks(pt=>pt.map(s=>({...s,tasks:s.tasks.map(t=>t.text===txt?{...t,done:nd}:t)}))) } }; return {...prev,[key]:nd} })
  }, [])

  const onPrioTaskToggle = useCallback((text:string, done:boolean) => { [...PROJECTS,...LT_GOALS].forEach(p => { p.tasks.forEach((t,i) => { if (t===text) setProjectDone(prev => ({...prev,[`${p.key}-task-${i}`]:done})) }) }) }, [])

  const addPrioTask = useCallback((text:string) => { setPrioTasks(prev => { const n=[...prev]; const idx=n.findIndex(s=>s.section==='Other Work'); if (idx>=0) { const s={...n[idx]}; s.tasks=[...s.tasks,{id:`q${Date.now()}`,text,done:false}]; n[idx]=s }; return n }) }, [])

  const starToPrio = useCallback((text:string, category:'work'|'home') => {
    setPrioTasks(prev => { const n=prev.map(s=>({...s,tasks:[...s.tasks]})); const sn=category==='home'?'Home':'Work'; const idx=n.findIndex(s=>s.section===sn); if (idx<0) return prev; const ex=n[idx].tasks.findIndex(t=>t.text===text); if (ex>=0) n[idx].tasks.splice(ex,1); else n[idx].tasks.push({id:`s${Date.now()}`,text,done:false}); return n })
  }, [])
  const starSubtaskToPrio = useCallback((text:string) => starToPrio(text,'work'), [starToPrio])
  const isTaskStarred = useCallback((text:string) => prioTasks.some(s=>s.tasks.some(t=>t.text===text)), [prioTasks])

  const startFocus = useCallback((k:string,l:string) => setFocusTask({key:k,label:l}), [])
  const stopFocus = useCallback((k:string, mins:number) => {
    if (mins<=0) return; const now=new Date(); const ds=`${now.getDate()}/${now.getMonth()+1} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    setTaskMeta(p => { const ex=p[k]||{}; const sess=[...((ex as any).focusSessions||[]),{date:ds,minutes:mins}]; return {...p,[k]:{...ex,focusSessions:sess} as any} })
  }, [])

  const dailyCleanup = useCallback(() => { setPrioTasks(prev => prev.map(s => ({...s,tasks:s.tasks.filter(t=>!t.done)}))) }, [])

  const deadlineEvents: DeadlineEvent[] = useMemo(() => {
    const ev: DeadlineEvent[] = []
    Object.entries(taskMeta).filter(([,m]) => m.deadline).forEach(([,m]) => { ev.push({date:m.deadline!,label:m.label||'Task',color:'#818cf8',hour:m.hour,minute:m.minute}) })
    Object.entries(taskMeta).forEach(([,m]) => { (m.subtasks||[]).forEach(st => { if ((st as any).deadline) ev.push({date:(st as any).deadline,label:st.text,color:'#a78bfa'}) }) })
    return ev
  }, [taskMeta])

  const completedTasks = useMemo(() => { const set=new Set<string>(); prioTasks.forEach(s=>s.tasks.forEach(t=>{if(t.done)set.add(t.text)})); [...PROJECTS,...LT_GOALS].forEach(p=>{p.tasks.forEach((t,i)=>{if(projectDone[`${p.key}-task-${i}`])set.add(t)})}); return set }, [prioTasks,projectDone])

  // Find the Gantt project object
  const ganttProjectObj = ganttProject ? [...PROJECTS,...LT_GOALS].find(p => p.key === ganttProject) : null

  const timeStats = useMemo(() => {
    let plannedMin=0,totalTodayTasks=0,doneTodayTasks=0,meetingMin=0; const plannedTasks:{label:string;time:number}[]=[],meetingEvents:{label:string;time:string}[]=[]; const todayStr=new Date().toISOString().slice(0,10)
    prioTasks.forEach(s=>s.tasks.forEach(t=>{totalTodayTasks++;if(t.done)doneTodayTasks++;const m=taskMeta[`prio-${t.id}`];if(m?.timeEstimate){plannedMin+=m.timeEstimate;plannedTasks.push({label:t.text,time:m.timeEstimate})}}))
    Object.entries(taskMeta).forEach(([k,m])=>{if(m.deadline===todayStr&&!k.startsWith('prio-')){if(m.timeEstimate){plannedMin+=m.timeEstimate;plannedTasks.push({label:m.label||k,time:m.timeEstimate})};if(m.hour!==undefined){meetingMin+=60;meetingEvents.push({label:m.label||k,time:`${m.hour.toString().padStart(2,'0')}:${(m.minute??0).toString().padStart(2,'0')}`})}}})
    let focusedMin=0; const td=new Date(); const tp=`${td.getDate()}/${td.getMonth()+1}`
    Object.values(taskMeta).forEach(m=>{const sess:(any[])=(m as any).focusSessions||[];sess.forEach((s:any)=>{if(s.date?.startsWith(tp))focusedMin+=s.minutes})})
    return {plannedMin,meetingMin,overloaded:plannedMin>480,totalTodayTasks,doneTodayTasks,plannedTasks,meetingEvents,focusedMin}
  }, [taskMeta,prioTasks])

  const fmtTime = (m:number) => { const h=Math.floor(m/60); const mm=m%60; return mm>0?`${h}h ${mm}m`:`${h}h` }

  return (
    <div className="min-h-screen bg-background p-5 font-sans">
      {(showPlanned||showMeetings)&&<div style={{position:'fixed',inset:0,zIndex:99}} onClick={()=>{setShowPlanned(false);setShowMeetings(false)}} />}
      <FocusTimer task={focusTask} onStop={stopFocus} onClear={()=>setFocusTask(null)} />

      <header className="mb-6 pb-5 border-b border-white/5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h1 className="font-display text-[40px] leading-[0.95] tracking-[-0.025em] text-shadow-display"><span className="text-[#818cf8] glow-text-indigo">Kornelia&rsquo;s</span>{' '}<span className="text-white">op system</span></h1>
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-slate-500 font-medium mt-3">{headerDate.weekday} <span className="mx-2 text-slate-600">·</span> {headerDate.day} {headerDate.month} {headerDate.year}</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:16,padding:'6px 14px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10}}>
              <div style={{position:'relative'}}><div onClick={()=>{setShowPlanned(!showPlanned);setShowMeetings(false)}} style={{cursor:'pointer',textAlign:'center'}}><div style={{fontSize:14,fontWeight:700,color:timeStats.overloaded?'#fb7185':'#818cf8',fontVariantNumeric:'tabular-nums'}}>{fmtTime(timeStats.plannedMin)}</div><div style={{fontSize:8,color:'#475569',textTransform:'uppercase',letterSpacing:'0.10em',fontWeight:600}}>Planned</div></div>{showPlanned&&<div style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',marginTop:8,width:240,background:'#131c2e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:10,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',zIndex:100}}><div style={{fontSize:9,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.10em',fontWeight:600,marginBottom:6}}>Planned ({timeStats.plannedTasks.length})</div>{timeStats.plannedTasks.length===0&&<div style={{fontSize:11,color:'#334155',padding:'4px 0'}}>No estimates set</div>}{timeStats.plannedTasks.map((t,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:i<timeStats.plannedTasks.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}><span style={{fontSize:11,color:'#e2e8f0',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:8}}>{t.label}</span><span style={{fontSize:10,fontWeight:700,color:'#818cf8',flexShrink:0}}>{t.time>=60?`${t.time/60}h`:`${t.time}m`}</span></div>)}</div>}</div>
              <div style={{width:1,height:20,background:'rgba(255,255,255,0.06)'}} />
              <div style={{position:'relative'}}><div onClick={()=>{setShowMeetings(!showMeetings);setShowPlanned(false)}} style={{cursor:'pointer',textAlign:'center'}}><div style={{fontSize:14,fontWeight:700,color:'#fbbf24',fontVariantNumeric:'tabular-nums'}}>{fmtTime(timeStats.meetingMin)}</div><div style={{fontSize:8,color:'#475569',textTransform:'uppercase',letterSpacing:'0.10em',fontWeight:600}}>Meetings</div></div>{showMeetings&&<div style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',marginTop:8,width:240,background:'#131c2e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:10,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',zIndex:100}}><div style={{fontSize:9,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.10em',fontWeight:600,marginBottom:6}}>Events ({timeStats.meetingEvents.length})</div>{timeStats.meetingEvents.length===0&&<div style={{fontSize:11,color:'#334155',padding:'4px 0'}}>No events</div>}{timeStats.meetingEvents.map((t,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:i<timeStats.meetingEvents.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}><span style={{fontSize:11,color:'#e2e8f0',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:8}}>{t.label}</span><span style={{fontSize:10,fontWeight:600,color:'#fbbf24',flexShrink:0}}>{t.time}</span></div>)}</div>}</div>
              <div style={{width:1,height:20,background:'rgba(255,255,255,0.06)'}} />
              <div style={{textAlign:'center'}}><div style={{fontSize:14,fontWeight:700,color:'#fb7185',fontVariantNumeric:'tabular-nums'}}>{fmtTime(timeStats.focusedMin)}</div><div style={{fontSize:8,color:'#475569',textTransform:'uppercase',letterSpacing:'0.10em',fontWeight:600}}>Focused</div></div>
              {timeStats.overloaded&&<><div style={{width:1,height:20,background:'rgba(255,255,255,0.06)'}} /><span style={{fontSize:8,fontWeight:700,color:'#fb7185',background:'rgba(244,63,94,0.15)',padding:'2px 6px',borderRadius:4,textTransform:'uppercase'}}>Overloaded</span></>}
            </div>
            <button onClick={()=>setShowAnalytics(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(45,212,191,0.10)',border:'1px solid rgba(45,212,191,0.20)',borderRadius:10,cursor:'pointer',color:'#2dd4bf',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}><IconChartBar size={14} /> Weekly Review</button>
            <button onClick={()=>setShowShutdown(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(99,102,241,0.10)',border:'1px solid rgba(99,102,241,0.20)',borderRadius:10,cursor:'pointer',color:'#818cf8',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}><IconMoon size={14} /> End of day</button>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'6px 12px'}}><span style={{color:'#64748b',fontSize:14}}>+</span><input placeholder="Add task to Top Prio — press Enter" onKeyDown={e=>{if(e.key==='Enter'&&(e.target as HTMLInputElement).value.trim()){addPrioTask((e.target as HTMLInputElement).value.trim());(e.target as HTMLInputElement).value=''}}} style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:'#e2e8f0',fontFamily:'inherit'}} /></div>
      </header>

      <div className="grid grid-cols-[196px_minmax(0,0.85fr)_minmax(0,1fr)] gap-3 items-start">
        <div className="flex flex-col gap-3"><MessagesCard /><KpisCard /></div>
        <div className="flex flex-col gap-3">
          <TopPrioCard tasks={prioTasks} setTasks={setPrioTasks} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} onTaskToggle={onPrioTaskToggle} />
          <EventCalendar deadlineEvents={deadlineEvents} completedTasks={completedTasks} />
          <ProgressOverview projectDone={projectDone} getProjectCompletion={getProjectCompletion} />
          {/* Gantt chart — appears when toggled from Active Projects */}
          {ganttProjectObj && <ProjectGantt project={ganttProjectObj} projectDone={projectDone} taskMeta={taskMeta} onClose={() => setGanttProject(null)} />}
          <LtGoalsCalendar />
          <LtGoalsCard projectDone={projectDone} toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} hideTask={hideTask} hiddenTasks={hiddenTasks} />
        </div>
        <div className="flex flex-col gap-3">
          <ActiveProjectsCard projectDone={projectDone} toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} hideTask={hideTask} hiddenTasks={hiddenTasks} onToggleGantt={setGanttProject} activeGanttProject={ganttProject} />
          <OtherTodoCard taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} />
        </div>
      </div>

      {modalTask&&<TaskModal taskKey={modalTask.key} taskLabel={modalTask.label} meta={taskMeta[modalTask.key]||{}} onUpdate={u=>updateTaskMeta(modalTask.key,u)} onClose={()=>setModalTask(null)} onStartFocus={startFocus} starSubtaskToPrio={starSubtaskToPrio} />}
      {showShutdown&&<DailyShutdown onClose={()=>setShowShutdown(false)} tasksCompleted={timeStats.doneTodayTasks} tasksTotal={timeStats.totalTodayTasks} focusedMin={timeStats.focusedMin} onCleanup={dailyCleanup} />}
      {showAnalytics&&<WeeklyAnalytics onClose={()=>setShowAnalytics(false)} projectDone={projectDone} taskMeta={taskMeta} getProjectCompletion={getProjectCompletion} />}
    </div>
  )
}
