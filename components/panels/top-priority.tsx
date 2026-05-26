"use client"

import { useState } from "react"

/* ── shared helpers ─────────────────────────────────────── */
const WORK_STYLE = "border-l-4 border-l-[#7C3AED] bg-white"
const HOME_STYLE = "border-l-4 border-l-[#16A34A] bg-white"
const OTHER_STYLE = "border-l-4 border-l-[#2563EB] bg-white"

type TaskItem = { id: number; text: string; done: boolean }

function TaskRow({
  task,
  dotColor,
  onToggle,
  onEdit,
}: {
  task: TaskItem
  dotColor: string
  onToggle: () => void
  onEdit: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(task.text)

  return (
    <div className="flex items-center gap-2 py-0.5 px-2 group">
      <input
        type="checkbox"
        checked={task.done}
        onChange={onToggle}
        className="w-3.5 h-3.5 flex-shrink-0 accent-[#7C3AED] cursor-pointer"
      />
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => { setEditing(false); onEdit(val) }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onEdit(val) } }}
          className="flex-1 text-xs border border-gray-300 rounded px-1 py-0.5 outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-xs cursor-text select-none ${task.done ? "line-through text-gray-400" : "text-gray-700"}`}
        >
          {task.text || <span className="text-gray-300 italic">untitled</span>}
        </span>
      )}
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
    </div>
  )
}

function TaskSection({
  label,
  labelColor,
  dotColor,
  rowStyle,
  initialTasks,
}: {
  label: string
  labelColor: string
  dotColor: string
  rowStyle: string
  initialTasks: string[]
}) {
  const [tasks, setTasks] = useState<TaskItem[]>(
    initialTasks.map((t, i) => ({ id: i, text: t, done: false }))
  )
  const [nextId, setNextId] = useState(initialTasks.length)

  const toggle = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const edit = (id: number, val: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text: val } : t)))

  const addTask = () => {
    setTasks((prev) => [...prev, { id: nextId, text: "", done: false }])
    setNextId((n) => n + 1)
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 px-2 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: labelColor }}>
          {label}
        </span>
      </div>
      <div className={`rounded ${rowStyle} mb-0.5 divide-y divide-gray-50`}>
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            dotColor={dotColor}
            onToggle={() => toggle(t.id)}
            onEdit={(v) => edit(t.id, v)}
          />
        ))}
      </div>
      <button
        onClick={addTask}
        className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-0.5 transition-colors"
      >
        + Add task
      </button>
    </div>
  )
}

/* ── MESSAGES sub-panel ─────────────────────────────────── */
function MessagesPanel() {
  const [contacts, setContacts] = useState([
    { id: 0, name: "Varun", done: false },
    { id: 1, name: "HMADRI", done: false },
    { id: 2, name: "Prashant", done: false },
    { id: 3, name: "Ts team", done: false },
    { id: 4, name: "John", done: false },
    { id: 5, name: "School", done: false },
  ])
  const [nextId, setNextId] = useState(6)

  const toggle = (id: number) =>
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)))

  const edit = (id: number, val: string) =>
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, name: val } : c)))

  return (
    <div className="mt-2 border-t border-gray-100 pt-2">
      <div className="px-2 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Messages</span>
      </div>
      <div className="divide-y divide-gray-50">
        {contacts.map((c) => (
          <ContactRow key={c.id} contact={c} onToggle={() => toggle(c.id)} onEdit={(v) => edit(c.id, v)} />
        ))}
      </div>
      <button
        onClick={() => { setContacts((prev) => [...prev, { id: nextId, name: "", done: false }]); setNextId((n) => n + 1) }}
        className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-0.5 transition-colors"
      >
        + Add contact
      </button>
    </div>
  )
}

function ContactRow({ contact, onToggle, onEdit }: { contact: { id: number; name: string; done: boolean }; onToggle: () => void; onEdit: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(contact.name)
  return (
    <div className="flex items-center gap-2 py-0.5 px-2">
      <input type="checkbox" checked={contact.done} onChange={onToggle} className="w-3.5 h-3.5 flex-shrink-0 accent-[#7C3AED] cursor-pointer" />
      {editing ? (
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
          onBlur={() => { setEditing(false); onEdit(val) }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onEdit(val) } }}
          className="flex-1 text-xs border border-gray-300 rounded px-1 py-0.5 outline-none" />
      ) : (
        <span onClick={() => setEditing(true)} className={`flex-1 text-xs cursor-text ${contact.done ? "line-through text-gray-400" : "text-gray-700"}`}>
          {contact.name || <span className="text-gray-300 italic">contact</span>}
        </span>
      )}
    </div>
  )
}

/* ── EXPORT ─────────────────────────────────────────────── */
export function TopPriorityPanel() {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">Top Priority Today</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-2">
        <TaskSection
          label="Top 3 Work"
          labelColor="#7C3AED"
          dotColor="#7C3AED"
          rowStyle={WORK_STYLE}
          initialTasks={["Finalize LP GAP slide deck", "Case Tracker review call", "Update KOMUNITA brief"]}
        />
        <TaskSection
          label="Top 3 Home"
          labelColor="#16A34A"
          dotColor="#16A34A"
          rowStyle={HOME_STYLE}
          initialTasks={["Grocery run", "Book dentist appointment", "Call mom"]}
        />
        <TaskSection
          label="Other"
          labelColor="#2563EB"
          dotColor="#2563EB"
          rowStyle={OTHER_STYLE}
          initialTasks={["Read article on pricing strategy", "Podcast — Invest Like the Best"]}
        />
        <MessagesPanel />
      </div>
    </div>
  )
}
