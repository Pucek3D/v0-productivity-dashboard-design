'use client'
import { useState } from 'react'
import { MESSAGES } from '@/lib/data'

export function MessagesCard() {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const toggle = (i: number) => {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="card-base halo-stone">
      <div className="section-header header-stone px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Messages
        </span>
      </div>
      <div className="px-3.5 py-2.5">
        {MESSAGES.map((msg, i) => {
          const isDone = checked[i]
          return (
            <div
              key={i}
              onClick={() => toggle(i)}
              className={`flex items-center gap-2.5 py-[5px] group cursor-pointer select-none ${
                i < MESSAGES.length - 1 ? 'border-b border-[#f5f5f1]' : ''
              }`}
            >
              <div
                className={`w-3 h-3 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-[#c7d2fe] border-[#c7d2fe]'
                    : 'border-[#d6d3d1] bg-white group-hover:border-[#a8a29e]'
                }`}
              >
                {isDone && <span className="text-[#3730a3] text-[7px] font-bold leading-none">✓</span>}
              </div>
              <span className={`text-[11.5px] leading-[1.3] ${
                isDone ? 'text-[#a8a29e] line-through' : 'text-[#292524]'
              }`}>
                {msg}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
