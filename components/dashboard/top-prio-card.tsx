'use client'
import { useState, useRef, useEffect } from 'react'
import { IconGripVertical, IconTrash, IconPlus } from '@tabler/icons-react'
import { TaskActions } from './task-actions'
import type { TaskMeta } from '@/lib/task-meta'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, type DragEndEvent, DragOverlay, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type PrioTask = { id: string; text: string; done: boolean; priority?: string }
type PrioSection = { section: string; color: string; tasks: PrioTask[] }
interface TopPrioCardProps { tasks: PrioSection[]; setTasks: React.Dispatch<React.SetStateAction<PrioSection[]>>; taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void; openModal: (k: string, l: string) => void; onTaskToggle?: (text: string, done: boolean) => void }

function MetaBadges({ meta }: { meta?: TaskMeta }) {
  if (!meta) return null
  const b: React.ReactNode[] = []
  if (meta.priority) { const c = meta.priority === 'high' ? '#fb7185' : meta.priority === 'medium' ? '#fbbf24' : '#94a3b8'; b.push(<span key="p" style={{ fontSize:7,fontWeight:700,textTransform:'uppercase',background:`${c}22`,color:c,border:`1px solid ${c}44`,borderRadius:3,padding:'0 3px',lineHeight:'14px' }}>{meta.priority.slice(0,3)}</span>) }
  if (meta.recurring) b.push(<span key="r" style={{ fontSize:7,fontWeight:700,textTransform:'uppercase',background:'rgba(45,212,191,0.15)',color:'#2dd4bf',border:'1px solid rgba(45,212,191,0.3)',borderRadius:3,padding:'0 3px',lineHeight:'14px' }}>{String(meta.recurring).slice(0,3)}</span>)
  if (meta.timeEstimate) b.push(<span key="t" style={{ fontSize:7,fontWeight:600,color:'#64748b',background:'rgba(255,255,255,0.05)',borderRadius:3,padding:'0 3px',lineHeight:'14px' }}>{meta.timeEstimate >= 60 ? `${meta.timeEstimate/60}h` : `${meta.timeEstimate}m`}</span>)
  return b.length ? <span className="inline-flex items-center gap-0.5">{b}</span> : null
}

function EditableText({ value, onChange, className, style }: { value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(value); const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing]); useEffect(() => { setDraft(value) }, [value])
  if (editing) return <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }} onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); if (draft.trim()) onChange(draft.trim()) } if (e.key === 'Escape') { setEditing(false); setDraft(value) } }} className={className} style={{ ...style, background:'rgba(255,255,255,0.05)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:4,padding:'0 4px',outline:'none',width:'100%' }} onClick={e => e.stopPropagation()} />
  return <span className={className} style={style} onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

export function TopPrioCard({ tasks, setTasks, taskMeta, updateTaskMeta, openModal, onTaskToggle }: TopPrioCardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [activeTask, setActiveTask] = useState<PrioTask | null>(null)
  const act = (sk: string, fn: (s: PrioSection, si: number, n: PrioSection[]) => PrioSection[]) => { setTasks(prev => { const n = [...prev]; const si = n.findIndex(s => s.section === sk); if (si < 0) return prev; return fn(n[si], si, n) }) }
  const toggleTask = (sk: string, ti: number) => act(sk, (s, si, n) => { const sec = { ...s }; const tl = [...sec.tasks]; const nd = !tl[ti].done; tl[ti] = { ...tl[ti], done: nd }; sec.tasks = tl; n[si] = sec; if (onTaskToggle) onTaskToggle(tl[ti].text, nd); return n })
  const deleteTask = (sk: string, ti: number) => act(sk, (s, si, n) => { const sec = { ...s }; sec.tasks = sec.tasks.filter((_, i) => i !== ti); n[si] = sec; return n })
  const addTask = (sk: string) => act(sk, (s, si, n) => { const sec = { ...s }; sec.tasks = [...sec.tasks, { id: `q${Date.now()}`, text: 'New task', done: false }]; n[si] = sec; return n })
  const renameTask = (sk: string, ti: number, t: string) => act(sk, (s, si, n) => { const sec = { ...s }; const tl = [...sec.tasks]; tl[ti] = { ...tl[ti], text: t }; sec.tasks = tl; n[si] = sec; return n })

  const handleDragStart = (e: DragStartEvent) => { for (const s of tasks) { const f = s.tasks.find(t => t.id === e.active.id); if (f) { setActiveTask(f); break } } }
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null); const { active, over } = e; if (!over) return
    let ss = '', si = -1; for (const s of tasks) { const i = s.tasks.findIndex(t => t.id === active.id); if (i >= 0) { ss = s.section; si = i; break } }; if (!ss) return
    let ds = '', di = -1; for (const s of tasks) { const i = s.tasks.findIndex(t => t.id === over.id); if (i >= 0) { ds = s.section; di = i; break } }
    if (!ds) { const k = String(over.id); if (tasks.find(s => s.section === k)) { ds = k; di = tasks.find(s => s.section === k)!.tasks.length } }; if (!ds) return
    if (ss === ds) { setTasks(p => { const n = [...p]; const i = n.findIndex(s => s.section === ss); const sec = { ...n[i] }; sec.tasks = arrayMove([...sec.tasks], si, di); n[i] = sec; return n }) }
    else { setTasks(p => { const n = [...p]; const a = n.findIndex(s => s.section === ss); const b = n.findIndex(s => s.section === ds); const sa = { ...n[a] }; const sb = { ...n[b] }; const [m] = sa.tasks.splice(si, 1); const ins = Math.min(di >= 0 ? di : sb.tasks.length, sb.tasks.length); sb.tasks = [...sb.tasks.slice(0, ins), m, ...sb.tasks.slice(ins)]; n[a] = sa; n[b] = sb; return n }) }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* ONE merged card */}
      <div className="card-base halo-black">
        {/* Top Prio section */}
        <div className="section-header header-black px-4 py-2.5">
          <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Top prio today</span>
        </div>
        <div className="px-3 py-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Quadrant sectionKey="Work" label="WORK" labelColor="#818cf8" tasks={tasks.find(s=>s.section==='Work')?.tasks||[]} onToggle={i=>toggleTask('Work',i)} onDelete={i=>deleteTask('Work',i)} onAdd={()=>addTask('Work')} onRename={(i,t)=>renameTask('Work',i,t)} openModal={openModal} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
            <Quadrant sectionKey="Home" label="HOME" labelColor="#2dd4bf" tasks={tasks.find(s=>s.section==='Home')?.tasks||[]} onToggle={i=>toggleTask('Home',i)} onDelete={i=>deleteTask('Home',i)} onAdd={()=>addTask('Home')} onRename={(i,t)=>renameTask('Home',i,t)} openModal={openModal} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
          </div>
        </div>

        {/* Subtle divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)', margin: '0 12px' }} />

        {/* Other To-Dos section */}
        <div className="px-4 py-2">
          <span className="text-white/50 font-semibold text-[10px] tracking-[0.16em] uppercase">Other to-dos</span>
        </div>
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Quadrant sectionKey="Other Work" label="WORK" labelColor="#818cf8" tasks={tasks.find(s=>s.section==='Other Work')?.tasks||[]} onToggle={i=>toggleTask('Other Work',i)} onDelete={i=>deleteTask('Other Work',i)} onAdd={()=>addTask('Other Work')} onRename={(i,t)=>renameTask('Other Work',i,t)} openModal={openModal} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
            <Quadrant sectionKey="Other Home" label="HOME" labelColor="#2dd4bf" tasks={tasks.find(s=>s.section==='Other Home')?.tasks||[]} onToggle={i=>toggleTask('Other Home',i)} onDelete={i=>deleteTask('Other Home',i)} onAdd={()=>addTask('Other Home')} onRename={(i,t)=>renameTask('Other Home',i,t)} openModal={openModal} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />
          </div>
        </div>
      </div>
      <DragOverlay>{activeTask ? <div className="bg-[#1e2438] border border-white/10 rounded-md px-2 py-1 text-[12px] text-slate-200 shadow-xl">{activeTask.text}</div> : null}</DragOverlay>
    </DndContext>
  )
}

function Quadrant({ sectionKey, label, labelColor, tasks, onToggle, onDelete, onAdd, onRename, openModal, taskMeta, updateTaskMeta }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: sectionKey })
  return (
    <div ref={setNodeRef} className="rounded-lg p-2.5 border transition-colors" style={{ background: isOver ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.025)', borderColor: isOver ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-[0.12em]" style={{ color: labelColor }}>{label}</span>
        <button onClick={onAdd} className="w-4 h-4 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5"><IconPlus size={11} /></button>
      </div>
      <SortableContext items={tasks.map((t:any)=>t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task:any, ti:number) => <SortableTask key={task.id} task={task} onToggle={()=>onToggle(ti)} onDelete={()=>onDelete(ti)} onOpen={()=>openModal(`prio-${task.id}`,task.text)} onRename={(t:string)=>onRename(ti,t)} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} />)}
      </SortableContext>
      {tasks.length === 0 && <div className="text-[10px] text-slate-600 text-center py-2 italic">Drop tasks here</div>}
    </div>
  )
}

function SortableTask({ task, onToggle, onDelete, onOpen, onRename, taskMeta, updateTaskMeta }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const meta = taskMeta[`prio-${task.id}`]
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }} className="flex items-start gap-1.5 py-[3px] cursor-pointer select-none group" onClick={onOpen}>
      <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 mt-[3px] cursor-grab" onClick={(e:any) => e.stopPropagation()}><IconGripVertical size={10} className="text-slate-600" /></span>
      <div onClick={(e:any) => { e.stopPropagation(); onToggle() }} className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center transition-all mt-[2px] ${task.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5 group-hover:border-slate-400'}`}>{task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <EditableText value={task.text} onChange={onRename} className={`text-[12px] leading-[1.35] min-w-0 truncate ${task.done ? 'text-slate-500 line-through' : 'text-slate-200'}`} />
          <MetaBadges meta={meta} />
        </div>
      </div>
      <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={(e:any) => e.stopPropagation()}>
        <TaskActions taskKey={`prio-${task.id}`} taskLabel={task.text} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
        <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none" onClick={onDelete}><IconTrash size={11} className="text-slate-500 hover:text-rose-400" /></button>
      </span>
    </div>
  )
}
