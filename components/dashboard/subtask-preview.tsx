'use client'
import { IconStar, IconBookmark } from '@tabler/icons-react'
import { getDateLabel, type TaskMeta } from '@/lib/task-meta'

interface SubtaskPreviewProps {
  sub: { id: string; text: string; done?: boolean; owner?: string; deadline?: string; timeEstimate?: number }
  pl?: string
  onToggleDone: () => void
  isTaskStarred?: (t: string) => boolean
  isTaskBookmarked?: (t: string) => boolean
  starSubtaskToPrio?: (t: string, details?: Partial<TaskMeta>) => void
  bookmarkSubtaskToOther?: (t: string, details?: Partial<TaskMeta>) => void
}

/* Shared dashboard subtask preview row — mirrors a subtask's star/bookmark
   state and its owner/date so they stay in sync with Top Prio Today. */
export function SubtaskPreview({ sub, pl = 'pl-[28px]', onToggleDone, isTaskStarred, isTaskBookmarked, starSubtaskToPrio, bookmarkSubtaskToOther }: SubtaskPreviewProps) {
  const dateInfo = sub.deadline ? getDateLabel(sub.deadline) : null
  const starred = isTaskStarred?.(sub.text) ?? false
  const bookmarked = isTaskBookmarked?.(sub.text) ?? false
  const details: Partial<TaskMeta> = { owner: sub.owner, deadline: sub.deadline, timeEstimate: sub.timeEstimate }

  return (
    <div className={`flex items-center gap-1.5 ${pl} pb-0.5 -mt-0.5 group/sub`}>
      <span className="text-[11px] text-slate-600">→</span>
      <div
        className="w-3 h-3 rounded-[3px] border border-slate-600 bg-white/5 flex-shrink-0 cursor-pointer hover:border-slate-400"
        onClick={(e) => { e.stopPropagation(); onToggleDone() }}
      />
      <span className="text-[11px] text-slate-500 truncate min-w-0">{sub.text}</span>
      {dateInfo && <span className={`text-[7px] font-bold uppercase tracking-wider px-1 py-[1px] rounded flex-shrink-0 ${dateInfo.className}`}>{dateInfo.text}</span>}
      {sub.owner && <span className="text-[7px] font-medium text-teal-300 bg-teal-500/15 px-1 py-[1px] rounded tracking-wider flex-shrink-0">{sub.owner}</span>}
      <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {starSubtaskToPrio && (
          <button onClick={() => starSubtaskToPrio(sub.text, details)} className="bg-transparent border-none cursor-pointer p-0 leading-none" title={starred ? 'Starred to Top Prio' : 'Star to Top Prio'}>
            <IconStar size={10} className={starred ? 'fill-yellow-500 text-yellow-500' : 'icon-on-hover-sub text-slate-500 hover:text-amber-400'} />
          </button>
        )}
        {bookmarkSubtaskToOther && (
          <button onClick={() => bookmarkSubtaskToOther(sub.text, details)} className="bg-transparent border-none cursor-pointer p-0 leading-none" title={bookmarked ? 'Added to Other to-dos' : 'Add to Other to-dos'}>
            <IconBookmark size={10} className={bookmarked ? 'fill-indigo-400 text-indigo-400' : 'icon-on-hover-sub text-slate-500 hover:text-indigo-300'} />
          </button>
        )}
      </span>
    </div>
  )
}
