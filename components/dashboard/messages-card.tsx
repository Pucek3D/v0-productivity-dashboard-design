'use client'
import { useState } from 'react'
import { IconTrash, IconPlus, IconGripVertical, IconStar, IconBookmark } from '@tabler/icons-react'
import { TaskActions } from './task-actions'
import { EditableLabel } from './editable-label'
import type { TaskMeta } from '@/lib/task-meta'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Message { id: string; text: string; done: boolean }
interface Props {
  messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  taskMeta: Record<string, TaskMeta>; updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
  starToPrio?: (text: string, category: 'work' | 'home') => void
  isTaskStarred?: (text: string) => boolean
  bookmarkToOther?: (text: string, category: 'work' | 'home') => void
  isTaskBookmarked?: (text: string) => boolean
  onRename?: (key: string, newName: string) => void
}

/* MetaBadges — skips owner + deadline (already shown by TaskActions inline) */
function MetaBadges({ meta }: { meta?: TaskMeta }) {
  if (!meta) return null
  const b: React.ReactNode[] = []
  if (meta.priority) {
    const c = meta.priority === 'high' ? '#fb7185' : meta.priority === 'medium' ? '#fbbf24' : '#94a3b8'
    b.push(<span key="p" style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>{meta.priority.slice(0, 3)}</span>)
  }
  if (meta.recurring) b.push(<span key="r" style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>{String(meta.recurring).slice(0, 3)}</span>)
  if (meta.timeEstimate) b.push(<span key="t" style={{ fontSize: 7, fontWeight: 600, color: '#64748b', background: 'rgba(255,255,255,0.05)', borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>{meta.timeEstimate >= 60 ? `${meta.timeEstimate / 60}h` : `${meta.timeEstimate}m`}</span>)
  /* owner intentionally excluded — TaskActions already shows it inline */
  return b.length ? <span className="inline-flex items-center gap-0.5 flex-wrap">{b}</span> : null
}

export function MessagesCard({ messages, setMessages, taskMeta, updateTaskMeta, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, onRename }: Props) {
  const [newMsg, setNewMsg] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const toggle = (id: string) => setMessages(p => p.map(m => m.id === id ? { ...m, done: !m.done } : m))
  const remove = (id: string) => setMessages(p => p.filter(m => m.id !== id))
  const add = () => { if (!newMsg.trim()) return; setMessages(p => [...p, { id: `m${Date.now()}`, text: newMsg.trim(), done: false }]); setNewMsg('') }
  const sorted = [...messages].sort((a, b) => Number(a.done) - Number(b.done))
  const handleDragEnd = (e: DragEndEvent) => { const { active, over } = e; if (!over || active.id === over.id) return; setMessages(p => { const oi = p.findIndex(m => m.id === active.id); const ni = p.findIndex(m => m.id === over.id); return oi >= 0 && ni >= 0 ? arrayMove([...p], oi, ni) : p }) }

  return (
    <div className="card-base halo-stone">
      <div className="section-header header-stone px-4 py-3"><span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Messages</span></div>
      <div className="px-3 py-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map(m => m.id)} strategy={verticalListSortingStrategy}>
            {sorted.map(msg => <SortableMsg key={msg.id} msg={msg} toggle={toggle} remove={remove} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} starToPrio={starToPrio} isTaskStarred={isTaskStarred} bookmarkToOther={bookmarkToOther} isTaskBookmarked={isTaskBookmarked} onRename={onRename} />)}
          </SortableContext>
        </DndContext>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <span className="text-slate-600"><IconPlus size={12} /></span>
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} placeholder="Add message..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: '#e2e8f0', fontFamily: 'inherit' }} />
        </div>
      </div>
    </div>
  )
}

function SortableMsg({ msg, toggle, remove, taskMeta, updateTaskMeta, starToPrio, isTaskStarred, bookmarkToOther, isTaskBookmarked, onRename }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: msg.id })
  const starred = isTaskStarred?.(msg.text)
  const bookmarked = isTaskBookmarked?.(msg.text)
  const meta = taskMeta[`msg-${msg.id}`]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <div className="flex items-center gap-1.5 py-[3px] group">
        <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 cursor-grab"><IconGripVertical size={10} className="text-slate-600" /></span>
        <div onClick={() => toggle(msg.id)} className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center cursor-pointer ${msg.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>{msg.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}</div>
        <EditableLabel value={msg.text} onRename={(name) => onRename?.(`msg-${msg.id}`, name)} className={`text-[12px] leading-[1.35] flex-1 min-w-0 ${msg.done ? 'text-slate-500 line-through' : 'text-slate-300'}`} />
        <span className="inline-flex items-center gap-0.5 flex-shrink-0">
          <TaskActions taskKey={`msg-${msg.id}`} taskLabel={msg.text} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
          {starToPrio && (
            <button
              onClick={() => starToPrio(msg.text, 'work')}
              className={`bg-transparent border-none cursor-pointer p-0 leading-none ${starred ? '' : 'icon-on-hover'}`}
            >
              <IconStar
                size={11}
                className={starred ? 'fill-yellow-500 text-yellow-500' : 'text-slate-500 hover:text-amber-400'}
                style={starred ? { filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' } : {}}
              />
            </button>
          )}
          {bookmarkToOther && (
            <button
              onClick={() => bookmarkToOther(msg.text, 'work')}
              className={`bg-transparent border-none cursor-pointer p-0 leading-none ${bookmarked ? '' : 'icon-on-hover'}`}
              title={bookmarked ? 'Added to Other to-dos' : 'Add to Other to-dos'}
            >
              <IconBookmark
                size={11}
                className={bookmarked ? 'fill-indigo-400 text-indigo-400' : 'text-slate-500 hover:text-indigo-300'}
              />
            </button>
          )}
          <button onClick={() => remove(msg.id)} className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none"><IconTrash size={12} className="text-slate-500 hover:text-rose-400" /></button>
        </span>
      </div>
      {meta && <div className="pl-[28px] mb-0.5"><MetaBadges meta={meta} /></div>}
    </div>
  )
}
