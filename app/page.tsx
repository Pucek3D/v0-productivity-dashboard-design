'use client'
import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { TopPrioCard } from '@/components/dashboard/top-prio-card'
import { MessagesCard } from '@/components/dashboard/messages-card'

type Message = { id: string; text: string; done: boolean; category?: 'work' | 'home' }
const INITIAL_MESSAGES: Message[] = [
  { id:'m1',text:'Varun — respond today',done:false,category:'work' },
  { id:'m2',text:'Surabhi — AI initiative (Jun 5)',done:false,category:'work' },
  { id:'m3',text:'John — meeting doc needed',done:false,category:'work' },
  { id:'m4',text:'Himadri — write meeting note',done:false,category:'work' },
  { id:'m5',text:'Prashant — act on findings',done:false,category:'work' },
  { id:'m6',text:'Anurag — skill status follow-up',done:false,category:'work' },
  { id:'m7',text:'Konrad — PPK + workshop?',done:false,category:'work' },
  { id:'m8',text:'Shratha — review case example',done:false,category:'home' },
]
// Mirror of OtherTodoCard's INITIAL_SECTIONS so label-sync can reach those
// static tasks (key format: todo-<sectionId>-<taskId>) before they're edited.
const OTHER_TODO_REGISTRY: { key: string; label: string }[] = [
  { key:'todo-sushovan-os1', label:'WEF — Food Systems (WIP)' },
  { key:'todo-sushovan-os2', label:'AACI — case summary (WIP)' },
  { key:'todo-varun-os3', label:'Draft promotion note for HR' },
  { key:'todo-varun-os4', label:'Progress tracker (new joiners)' },
  { key:'todo-konrad-os5', label:'PPK — budget for lunch + agenda' },
  { key:'todo-konrad-os6', label:'Cross-practice section prep' },
  { key:'todo-personal-os7', label:'Faisal — respond' },
  { key:'todo-personal-os8', label:'Inga — celebrate her promotion!' },
]
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
import { loadTaskMeta, saveTaskMeta, loadProjectDone, saveProjectDone, sharePerson, extractPeople } from '@/lib/task-meta'
import { IconMoon, IconChartBar } from '@tabler/icons-react'

export default function Dashboard() {
  const [headerDate, setHeaderDate] = useState({weekday:'Tuesday',day:26,month:'May',year:2026})
  useEffect(()=>{const n=new Date();setHeaderDate({weekday:n.toLocaleDateString('en-US',{weekday:'long'}),day:n.getDate(),month:n.toLocaleDateString('en-US',{month:'long'}),year:n.getFullYear()})}, [])

  const [projectDone, setProjectDone] = useState<Record<string,boolean>>(()=>{const i:Record<string,boolean>={};[...PROJECTS,...LT_GOALS].forEach(p=>{p.doneTasks.forEach((_,j)=>{i[`${p.key}-done-${j}`]=true})});return i})
  useEffect(()=>{const s=loadProjectDone();if(s)setProjectDone(s)}, [])
  useEffect(()=>{saveProjectDone(projectDone)}, [projectDone])

  const [taskMeta, setTaskMeta] = useState<Record<string,TaskMeta>>({})
  useEffect(()=>{setTaskMeta(loadTaskMeta())}, [])
  useEffect(()=>{saveTaskMeta(taskMeta)}, [taskMeta])

  // ──────────────────────────────────────────────────────────────────
  // Unified rename system
  // `nameOverrides` is the single source of truth for renamed labels of
  // tasks whose base text lives in static data (Projects / Goals / Other
  // To-Do). Every card resolves its display text as:
  //     nameOverrides[taskKey] ?? baseText
  // Renames (double-click inline OR from the modal) all flow through
  // `renameTask`, which also propagates the new name to any synced surface
  // sharing the same current label (e.g. a Top Prio copy of a project task).
  // ──────────────────────────────────────────────────────────────────
  const [nameOverrides, setNameOverrides] = useState<Record<string,string>>({})

  // Registry of Message + Top Prio task labels keyed by their meta key.
  // Kept in a ref (updated each render) so name-based sync can target
  // tasks even when they don't have a taskMeta entry yet.
  const linkRegistry = useRef<{ key: string; label: string }[]>([])

  // ──────────────────────────────────────────────────────────────────
  // FIX #1: Cross-sync taskMeta by label
  // Always syncs priority/recurring/owner/timeEstimate across all keys
  // that share the same label text.  Now also ensures `label` is stored
  // on every update so the matching can actually fire.
  //
  // NEW: also propagates owner + deadline between Messages (msg-*) and
  // Top Prio (prio-*) tasks that mention the same person, so linked
  // items stay in sync even when their wording differs.
  // ──────────────────────────────────────────────────────────────────
  const updateTaskMeta = useCallback((k:string,u:Partial<TaskMeta>)=>{
    setTaskMeta(p=>{
      const updated = {...p,[k]:{...p[k],...u}}

      // ── Subtask done propagation ──
      // When this update toggles a subtask's done state, mirror that done
      // state to every linked surface sharing the subtask's text: Top Prio,
      // Messages and any other task's subtasks. Keeps bi-directional sync.
      if (u.subtasks) {
        const prevSubs = (p[k] as any)?.subtasks || []
        ;(u.subtasks as any[]).forEach(ns => {
          const old = prevSubs.find((o:any) => o.id === ns.id)
          if (old && !!old.done !== !!ns.done) {
            const txt = ns.text; const done = !!ns.done
            setPrioTasks(pt=>pt.map(s=>({...s,tasks:s.tasks.map(t=>t.text===txt?{...t,done}:t)})))
            setMessages(ms=>ms.map(m=>m.text===txt?{...m,done}:m))
            Object.keys(updated).forEach(ok=>{
              if (ok===k) return
              const subs=(updated[ok] as any)?.subtasks
              if(Array.isArray(subs)&&subs.some((s:any)=>s.text===txt&&!!s.done!==done)){
                updated[ok]={...updated[ok],subtasks:subs.map((s:any)=>s.text===txt?{...s,done}:s)} as any
              }
            })
          }
        })
      }

      // Resolve the label — prefer what was just passed, fall back to stored,
      // then fall back to the live registry (handles owner-only edits from the
      // modal that don't pass a label for tasks with no stored meta yet).
      const label = u.label
        || (updated[k] as any)?.label
        || linkRegistry.current.find(r => r.key === k)?.label
      if (!label) return updated // no label → no sync possible

      // Ensure label is persisted on this key
      if (!updated[k].label) (updated[k] as any).label = label

      // Sync shared fields across all keys that have the SAME label text.
      // This keeps Top Prio in sync with Active Projects, Other To-Do and
      // Long-Term Goals (which share identical task text with prio tasks).
      // Uses `'field' in u` presence checks so CLEARING a value (e.g. the
      // "All day" button sending hour:undefined) also propagates.
      const SHARED_FIELDS = ['priority','recurring','owner','timeEstimate','deadline','hour','minute'] as const
      const changedShared = SHARED_FIELDS.filter(f => f in u)
      if (changedShared.length) {
        const syncFields: Partial<TaskMeta> = {}
        changedShared.forEach(f => { (syncFields as any)[f] = (u as any)[f] })
        // Existing meta entries with the same label
        Object.keys(updated).forEach(otherKey => {
          if (otherKey !== k && (updated[otherKey] as any)?.label === label) {
            updated[otherKey] = { ...updated[otherKey], ...syncFields }
          }
        })
        // Registry tasks (Projects/Goals/Other To-Do/Messages/Prio) with the
        // same label that don't have a meta entry yet — create one so the
        // detail shows up when that card renders.
        linkRegistry.current.forEach(({ key: otherKey, label: otherLabel }) => {
          if (otherKey === k || otherLabel !== label) return
          updated[otherKey] = { ...updated[otherKey], ...syncFields, label: otherLabel }
        })
      }

      // ── Name/keyword link: Messages ↔ Top Prio (owner + deadline only) ──
      const isLinkable = k.startsWith('msg-') || k.startsWith('prio-')
      const LINK_FIELDS = ['owner','deadline','hour','minute'] as const
      const changedLink = LINK_FIELDS.filter(f => f in u)
      if (isLinkable && changedLink.length) {
        const linkFields: Partial<TaskMeta> = {}
        changedLink.forEach(f => { (linkFields as any)[f] = (u as any)[f] })

        linkRegistry.current.forEach(({ key: otherKey, label: otherLabel }) => {
          if (otherKey === k) return
          // only link across the msg ↔ prio boundary
          const crossSurface =
            (k.startsWith('msg-') && otherKey.startsWith('prio-')) ||
            (k.startsWith('prio-') && otherKey.startsWith('msg-'))
          if (!crossSurface) return
          if (!sharePerson(label, otherLabel)) return
          updated[otherKey] = { ...updated[otherKey], ...linkFields, label: otherLabel }
        })
      }
      return updated
    })
  }, [])

  const [prioTasks, setPrioTasks] = useState(()=>{
    const imp=TOP_PRIO_TASKS;const w=imp.find(s=>s.section==='Work');const h=imp.find(s=>s.section==='Home');const o=imp.find(s=>s.section==='Other')
    return [w||{section:'Work',color:'#818cf8',tasks:[]},h||{section:'Home',color:'#2dd4bf',tasks:[]},{section:'Other Work',color:'#818cf8',tasks:o?.tasks||[]},{section:'Other Home',color:'#2dd4bf',tasks:[]}]
  })

  /* Messages state — LIFTED here so Close Day can clean */
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)

  const [hiddenTasks,setHiddenTasks] = useState<Set<string>>(new Set())
  // Calendar-only "deleted" events. Deleting an event in the calendar simply
  // hides that occurrence from ALL calendar views — it does NOT touch the
  // task's deadline/time anywhere else in the dashboard.
  const [hiddenCalendarEvents,setHiddenCalendarEvents] = useState<Set<string>>(new Set())
  const [modalTask,setModalTask] = useState<{key:string;label:string}|null>(null)
  const [showAnalytics,setShowAnalytics] = useState(false)
  const [showShutdown,setShowShutdown] = useState(false)
  const [showPlanned,setShowPlanned] = useState(false)
  const [showMeetings,setShowMeetings] = useState(false)
  const [focusTask,setFocusTask] = useState<{key:string;label:string}|null>(null)
  const [ganttProjects, setGanttProjects] = useState<Set<string>>(new Set())

  const openModal = useCallback((k:string,l:string)=>setModalTask({key:k,label:l}), [])
  const hideTask = useCallback((k:string)=>{setHiddenTasks(p=>new Set([...p,k]))}, [])
  const getProjectCompletion = useCallback((project:Project)=>{const total=project.tasks.length+project.doneTasks.length;if(!total)return 0;let done=0;project.tasks.forEach((_,i)=>{if(projectDone[`${project.key}-task-${i}`])done++});project.doneTasks.forEach((_,i)=>{if(projectDone[`${project.key}-done-${i}`]!==false)done++});return Math.round((done/total)*100)}, [projectDone])

  /* Recurring auto-deadline: when task checked + has recurring, set next deadline */
  const handleRecurringAfterToggle = useCallback((taskKey: string, nowDone: boolean) => {
    if (!nowDone) return
    const m = taskMeta[taskKey] as any
    if (!m?.recurring || !m?.deadline) return
    const cur = new Date(m.deadline + 'T00:00')
    let next: Date
    if (m.recurring === 'daily') { next = new Date(cur); next.setDate(next.getDate() + 1) }
    else if (m.recurring === 'weekly') { next = new Date(cur); next.setDate(next.getDate() + 7) }
    else { next = new Date(cur); next.setMonth(next.getMonth() + 1) }
    const ns = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`
    setTimeout(() => { setTaskMeta(prev => ({...prev,[taskKey]:{...prev[taskKey],deadline:ns}})) }, 1200)
  }, [taskMeta])

  const toggleProjectTask = useCallback((pk:string,tt:'task'|'done',idx:number)=>{
    const key=tt==='done'?`${pk}-done-${idx}`:`${pk}-task-${idx}`
    const metaKey = `proj-${pk}-${idx}`
    setProjectDone(prev=>{const nd=!prev[key];if(tt==='task'){const proj=[...PROJECTS,...LT_GOALS].find(p=>p.key===pk);if(proj?.tasks[idx]){const txt=proj.tasks[idx];
      // Sync done across Top Prio, Messages and any matching subtasks.
      setPrioTasks(pt=>pt.map(s=>({...s,tasks:s.tasks.map(t=>t.text===txt?{...t,done:nd}:t)})))
      setMessages(ms=>ms.map(m=>m.text===txt?{...m,done:nd}:m))
      setTaskMeta(prevM=>{let changed=false;const n:typeof prevM={...prevM};Object.keys(prevM).forEach(k=>{const subs=(prevM[k] as any)?.subtasks;if(Array.isArray(subs)&&subs.some((s:any)=>s.text===txt&&!!s.done!==nd)){n[k]={...prevM[k],subtasks:subs.map((s:any)=>s.text===txt?{...s,done:nd}:s)} as any;changed=true}});return changed?n:prevM})
    };if(nd) handleRecurringAfterToggle(metaKey,true)}return{...prev,[key]:nd}})
  }, [handleRecurringAfterToggle])

  // ──────────────────────────────────────────────────────────────────
  // Bi-directional done sync by task text.
  // Marking a task / subtask / message done anywhere on the dashboard
  // propagates the done state to every linked surface that shares the
  // same text — Top Prio Today, Messages, subtasks (in any task's meta)
  // and the source Project / Goal tasks — and vice-versa. Setting the
  // same value is idempotent, so this is safe to call from any toggle.
  // ──────────────────────────────────────────────────────────────────
  const propagateDone = useCallback((text:string, done:boolean)=>{
    setPrioTasks(prev=>prev.map(s=>({...s,tasks:s.tasks.map(t=>t.text===text?{...t,done}:t)})))
    setMessages(prev=>prev.map(m=>m.text===text?{...m,done}:m))
    setTaskMeta(prev=>{
      let changed=false; const n:typeof prev={...prev}
      Object.keys(prev).forEach(key=>{
        const subs=(prev[key] as any)?.subtasks
        if(Array.isArray(subs)&&subs.some((s:any)=>s.text===text&&!!s.done!==done)){
          n[key]={...prev[key],subtasks:subs.map((s:any)=>s.text===text?{...s,done}:s)} as any; changed=true
        }
      })
      return changed?n:prev
    })
    ;[...PROJECTS,...LT_GOALS].forEach(p=>p.tasks.forEach((t,i)=>{ if(t===text) setProjectDone(prev=>({...prev,[`${p.key}-task-${i}`]:done})) }))
  }, [])

  // ──────────────────────────────────────────────────────────────────
  // FIX #2: Recurring in prio toggle
  // When a prio task is toggled done, also fire handleRecurringAfterToggle
  // on matching project meta keys AND the prio meta key itself.
  // ──────────────────────────────────────────────────────────────────
  const onPrioTaskToggle = useCallback((text:string,done:boolean)=>{
    // Propagate done across all linked surfaces (Messages, subtasks, projects)
    propagateDone(text, done)
    // Sync done state to matching project tasks (+ recurring deadline shift)
    ;[...PROJECTS,...LT_GOALS].forEach(p=>{
      p.tasks.forEach((t,i)=>{
        if(t===text){
          // Trigger recurring deadline shift on the project meta key
          if(done) handleRecurringAfterToggle(`proj-${p.key}-${i}`, true)
        }
      })
    })
    // Also check prio-specific meta keys for recurring
    if (done) {
      Object.keys(taskMeta).forEach(k => {
        if (k.startsWith('prio-') && (taskMeta[k] as any)?.label === text) {
          handleRecurringAfterToggle(k, true)
        }
      })
    }
  }, [handleRecurringAfterToggle, taskMeta, propagateDone])

  const addPrioTask = useCallback((text:string)=>{setPrioTasks(prev=>prev.map(s=>s.section==='Other Work'?{...s,tasks:[...s.tasks,{id:`q${Date.now()}`,text,done:false}]}:s))}, [])

  const starToPrio = useCallback((text:string,category:'work'|'home')=>{
    let newId: string | null = null
    setPrioTasks(prev=>{const n=prev.map(s=>({...s,tasks:[...s.tasks]}));const sn=category==='home'?'Home':'Work';const idx=n.findIndex(s=>s.section===sn);if(idx<0)return prev;const ex=n[idx].tasks.findIndex(t=>t.text===text);if(ex>=0)n[idx].tasks.splice(ex,1);else{newId=`s${Date.now()}`;n[idx].tasks.push({id:newId,text,done:false});
      // Star and bookmark are mutually exclusive: adding a star removes any
      // existing bookmark of the same task from the "Other to-dos" sections.
      n.forEach(s=>{if(s.section==='Other Work'||s.section==='Other Home'){const bi=s.tasks.findIndex(t=>t.text===text);if(bi>=0)s.tasks.splice(bi,1)}})
    };return n})
    // FIX: carry over the source's owner/deadline onto the new prio task so
    // starring a task (from Messages, Projects, Goals, Other To-Do) keeps its
    // details in Top Prio.
    if (newId) {
      // Carry over ALL synced detail fields from the source task (Messages,
      // Projects, Goals, Other To-Do) so a starred task keeps its owner,
      // deadline/time, priority, recurring and time estimate in Top Prio.
      const srcMetas = linkRegistry.current
        .filter(r => r.label === text && !r.key.startsWith('prio-'))
        .map(r => taskMeta[r.key])
        .filter(Boolean) as TaskMeta[]
      const carried: Partial<TaskMeta> = { label: text }
      const CARRY_FIELDS = ['owner','deadline','hour','minute','priority','recurring','timeEstimate'] as const
      CARRY_FIELDS.forEach(f => {
        const src = srcMetas.find(m => (m as any)[f] !== undefined)
        if (src) (carried as any)[f] = (src as any)[f]
      })
      setTaskMeta(p => ({ ...p, [`prio-${newId}`]: { ...p[`prio-${newId}`], ...carried } }))
    }
  }, [taskMeta])
  // Star a subtask into Top Prio. Carries the subtask's own details
  // (owner / deadline / time estimate) so they show up + count in Planned.
  const starSubtaskToPrio = useCallback((text:string, details?:Partial<TaskMeta>)=>{
    let newId: string | null = null
    setPrioTasks(prev=>{const n=prev.map(s=>({...s,tasks:[...s.tasks]}));const idx=n.findIndex(s=>s.section==='Work');if(idx<0)return prev;const ex=n[idx].tasks.findIndex(t=>t.text===text);if(ex>=0)n[idx].tasks.splice(ex,1);else{newId=`s${Date.now()}`;n[idx].tasks.push({id:newId,text,done:false});
      n.forEach(s=>{if(s.section==='Other Work'||s.section==='Other Home'){const bi=s.tasks.findIndex(t=>t.text===text);if(bi>=0)s.tasks.splice(bi,1)}})
    };return n})
    if (newId && details) {
      const carried: Partial<TaskMeta> = { label: text }
      ;(['owner','deadline','timeEstimate'] as const).forEach(f => { if ((details as any)[f] !== undefined) (carried as any)[f] = (details as any)[f] })
      setTaskMeta(p => ({ ...p, [`prio-${newId}`]: { ...p[`prio-${newId}`], ...carried } }))
    }
  }, [])
  // Bookmark a task into the "Other to-dos" sub-section of Top Prio Today.
  // Mirrors starToPrio but targets the Other Work / Other Home sections and
  // carries over the source's synced detail fields (owner, deadline, etc.).
  const bookmarkToOther = useCallback((text:string,category:'work'|'home')=>{
    let newId: string | null = null
    setPrioTasks(prev=>{const n=prev.map(s=>({...s,tasks:[...s.tasks]}));const sn=category==='home'?'Other Home':'Other Work';const idx=n.findIndex(s=>s.section===sn);if(idx<0)return prev;const ex=n[idx].tasks.findIndex(t=>t.text===text);if(ex>=0)n[idx].tasks.splice(ex,1);else{newId=`b${Date.now()}`;n[idx].tasks.push({id:newId,text,done:false});
      // Star and bookmark are mutually exclusive: adding a bookmark removes any
      // existing star of the same task from the Work / Home sections.
      n.forEach(s=>{if(s.section==='Work'||s.section==='Home'){const si=s.tasks.findIndex(t=>t.text===text);if(si>=0)s.tasks.splice(si,1)}})
    };return n})
    if (newId) {
      const srcMetas = linkRegistry.current
        .filter(r => r.label === text && !r.key.startsWith('prio-'))
        .map(r => taskMeta[r.key])
        .filter(Boolean) as TaskMeta[]
      const carried: Partial<TaskMeta> = { label: text }
      const CARRY_FIELDS = ['owner','deadline','hour','minute','priority','recurring','timeEstimate'] as const
      CARRY_FIELDS.forEach(f => {
        const src = srcMetas.find(m => (m as any)[f] !== undefined)
        if (src) (carried as any)[f] = (src as any)[f]
      })
      setTaskMeta(p => ({ ...p, [`prio-${newId}`]: { ...p[`prio-${newId}`], ...carried } }))
    }
  }, [taskMeta])
  // Bookmark a subtask into "Other to-dos", carrying its own details.
  const bookmarkSubtaskToOther = useCallback((text:string, details?:Partial<TaskMeta>)=>{
    let newId: string | null = null
    setPrioTasks(prev=>{const n=prev.map(s=>({...s,tasks:[...s.tasks]}));const idx=n.findIndex(s=>s.section==='Other Work');if(idx<0)return prev;const ex=n[idx].tasks.findIndex(t=>t.text===text);if(ex>=0)n[idx].tasks.splice(ex,1);else{newId=`b${Date.now()}`;n[idx].tasks.push({id:newId,text,done:false});
      n.forEach(s=>{if(s.section==='Work'||s.section==='Home'){const si=s.tasks.findIndex(t=>t.text===text);if(si>=0)s.tasks.splice(si,1)}})
    };return n})
    if (newId && details) {
      const carried: Partial<TaskMeta> = { label: text }
      ;(['owner','deadline','timeEstimate'] as const).forEach(f => { if ((details as any)[f] !== undefined) (carried as any)[f] = (details as any)[f] })
      setTaskMeta(p => ({ ...p, [`prio-${newId}`]: { ...p[`prio-${newId}`], ...carried } }))
    }
  }, [])
  const isTaskStarred = useCallback((text:string)=>prioTasks.some(s=>(s.section==='Work'||s.section==='Home')&&s.tasks.some(t=>t.text===text)), [prioTasks])
  const isTaskBookmarked = useCallback((text:string)=>prioTasks.some(s=>(s.section==='Other Work'||s.section==='Other Home')&&s.tasks.some(t=>t.text===text)), [prioTasks])
  const startFocus = useCallback((k:string,l:string)=>setFocusTask({key:k,label:l}), [])
  const stopFocus = useCallback((k:string,mins:number)=>{
    if(mins<=0)return;const now=new Date();const ds=`${now.getDate()}/${now.getMonth()+1} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    setTaskMeta(p=>{const ex=p[k]||{};return{...p,[k]:{...ex,focusSessions:[...((ex as any).focusSessions||[]),{date:ds,minutes:mins}]} as any}})
  }, [])

  const toggleGantt = useCallback((pk:string)=>{setGanttProjects(prev=>{const next=new Set(prev);if(next.has(pk))next.delete(pk);else next.add(pk);return next})}, [])

  /* Close the Day: remove done prio tasks + done messages + reset today focus */
  const dailyCleanup = useCallback(()=>{
    setPrioTasks(prev=>prev.map(s=>({...s,tasks:s.tasks.filter(t=>!t.done)})))
    setMessages(prev=>prev.filter(m=>!m.done))
    const td=new Date();const tp=`${td.getDate()}/${td.getMonth()+1}`
    setTaskMeta(prev=>{const n={...prev};Object.keys(n).forEach(k=>{const m=n[k];if((m as any).focusSessions?.length){n[k]={...m,focusSessions:((m as any).focusSessions||[]).filter((s:any)=>!s.date?.startsWith(tp))} as any}});return n})
  }, [])

  // ──────────────────────────────────────────────────────────────────
  // Unified rename — used by BOTH inline double-click edits (every card)
  // and the modal title edit. Given the task key + new name it:
  //   1. records an override for the key (covers Projects / Goals / Other
  //      To-Do / custom tasks whose base text comes from static data)
  //   2. updates the lifted Messages + Top Prio stores by matching text
  //   3. rewrites taskMeta labels that matched the old name
  //   4. propagates the new name to every other surface sharing the old
  //      label (so a synced Top Prio copy renames together with its source)
  //   5. keeps the open modal title in sync
  // It NEVER touches deadlines/times, so timelines are preserved.
  // ──────────────────────────────────────────────────────────────────
  const renameTask = useCallback((key: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const old = nameOverrides[key]
      || linkRegistry.current.find(r => r.key === key)?.label
      || (taskMeta[key] as any)?.label
      || ''

    // 1 + 4: override this key and every surface sharing the old label
    setNameOverrides(prev => {
      const np = { ...prev, [key]: trimmed }
      if (old) linkRegistry.current.forEach(r => { if (r.label === old) np[r.key] = trimmed })
      return np
    })

    // 2: lifted stores keyed by their own text
    if (old) {
      setPrioTasks(prev => prev.map(s => ({ ...s, tasks: s.tasks.map(t => t.text === old ? { ...t, text: trimmed } : t) })))
      setMessages(prev => prev.map(m => m.text === old ? { ...m, text: trimmed } : m))
    }

    // 3: taskMeta labels
    setTaskMeta(prev => {
      const updated = { ...prev }
      updated[key] = { ...updated[key], label: trimmed } as any
      if (old) Object.keys(updated).forEach(k => { if ((updated[k] as any)?.label === old) updated[k] = { ...updated[k], label: trimmed } as any })
      return updated
    })

    // 5: open modal title
    setModalTask(prev => prev && prev.key === key ? { ...prev, label: trimmed } : prev)
  }, [nameOverrides, taskMeta])

  // ──────────────────────────────────────────────────────────────────
  // FIX #4: Recurring events in calendar
  // Generates future instances (up to 90 days) for tasks with recurring
  // set, so they appear in the EventCalendar automatically.
  // ────────��─────────────────────────────────────────────────────────
  const deadlineEvents: DeadlineEvent[] = useMemo(()=>{
    const limit = new Date(); limit.setDate(limit.getDate() + 90)

    // Dedupe linked tasks so the SAME task isn't drawn twice (e.g. a message
    // and its linked Top Prio task, or identical task text shared across
    // Top Prio / Projects / Other To-Do / Goals).
    // Identity = date + (shared person if any, else normalized label).
    // NOTE: time is intentionally EXCLUDED from identity so an all-day copy
    // and a timed copy of the same task collapse into one (we keep the timed
    // one). This fixes duplicates lingering in Month/Week views.
    const byId = new Map<string, DeadlineEvent>()
    const identity = (label:string, date:string) => {
      const base = label.replace(/^🔄\s*/, '')
      const people = extractPeople(base)
      const who = people.length ? people.map(p=>p.toLowerCase()).sort().join('+') : base.trim().toLowerCase()
      return `${date}|${who}`
    }
    const add = (e: DeadlineEvent, k?: string) => {
      const id = identity(e.label, e.date)
      const existing = byId.get(id)
      if (!existing) { byId.set(id, { ...e, keys: k ? [k] : [] }); return }
      // merge contributing keys
      if (k && !existing.keys!.includes(k)) existing.keys!.push(k)
      // prefer the entry that has an explicit time
      if (existing.hour === undefined && e.hour !== undefined) {
        existing.hour = e.hour; existing.minute = e.minute
      }
    }

    Object.entries(taskMeta).filter(([,m])=>m.deadline).forEach(([k,m])=>{
      add({date:m.deadline!,label:m.label||'Task',color:'#818cf8',hour:m.hour,minute:m.minute}, k)

      // Generate recurring instances for the next 90 days
      if (m.recurring && m.deadline) {
        const start = new Date(m.deadline + 'T00:00')
        let next = new Date(start)
        for (let i = 0; i < 60; i++) {
          if (m.recurring === 'daily') next = new Date(next.getTime() + 86400000)
          else if (m.recurring === 'weekly') next = new Date(next.getTime() + 7 * 86400000)
          else { next = new Date(next); next.setMonth(next.getMonth() + 1) }
          if (next > limit) break
          const ds = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`
          add({ date: ds, label: `🔄 ${m.label || 'Task'}`, color: '#2dd4bf', hour: m.hour, minute: m.minute }, k)
        }
      }
    })
    // Subtask deadlines
    Object.entries(taskMeta).forEach(([key,m])=>{(m.subtasks||[]).forEach((st:any)=>{if(st.deadline)add({date:st.deadline,label:st.text,color:'#a78bfa'}, key)})})
    // Attach a stable per-occurrence id and drop any occurrence the user
    // deleted directly in the calendar (this never affects the task itself).
    return Array.from(byId.entries())
      .map(([id, ev]) => ({ ...ev, eventId: id }))
      .filter(ev => !hiddenCalendarEvents.has(ev.eventId!))
  }, [taskMeta, hiddenCalendarEvents])

  // Delete a calendar event = hide just this occurrence from the calendar.
  // It does NOT remove the deadline/time from taskMeta, so every other part of
  // the dashboard (Top Prio, Projects, Goals, status, planned time) is intact.
  const deleteDeadlineEvent = useCallback((ev: DeadlineEvent)=>{
    if (!ev.eventId) return
    setHiddenCalendarEvents(p => new Set([...p, ev.eventId!]))
  }, [])

  const completedTasks = useMemo(()=>{const set=new Set<string>();prioTasks.forEach(s=>s.tasks.forEach(t=>{if(t.done)set.add(t.text)}));[...PROJECTS,...LT_GOALS].forEach(p=>{p.tasks.forEach((t,i)=>{if(projectDone[`${p.key}-task-${i}`])set.add(t)})});return set}, [prioTasks,projectDone])
  const ganttProjectObjs = [...PROJECTS,...LT_GOALS].filter(p=>ganttProjects.has(p.key))

  const messagesAnswered = messages.filter(m=>m.done).length

  // Keep the link registry current. Includes every task surface so that
  // label-based sync can reach tasks that have no taskMeta entry yet:
  //   msg-<id>          Messages
  //   prio-<id>         Top Prio
  //   proj-<key>-<idx>  Active Projects + Long-Term Goals (same key prefix)
  //   todo-<sid>-<tid>  Other To-Do (static initial sections)
  linkRegistry.current = [
    ...messages.map(m => ({ key: `msg-${m.id}`, label: m.text })),
    ...prioTasks.flatMap(s => s.tasks.map(t => ({ key: `prio-${t.id}`, label: t.text }))),
    ...[...PROJECTS, ...LT_GOALS].flatMap(p => p.tasks.map((t, i) => ({ key: `proj-${p.key}-${i}`, label: t }))),
    ...OTHER_TODO_REGISTRY,
  ]

  const timeStats = useMemo(()=>{
    let plannedMin=0,totalTodayTasks=0,doneTodayTasks=0,meetingMin=0;const plannedTasks:{label:string;time:number}[]=[],meetingEvents:{label:string;time:string}[]=[];const todayStr=new Date().toISOString().slice(0,10)
    prioTasks.forEach(s=>s.tasks.forEach(t=>{totalTodayTasks++;if(t.done)doneTodayTasks++;const m=taskMeta[`prio-${t.id}`];if(m?.timeEstimate){plannedMin+=m.timeEstimate;plannedTasks.push({label:t.text,time:m.timeEstimate})}}))
    // Planned time is computed ONLY from Top Prio Today. Non-prio tasks with a
    // today deadline still contribute their meeting time, but NOT planned time.
    Object.entries(taskMeta).forEach(([k,m])=>{if(m.deadline===todayStr&&!k.startsWith('prio-')){if(m.hour!==undefined){meetingMin+=60;meetingEvents.push({label:m.label||k,time:`${m.hour.toString().padStart(2,'0')}:${(m.minute??0).toString().padStart(2,'0')}`})}}})
    let focusedMin=0;const td=new Date();const tp=`${td.getDate()}/${td.getMonth()+1}`
    Object.values(taskMeta).forEach(m=>{((m as any).focusSessions||[]).forEach((s:any)=>{if(s.date?.startsWith(tp))focusedMin+=s.minutes})})
    return{plannedMin,meetingMin,overloaded:plannedMin>480,totalTodayTasks,doneTodayTasks,plannedTasks,meetingEvents,focusedMin}
  }, [taskMeta,prioTasks])

  const fmtTime = (m:number)=>{const h=Math.floor(m/60);const mm=m%60;return mm>0?`${h}h ${mm}m`:`${h}h`}

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

      <div className="grid grid-cols-[240px_minmax(0,0.85fr)_minmax(0,1fr)] gap-3 items-start">
        <div className="flex flex-col gap-3">
          <MessagesCard messages={messages} setMessages={setMessages} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} onRename={renameTask} onToggleDone={propagateDone} />
          <KpisCard />
        </div>
        <div className="flex flex-col gap-3">
          <TopPrioCard tasks={prioTasks} setTasks={setPrioTasks} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} onTaskToggle={onPrioTaskToggle} onRename={renameTask} />
          <EventCalendar deadlineEvents={deadlineEvents} completedTasks={completedTasks} onDeleteEvent={deleteDeadlineEvent} />
          <ProgressOverview projectDone={projectDone} getProjectCompletion={getProjectCompletion} />
          {ganttProjectObjs.map(p=><ProjectGantt key={p.key} project={p} projectDone={projectDone} taskMeta={taskMeta} onClose={()=>toggleGantt(p.key)} />)}
          <LtGoalsCalendar taskMeta={taskMeta} />
          <LtGoalsCard projectDone={projectDone} toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} hideTask={hideTask} hiddenTasks={hiddenTasks} nameOverrides={nameOverrides} onRename={renameTask} />
        </div>
        <div className="flex flex-col gap-3">
          <ActiveProjectsCard projectDone={projectDone} toggleProjectTask={toggleProjectTask} getProjectCompletion={getProjectCompletion} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} hideTask={hideTask} hiddenTasks={hiddenTasks} onToggleGantt={toggleGantt} activeGanttProjects={ganttProjects} nameOverrides={nameOverrides} onRename={renameTask} />
          <OtherTodoCard taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} openModal={openModal} starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} nameOverrides={nameOverrides} onRename={renameTask} />
        </div>
      </div>

      {/* ── FIX #1 continued: modal onUpdate ALWAYS passes label ── */}
      {modalTask&&<TaskModal taskKey={modalTask.key} taskLabel={modalTask.label} meta={taskMeta[modalTask.key]||{}} onUpdate={u=>updateTaskMeta(modalTask.key,{...u, label: modalTask.label})} onClose={()=>setModalTask(null)} onStartFocus={startFocus} starSubtaskToPrio={starSubtaskToPrio} bookmarkSubtaskToOther={bookmarkSubtaskToOther} isTaskStarred={isTaskStarred} isTaskBookmarked={isTaskBookmarked} onRenameTask={(name)=>renameTask(modalTask.key, name)} />}
      {showShutdown&&<DailyShutdown onClose={()=>setShowShutdown(false)} tasksCompleted={timeStats.doneTodayTasks} tasksTotal={timeStats.totalTodayTasks} focusedMin={timeStats.focusedMin} messagesAnswered={messagesAnswered} onCleanup={dailyCleanup} />}
      {showAnalytics&&<WeeklyAnalytics onClose={()=>setShowAnalytics(false)} projectDone={projectDone} taskMeta={taskMeta} getProjectCompletion={getProjectCompletion} />}
    </div>
  )
}
