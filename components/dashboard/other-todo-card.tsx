'use client'
import { useState, useRef, useEffect } from 'react'
import { IconTrash, IconStar, IconPlus, IconGripVertical } from '@tabler/icons-react'
import { TaskActions } from './task-actions'
import type { TaskMeta } from '@/lib/task-meta'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function EditableText({ value, onChange, className, style }: any) {
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(value); const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing]); useEffect(() => { setDraft(value) }, [value])
  if (editing) return <input ref={ref} value={draft} onChange={(e: any) => setDraft(e.target.value)} onBlur={() => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }} onKeyDown={(e: any) => { if (e.key === 'Enter') { setEditing(false); if (draft.trim()) onChange(draft.trim()) } if (e.key === 'Escape') { setEditing(false); setDraft(value) } }} className={className} style={{ ...style, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '0 4px', outline: 'none' }} onClick={(e: any) => e.stopPropagation()} />
  return <span className={className} style={{ ...style, cursor: 'text' }} onDoubleClick={(e: any) => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

function MetaBadges({ meta }: { meta?: TaskMeta }) {
  if (!meta) return null; const b: React.ReactNode[] = []
  if (meta.priority) { const c = meta.priority === 'high' ? '#fb7185' : meta.priority === 'medium' ? '#fbbf24' : '#94a3b8'; b.push(<span key="p" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{meta.priority.slice(0, 3)}</span>) }
  if (meta.owner) b.push(<span key="o" style={{ fontSize: 8, fontWeight: 600, color: '#2dd4bf', background: 'rgba(45,212,191,0.12)', borderRadius: 3, padding: '0 4px', lineHeight: '16px' }}>{meta.owner}</span>)
  return b.length ? <span className="inline-flex items-center gap-0.5 flex-wrap">{b}</span> : null
}

const SECTION_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#ef4444', '#06b6d4']

interface OtherSection { id: string; name: string; color: string; tasks: { id: string; text: string; done: boolean }[] }
const INITIAL_SECTIONS: OtherSection[] = [
  { id: 'sushovan', name: 'Sushovan (Monitor)', color: '#8b5cf6', tasks: [{ id: 'os1', text: 'WEF — Food Systems (WIP)', done: false }, { id: 'os2', text: 'AACI — case summary (WIP)', done: false }] },
  { id: 'varun', name: 'Varun (Delegate)', color: '#3b82f6', tasks: [{ id: 'os3', text: 'Draft promotion note for HR', done: false }, { id: 'os4', text: 'Progress tracker (new joiners)', done: false }] },
  { id: 'konrad', name: 'Konrad', color: '#f59e0b', tasks: [{ id: 'os5', text: 'PPK — budget for lunch + agenda', done: false }, { id: 'os6', text: 'Cross-practice section prep', done: false }] },
  { id: 'personal', name: 'Personal', color: '#ec4899', tasks: [{ id: 'os7', text: 'Faisal — respond', done: false }, { id: 'os8', text: 'Inga — celebrate her promotion!', done: false }] },
]

interface Props { taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void; openModal: (k: string, l: string) => void; starToPrio?: (t: string, c: 'work' | 'home') => void; isTaskStarred?: (t: string) => boolean; nameOverrides?: Record<string, string>; onRename?: (key: string, newName: string) => void }

export function OtherTodoCard({ taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred, nameOverrides, onRename }: Props) {
  const [sections, setSections] = useState<OtherSection[]>(INITIAL_SECTIONS)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const toggleTask = (sid: string, tid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, tasks: s.tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t) } : s))
  const deleteTask = (sid: string, tid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, tasks: s.tasks.filter(t => t.id !== tid) } : s))
  const addTask = (sid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, tasks: [...s.tasks, { id: `ot${Date.now()}`, text: 'New task', done: false }] } : s))
  const deleteSection = (sid: string) => setSections(p => p.filter(s => s.id !== sid))
  const renameSection = (sid: string, name: string) => setSections(p => p.map(s => s.id === sid ? { ...s, name } : s))
  const renameTask = (sid: string, tid: string, text: string) => {
    setSections(p => p.map(s => s.id === sid ? { ...s, tasks: s.tasks.map(t => t.id === tid ? { ...t, text } : t) } : s))
    // Propagate to synced surfaces (e.g. a starred Top Prio copy)
    onRename?.(`todo-${sid}-${tid}`, text)
  }
  const addSection = () => setSections(p => [...p, { id: `sec-${Date.now()}`, name: 'New Section', color: SECTION_COLORS[Math.floor(Math.random() * SECTION_COLORS.length)], tasks: [] }])

  const handleDragEnd = (sid: string) => (e: DragEndEvent) => {
    const { active, over } = e; if (!over || active.id === over.id) return
    setSections(p => p.map(s => {
      if (s.id !== sid) return s
      const oi = s.tasks.findIndex(t => t.id === active.id); const ni = s.tasks.findIndex(t => t.id === over.id)
      return oi >= 0 && ni >= 0 ? { ...s, tasks: arrayMove([...s.tasks], oi, ni) } : s
    }))
  }

  return (
    <div className="card-base halo-stone">
      <div className="section-header header-stone px-4 py-3"><div className="flex items-center justify-between"><span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Other To-Do</span><button onClick={addSection} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5"><IconPlus size={13} /></button></div></div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {sections.map(section => (
            <div key={section.id}>
              <div className="flex items-center gap-1.5 mb-1.5 group">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: section.color }} />
                <EditableText value={section.name} onChange={(n: string) => renameSection(section.id, n)} className="text-[10px] font-bold tracking-[0.10em] uppercase flex-1 min-w-0" style={{ color: section.color }} />
                <button onClick={() => deleteSection(section.id)} className="icon-on-hover bg-transparent border-none cursor-pointer p-0 flex-shrink-0"><IconTrash size={11} className="text-slate-600 hover:text-rose-400" /></button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(section.id)}>
                <SortableContext items={section.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {section.tasks.map(task => {
                    const taskKey = `todo-${section.id}-${task.id}`; const meta = taskMeta[taskKey]; const firstSub = meta?.subtasks?.find(s => !s.done)
                    const label = nameOverrides?.[taskKey] ?? (meta as any)?.label ?? task.text
                    return <SortableTodoTask key={task.id} task={{ ...task, text: label }} taskKey={taskKey} meta={meta} firstSub={firstSub}
                      onToggle={() => toggleTask(section.id, task.id)} onDelete={() => deleteTask(section.id, task.id)}
                      onRename={(t: string) => renameTask(section.id, task.id, t)} openModal={openModal}
                      taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} starToPrio={starToPrio} isTaskStarred={isTaskStarred} />
                  })}
                </SortableContext>
              </DndContext>
              <button onClick={() => addTask(section.id)} className="flex items-center gap-1 mt-1 text-slate-600 hover:text-slate-400 transition-colors"><IconPlus size={10} /><span className="text-[9px] font-medium">Add task</span></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SortableTodoTask({ task, taskKey, meta, firstSub, onToggle, onDelete, onRename, openModal, taskMeta, updateTaskMeta, starToPrio, isTaskStarred }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <div className="flex items-center gap-1.5 py-[3px] group cursor-pointer" onClick={() => openModal(taskKey, task.text)}>
        <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 cursor-grab" onClick={(e: any) => e.stopPropagation()}><IconGripVertical size={10} className="text-slate-600" /></span>
        <div onClick={(e: any) => { e.stopPropagation(); onToggle() }} className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center cursor-pointer ${task.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>{task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}</div>
        <EditableText value={task.text} onChange={onRename} className={`text-[12px] leading-[1.35] flex-1 min-w-0 ${task.done ? 'text-slate-500 line-through' : 'text-slate-300'}`} />
        <span className="inline-flex items-center gap-0.5 flex-shrink-0" onClick={(e: any) => e.stopPropagation()}>
          <TaskActions taskKey={taskKey} taskLabel={task.text} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
          {starToPrio && <button onClick={() => starToPrio(task.text, 'work')} className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none"><IconStar size={11} className={isTaskStarred?.(task.text) ? 'fill-yellow-500 text-yellow-500' : 'text-slate-500 hover:text-amber-400'} /></button>}
          <button onClick={(e: any) => { e.stopPropagation(); onDelete() }} className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none"><IconTrash size={11} className="text-slate-500 hover:text-rose-400" /></button>
        </span>
      </div>
      {meta && <div className="pl-[28px] mb-0.5"><MetaBadges meta={meta} /></div>}
      {firstSub && <div className="flex items-center gap-1.5 pl-[28px] pb-0.5"><span className="text-[11px] text-slate-600">→</span><div className="w-3 h-3 rounded-[3px] border border-slate-600 bg-white/5 flex-shrink-0 cursor-pointer hover:border-slate-400" onClick={() => { const subs = (meta?.subtasks || []).map((s: any) => s.id === firstSub.id ? { ...s, done: true } : s); updateTaskMeta(taskKey, { subtasks: subs }) }} /><span className="text-[11px] text-slate-500 truncate">{firstSub.text}</span></div>}
    </div>
  )
}
