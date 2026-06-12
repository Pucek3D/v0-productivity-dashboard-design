'use client'
import { useState } from 'react'
import { MESSAGES } from '@/lib/data'
import { IconGripVertical } from '@tabler/icons-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Item {
  id: number
  text: string
  done: boolean
}

export function MessagesCard() {
  const [items, setItems] = useState<Item[]>(() =>
    MESSAGES.map((text, i) => ({ id: i, text, done: false }))
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const toggle = (id: number) => {
    setItems(prev => {
      const updated = prev.map(it => (it.id === id ? { ...it, done: !it.done } : it))
      return updated.sort((a, b) => Number(a.done) - Number(b.done))
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems(prev => {
      const oldIdx = prev.findIndex(it => it.id === active.id)
      const newIdx = prev.findIndex(it => it.id === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  return (
    <div className="card-base halo-indigo">
      <div className="section-header px-4 py-3">
        <span className="text-white/90 font-semibold text-[11px] tracking-[0.18em] uppercase">Messages</span>
      </div>
      <div className="px-3.5 py-2.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(it => it.id)} strategy={verticalListSortingStrategy}>
            {items.map((it, i) => (
              <SortableMessage key={it.id} item={it} isLast={i === items.length - 1} onToggle={() => toggle(it.id)} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

function SortableMessage({ item, isLast, onToggle }: { item: Item; isLast: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as any,
  }

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2.5 py-[5px] group cursor-pointer select-none ${
        !isLast ? 'border-b border-white/5' : ''
      }`}>
      <span {...attributes} {...listeners} className="icon-on-hover flex-shrink-0 cursor-grab">
        <IconGripVertical size={10} className="text-slate-600" />
      </span>
      <div onClick={onToggle}
        className={`w-3 h-3 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-all ${
          item.done ? 'bg-indigo-500/30 border-indigo-400' : 'border-slate-600 bg-white/5 group-hover:border-slate-400'
        }`}>
        {item.done && <span className="text-indigo-300 text-[7px] font-bold leading-none">✓</span>}
      </div>
      <span className={`text-[12.5px] leading-[1.35] ${
        item.done ? 'text-slate-500 line-through' : 'text-slate-200'
      }`}>
        {item.text}
      </span>
    </div>
  )
}