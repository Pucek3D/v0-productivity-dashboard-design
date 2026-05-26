'use client'

import { MESSAGES } from '@/lib/data'

export function MessagesCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07),0_8px_24px_rgba(0,0,0,0.05)]">
      <div className="bg-[#374151] px-3.5 py-[9px] shadow-[0_3px_10px_rgba(0,0,0,0.22)] relative z-[2]">
        <span className="text-white font-bold text-[10.5px] tracking-[0.07em] uppercase">
          Messages
        </span>
      </div>
      <div className="p-[11px_13px]">
        {MESSAGES.map((msg, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 py-1 ${
              i < MESSAGES.length - 1 ? 'border-b border-[#f9fafb]' : ''
            }`}
          >
            <div className="w-[13px] h-[13px] rounded-[3px] border-[1.5px] border-[#e5e7eb] flex-shrink-0" />
            <span className="text-[11px] text-[#374151] leading-[1.3]">{msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
