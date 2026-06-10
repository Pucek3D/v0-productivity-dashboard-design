'use client'
import { MESSAGES } from '@/lib/data'

export function MessagesCard() {
  return (
    <div className="card-base halo-stone">
      <div className="section-header header-stone px-4 py-2.5">
        <span className="text-white font-semibold text-[11px] tracking-[0.16em] uppercase text-shadow-on-color">
          Messages
        </span>
      </div>
      <div className="px-3.5 py-2.5">
        {MESSAGES.map((msg, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 py-[5px] group cursor-pointer ${
              i < MESSAGES.length - 1 ? 'border-b border-[#f5f5f1]' : ''
            }`}
          >
            <div className="w-3 h-3 rounded-[3px] border border-[#d6d3d1] bg-white flex-shrink-0 group-hover:border-[#a8a29e] transition-colors" />
            <span className="text-[11.5px] text-[#292524] leading-[1.3]">{msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}