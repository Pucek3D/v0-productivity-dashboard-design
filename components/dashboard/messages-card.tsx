'use client'
import { useState } from 'react'
import { IconTrash, IconPlus, IconCalendar } from '@tabler/icons-react'

const INITIAL_MESSAGES = [
  { id: 'm1', text: 'Varun — respond today', done: false },
  { id: 'm2', text: 'Surabhi — AI initiative (Jun 5)', done: false },
  { id: 'm3', text: 'John — meeting doc needed', done: false },
  { id: 'm4', text: 'Himadri — write meeting note', done: false },
  { id: 'm5', text: 'Prashant — act on findings', done: false },
  { id: 'm6', text: 'Anurag — skill status follow-up', done: false },
  { id: 'm7', text: 'Konrad — PPK + workshop?', done: false },
  { id: 'm8', text: 'Shratha — review case example', done: false },
]

export function MessagesCard() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [newMsg, setNewMsg] = useState('')

  const toggle = (id: string) => setMessages(prev => prev.map(m => m.id === id ? { ...m, done: !m.done } : m))
  const remove = (id: string) => setMessages(prev => prev.filter(m => m.id !== id))
  const add = () => { if (!newMsg.trim()) return; setMessages(prev => [...prev, { id: `m${Date.now()}`, text: newMsg.trim(), done: false }]); setNewMsg('') }

  return (
    <div className="card-base halo-stone">
      <div className="section-header header-stone px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Messages</span>
      </div>
      <div className="px-3.5 py-3">
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-2 py-[3px] group" data-msg-done={msg.done ? 'true' : 'false'}>
            <div onClick={() => toggle(msg.id)}
              className={`w-3.5 h-3.5 rounded-[4px] border flex-shrink-0 flex items-center justify-center mt-[1px] cursor-pointer ${
                msg.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5'
              }`}>
              {msg.done && <span className="text-indigo-300 text-[8px] font-bold leading-none">✓</span>}
            </div>
            <span className={`text-[12px] leading-[1.35] flex-1 min-w-0 ${msg.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
              {msg.text}
            </span>
            <span className="inline-flex items-center gap-0.5 flex-shrink-0">
              <button className="icon-on-hover bg-transparent border-none cursor-pointer p-0 leading-none">
                <IconCalendar size={12} className="text-slate-500 hover:text-slate-300" />
              </button>
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
