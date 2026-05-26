"use client"

import { useState } from "react"

/* ── types ───────────────────────────────────────────────── */
type TaskItem = { id: number; text: string; done: boolean }

/* ── shared sub-components ───────────────────────────────── */
function EditableTask({
  task,
  onToggle,
  onEdit,
}: {
  task: TaskItem
  onToggle: () => void
  onEdit: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(task.text)
  return (
    <div className="flex items-center gap-1.5 py-0.5 group">
      <input
        type="checkbox"
        checked={task.done}
        onChange={onToggle}
        className="w-3 h-3 flex-shrink-0 accent-[#7C3AED] cursor-pointer"
      />
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => { setEditing(false); onEdit(val) }}
          onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onEdit(val) } }}
          className="flex-1 text-[10px] border border-gray-300 rounded px-1 py-0.5 outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-[10px] cursor-text leading-relaxed ${task.done ? "line-through text-gray-400" : "text-gray-700"}`}
        >
          {task.text || <span className="text-gray-300 italic">task</span>}
        </span>
      )}
    </div>
  )
}

function TaskColumn({
  header,
  color,
  tasks,
  onToggle,
  onEdit,
  onAdd,
}: {
  header: string
  color: string
  tasks: TaskItem[]
  onToggle: (id: number) => void
  onEdit: (id: number, val: string) => void
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide mb-1 truncate" style={{ color }}>
        {header}
      </div>
      <div className="flex-1">
        {tasks.map((t) => (
          <EditableTask
            key={t.id}
            task={t}
            onToggle={() => onToggle(t.id)}
            onEdit={(v) => onEdit(t.id, v)}
          />
        ))}
      </div>
      <button
        onClick={onAdd}
        className="text-[9px] text-gray-400 hover:text-gray-600 mt-0.5 text-left transition-colors"
      >
        + Add
      </button>
    </div>
  )
}

/* ── Main Projects tab section ───────────────────────────── */
const PROJECT_TABS = ["LP GAP", "CASE TRACKER", "KOMUNITA", "SCHOOL"] as const
type ProjectTab = typeof PROJECT_TABS[number]

const PROJECT_TASKS_INIT: Record<ProjectTab, string[]> = {
  "LP GAP": ["Finalize slide deck", "Share with Varun", "Update assumptions model"],
  "CASE TRACKER": ["QA data import", "Review filters", "UAT with TS team"],
  "KOMUNITA": ["Publish newsletter", "Review grant brief", "Schedule member call"],
  "SCHOOL": ["Submit application", "Prepare references"],
}

function MainProjectsSection() {
  const [activeTab, setActiveTab] = useState<ProjectTab>("LP GAP")
  const [taskMap, setTaskMap] = useState<Record<ProjectTab, TaskItem[]>>(
    PROJECT_TABS.reduce((acc, p) => {
      acc[p] = PROJECT_TASKS_INIT[p].map((t, i) => ({ id: i, text: t, done: false }))
      return acc
    }, {} as Record<ProjectTab, TaskItem[]>)
  )
  const [nextIds, setNextIds] = useState<Record<ProjectTab, number>>(
    PROJECT_TABS.reduce((acc, p) => { acc[p] = PROJECT_TASKS_INIT[p].length; return acc }, {} as Record<ProjectTab, number>)
  )

  const toggle = (id: number) =>
    setTaskMap((prev) => ({ ...prev, [activeTab]: prev[activeTab].map((t) => t.id === id ? { ...t, done: !t.done } : t) }))
  const editTask = (id: number, val: string) =>
    setTaskMap((prev) => ({ ...prev, [activeTab]: prev[activeTab].map((t) => t.id === id ? { ...t, text: val } : t) }))
  const addTask = () => {
    const nid = nextIds[activeTab]
    setTaskMap((prev) => ({ ...prev, [activeTab]: [...prev[activeTab], { id: nid, text: "", done: false }] }))
    setNextIds((prev) => ({ ...prev, [activeTab]: nid + 1 }))
  }

  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7C3AED] mb-1">Main Projects</div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-2">
        {PROJECT_TABS.map((p) => (
          <button
            key={p}
            onClick={() => setActiveTab(p)}
            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors ${
              activeTab === p
                ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      {/* Tasks */}
      <div className="border-l-4 border-l-[#7C3AED] bg-white px-2">
        {taskMap[activeTab].map((t) => (
          <EditableTask key={t.id} task={t} onToggle={() => toggle(t.id)} onEdit={(v) => editTask(t.id, v)} />
        ))}
        <button onClick={addTask} className="text-[10px] text-gray-400 hover:text-gray-600 py-0.5 transition-colors">
          + Add task
        </button>
      </div>
    </div>
  )
}

/* ── Other To Do List — 4 columns ────────────────────────── */
const OTHER_COLS = ["HMADRI", "Varun", "Ts team", "Mtg w/ John"] as const
const OTHER_BOTTOM = ["Prashant", "School", "Grocery"] as const

function OtherTodoSection() {
  const initTasks = (items: string[]) => items.map((t, i) => ({ id: i, text: t, done: false }))

  const [colTasks, setColTasks] = useState<Record<string, TaskItem[]>>({
    HMADRI: initTasks(["Review proposal", "Follow up email", "Budget check", "Intro call"]),
    Varun: initTasks(["Sync on metrics", "Share deck", "Model review", "Q2 plan"]),
    "Ts team": initTasks(["Sprint review", "Backlog grooming", "Deploy QA", "API docs"]),
    "Mtg w/ John": initTasks(["Prep agenda", "Send invite", "Notes", "Action items"]),
  })
  const [bottomTasks, setBottomTasks] = useState<Record<string, TaskItem[]>>({
    Prashant: initTasks(["Connect re: intro", "Follow up"]),
    School: initTasks(["Application", "Reference letter"]),
    Grocery: initTasks(["Vegetables", "Fruit", "Dairy"]),
  })
  const [nextIds, setNextIds] = useState<Record<string, number>>({
    HMADRI: 4, Varun: 4, "Ts team": 4, "Mtg w/ John": 4, Prashant: 2, School: 2, Grocery: 3,
  })

  const makeHandlers = (
    map: Record<string, TaskItem[]>,
    setMap: React.Dispatch<React.SetStateAction<Record<string, TaskItem[]>>>
  ) => ({
    toggle: (col: string, id: number) =>
      setMap((prev) => ({ ...prev, [col]: prev[col].map((t) => t.id === id ? { ...t, done: !t.done } : t) })),
    edit: (col: string, id: number, val: string) =>
      setMap((prev) => ({ ...prev, [col]: prev[col].map((t) => t.id === id ? { ...t, text: val } : t) })),
    add: (col: string) => {
      const nid = nextIds[col] ?? 0
      setMap((prev) => ({ ...prev, [col]: [...(prev[col] ?? []), { id: nid, text: "", done: false }] }))
      setNextIds((prev) => ({ ...prev, [col]: nid + 1 }))
    },
  })

  const colH = makeHandlers(colTasks, setColTasks)
  const botH = makeHandlers(bottomTasks, setBottomTasks)

  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7C3AED] mb-1">Other To Do List</div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {OTHER_COLS.map((col) => (
          <TaskColumn
            key={col}
            header={col}
            color="#374151"
            tasks={colTasks[col] ?? []}
            onToggle={(id) => colH.toggle(col, id)}
            onEdit={(id, v) => colH.edit(col, id, v)}
            onAdd={() => colH.add(col)}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OTHER_BOTTOM.map((col) => (
          <TaskColumn
            key={col}
            header={col}
            color="#6b7280"
            tasks={bottomTasks[col] ?? []}
            onToggle={(id) => botH.toggle(col, id)}
            onEdit={(id, v) => botH.edit(col, id, v)}
            onAdd={() => botH.add(col)}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Long Term Goals To Do List — 4 columns ─────────────── */
const GOAL_COLS = ["Promotion", "Finance", "Relationships", "Health"] as const
const GOAL_COLORS: Record<string, string> = {
  Promotion: "#7C3AED",
  Finance: "#2563EB",
  Relationships: "#16A34A",
  Health: "#dc2626",
}

function LongTermGoalsSection() {
  const initTasks = (items: string[]) => items.map((t, i) => ({ id: i, text: t, done: false }))

  const [colTasks, setColTasks] = useState<Record<string, TaskItem[]>>({
    Promotion: initTasks(["Make partner case", "Visibility plan"]),
    Finance: initTasks(["Emergency fund", "Investment review"]),
    Relationships: initTasks(["Monthly check-ins", "Host dinner"]),
    Health: initTasks(["Run 5k", "Sleep 7h avg"]),
  })
  const [nextIds, setNextIds] = useState<Record<string, number>>({ Promotion: 2, Finance: 2, Relationships: 2, Health: 2 })

  const toggle = (col: string, id: number) =>
    setColTasks((prev) => ({ ...prev, [col]: prev[col].map((t) => t.id === id ? { ...t, done: !t.done } : t) }))
  const edit = (col: string, id: number, val: string) =>
    setColTasks((prev) => ({ ...prev, [col]: prev[col].map((t) => t.id === id ? { ...t, text: val } : t) }))
  const add = (col: string) => {
    const nid = nextIds[col] ?? 0
    setColTasks((prev) => ({ ...prev, [col]: [...prev[col], { id: nid, text: "", done: false }] }))
    setNextIds((prev) => ({ ...prev, [col]: nid + 1 }))
  }

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7C3AED] mb-1">Long Term Goals To Do List</div>
      <div className="grid grid-cols-4 gap-2">
        {GOAL_COLS.map((col) => (
          <TaskColumn
            key={col}
            header={col}
            color={GOAL_COLORS[col]}
            tasks={colTasks[col] ?? []}
            onToggle={(id) => toggle(col, id)}
            onEdit={(id, v) => edit(col, id, v)}
            onAdd={() => add(col)}
          />
        ))}
      </div>
    </div>
  )
}

/* ── EXPORT ─────────────────────────────────────────────── */
export function MainProjectsPanel() {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">Main Projects</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <MainProjectsSection />
        <OtherTodoSection />
        <LongTermGoalsSection />
      </div>
    </div>
  )
}
