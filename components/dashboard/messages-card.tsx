'use client'
import { useState } from 'react'
import { IconTrash, IconPlus } from '@tabler/icons-react'
import { TaskActions } from './task-actions'
import type { TaskMeta } from '@/lib/task-meta'

interface Message { id: string; text: string; done: boolean }

interface Props {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  taskMeta: Record<string, TaskMeta>
  updateTaskMeta: (k: string, u: Partial<TaskMeta>) => void
}

export function MessagesCard({ messages, setMessages, taskMeta, updateTaskMeta }: Props) {
  const [newMsg, setNewMsg] = useState('')
  const toggle = (id: string) => setMessages(prev => prev.map(m => m.id === id ? { ...m, done: !m.done } : m))
  const remove = (id: string) => setMessages(prev => prev.filter(m => m.id !== id))
  const add = () => { if (!newMsg.trim()) return; setMessages(prev => [...prev, { id: `m${Date.now()}`, text: newMsg.trim(), done: false }]); setNewMsg('') }

  const sorted = [...messages].sort((a, b) => Number(a.done) - Number(b.done))

  return (
    <div className="card-base halo-stone">
      <div className="section-header header-stone px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Messages</span>
      </div>
      <div className="px-3.5 py-3">
        {sorted.map(msg => (
          <div key={msg.id} className="flex items-center gap-2 py-[3px] group" data-msg-done={msg.done ? 'true' : 'false'}>
            <div onClick={() => toggle(msg.id)}
              className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center cursor-pointer ${msg.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'}`}>
              {msg.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
            </div>
            <span className={`text-[12px] leading-[1.35] flex-1 min-w-0 ${msg.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
              {msg.text}
            </span>
            <span className="inline-flex items-center gap-0.5 flex-shrink-0">
              <TaskActions taskKey={`msg-${msg.id}`} taskLabel={msg.text} taskMeta={taskMeta} updateTaskMeta={updateTaskMeta} compact />
              <button onClick={() => remove(msg.id)} className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none">
                <IconTrash size={12} className="text-slate-500 hover:text-rose-400" />
              </button>
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <span className="text-slate-600"><IconPlus size={12} /></span>
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }}
            placeholder="Add message..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 11, color: '#e2e8f0', fontFamily: 'inherit' }} />
        </div>
      </div>
    </div>
  )
}
