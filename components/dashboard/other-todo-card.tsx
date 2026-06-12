'use client'
import { useState, useRef, useEffect } from 'react'
import { IconTrash, IconStar, IconPlus } from '@tabler/icons-react'
import { TaskActions } from './task-actions'
import type { TaskMeta } from '@/lib/task-meta'

/* ── Editable text ── */
function EditableText({ value, onChange, className, style }: {
  value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])
  if (editing) {
    return <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); if (draft.trim() && draft !== value) onChange(draft.trim()) }}
      onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); if (draft.trim()) onChange(draft.trim()) } if (e.key === 'Escape') { setEditing(false); setDraft(value) } }}
      className={className} style={{ ...style, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '0 4px', outline: 'none' }}
      onClick={e => e.stopPropagation()} />
  }
  return <span className={className} style={{ ...style, cursor: 'text' }} onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}>{value}</span>
}

const SECTION_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#ef4444', '#06b6d4']

interface OtherSection {
  id: string
  name: string
  color: string
  tasks: { id: string; text: string; done: boolean }[]
}

const INITIAL_SECTIONS: OtherSection[] = [
  {
    id: 'sushovan', name: 'Sushovan (Monitor)', color: '#8b5cf6',
    tasks: [
      { id: 'os1', text: 'WEF — Food Systems (WIP)', done: false },
      { id: 'os2', text: 'AACI — case summary (WIP)', done: false },
    ]
  },
  {
    id: 'varun', name: 'Varun (Delegate)', color: '#3b82f6',
    tasks: [
      { id: 'os3', text: 'Draft promotion note for HR', done: false },
      { id: 'os4', text: 'Progress tracker (new joiners)', done: false },
    ]
  },
  {
    id: 'konrad', name: 'Konrad', color: '#f59e0b',
    tasks: [
      { id: 'os5', text: 'PPK — budget for lunch + agenda', done: false },
      { id: 'os6', text: 'Cross-practice section prep', done: false },
    ]
  },
  {
    id: 'personal', name: 'Personal', color: '#ec4899',
    tasks: [
      { id: 'os7', text: 'Faisal — respond', done: false },
      { id: 'os8', text: 'Inga — celebrate her promotion!', done: false },
    ]
  },
]

interface OtherTodoCardProps {
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  openModal: (k: string, l: string) => void
  starToPrio?: (text: string, category: 'work' | 'home') => void
  isTaskStarred?: (text: string) => boolean
}

export function OtherTodoCard({ taskMeta, updateTaskMeta, openModal, starToPrio, isTaskStarred }: OtherTodoCardProps) {
  const [sections, setSections] = useState<OtherSection[]>(INITIAL_SECTIONS)

  const toggleTask = (sectionId: string, taskId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) } : s
    ))
  }

  const deleteTask = (sectionId: string, taskId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) } : s
    ))
  }

  const addTask = (sectionId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, tasks: [...s.tasks, { id: `ot${Date.now()}`, text: 'New task', done: false }] } : s
    ))
  }

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId))
  }

  const renameSection = (sectionId: string, name: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, name } : s))
  }

  const renameTask = (sectionId: string, taskId: string, text: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, text } : t) } : s
    ))
  }

  const addSection = () => {
    const color = SECTION_COLORS[Math.floor(Math.random() * SECTION_COLORS.length)]
    setSections(prev => [...prev, {
      id: `sec-${Date.now()}`, name: 'New Section', color, tasks: [],
    }])
  }

  return (
    <div className="card-base halo-stone">
      <div className="section-header header-stone px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Other To-Do</span>
          <button onClick={addSection} className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors">
            <IconPlus size={13} />
          </button>
        </div>
      </div>
      <div className="p-3">
        {/* 2-column layout */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {sections.map(section => (
            <div key={section.id}>
              {/* Section header */}
              <div className="flex items-center gap-1.5 mb-1.5 group">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: section.color }} />
                <EditableText value={section.name} onChange={(n) => renameSection(section.id, n)}
                  className="text-[10px] font-bold tracking-[0.10em] uppercase flex-1 min-w-0"
                  style={{ color: section.color }} />
                <button onClick={() => deleteSection(section.id)}
                  className="icon-on-hover bg-transparent border-none cursor-pointer p-0 flex-shrink-0">
                  <IconTrash size={11} className="text-slate-600 hover:text-rose-400" />
                </button>
              </div>

              {/* Tasks */}
              {section.tasks.map(task => (
                <div key={task.id} className="flex items-start gap-1.5 py-[3px] group">
                  <div onClick={() => toggleTask(section.id, task.id)}
                    className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center mt-[2px] cursor-pointer ${
                      task.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'
                    }`}>
                    {task.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
                  </div>
                  <EditableText value={task.text} onChange={(t) => renameTask(section.id, task.id, t)}
                    className={`text-[12px] leading-[1.35] flex-1 min-w-0 ${task.done ? 'text-slate-500 line-through' : 'text-slate-300'}`} />
                  <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0">
                    {starToPrio && (
                      <button onClick={() => starToPrio(task.text, 'work')}
                        className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none">
                        <IconStar size={11}
                          className={isTaskStarred?.(task.text) ? 'fill-yellow-500 text-yellow-500' : 'text-slate-500 hover:text-amber-400'}
                          style={isTaskStarred?.(task.text) ? { filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' } : {}} />
                      </button>
                    )}
                    <button onClick={() => deleteTask(section.id, task.id)}
                      className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none">
                      <IconTrash size={11} className="text-slate-500 hover:text-rose-400" />
                    </button>
                  </span>
                </div>
              ))}

              {/* Add task */}
              <button onClick={() => addTask(section.id)}
                className="flex items-center gap-1 mt-1 text-slate-600 hover:text-slate-400 transition-colors">
                <IconPlus size={10} />
                <span className="text-[9px] font-medium">Add task</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
