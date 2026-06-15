'use client'
import { DndContext, type DndContextProps } from '@dnd-kit/core'
import { useMounted } from '@/lib/use-mounted'

/**
 * Renders a dnd-kit DndContext only after the component has mounted on the
 * client. Before mount (SSR + first client render) it renders its children
 * directly, without the context provider or its hidden accessibility/live-region
 * nodes — which is what avoids the dnd-kit hydration mismatch.
 *
 * Children that call `useSortable` / `useDroppable` degrade gracefully to dnd's
 * default context while unwrapped, so they render fine pre-mount (they just
 * aren't draggable until the real context appears one frame later).
 */
export function ClientDnd({ children, ...props }: DndContextProps) {
  const mounted = useMounted()
  if (!mounted) return <>{children}</>
  return <DndContext {...props}>{children}</DndContext>
}
