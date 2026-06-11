'use client'
import { useState } from 'react'
import { MESSAGES } from '@/lib/data'

interface Item {
  id: number
  text: string
  done: boolean
}

export function MessagesCard() {
  const [items, setItems] = useState<Item[]>(() =>
    MESSAGES.map((text, i) => ({ id: i, text, done: false }))
  )

  const toggle = (id: number) => {
    setItems(prev => {
      const updated = prev.map(it => (it.id === id ? { ...it, done: !it.done } : it))
      return updated.sort((a, b) => Number(a.done) - Number(b.done))
    })
  }

  return (
    <div className="card-base halo-indigo">
      <div className="section-header header-indigo px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Messages
        </span>
      </div>
      <div className="px-3.5 py-2.5">
        {items.map((it, i) => (
          <div
            key={it.id}
            onClick={() => toggle(it.id)}
            className={`flex items-center gap-2.5 py-[5px] group cursor-pointer select-none ${
              i < items.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <div
              className={`w-3 h-3 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-all ${
                it.done
                  ? 'bg-indigo-500/30 border-indigo-400'
                  :  'border-slate-600 bg-white/5 group-hover:border-slate-400'
              }`}
            >
              {it.done && <span className="text-indigo-300 text-[7px] font-bold leading-none">✓</span>}
            </div>
            <span className={`text-[12.5px] leading-[1.35] ${
              it.done ? 'text-slate-500 line-through' : 'text-slate-200'
            }`}>
              {it.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}