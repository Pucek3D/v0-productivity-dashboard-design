'use client'
import { useEffect, useState } from 'react'

/**
 * Returns false during SSR and the first client render, then true after mount.
 *
 * Used to defer drag-and-drop (dnd-kit) rendering to the client. dnd-kit's
 * `useUniqueId` relies on a module-level counter that drifts under React
 * StrictMode's dev double-render, producing non-deterministic `aria-describedby`
 * / live-region ids and a hydration mismatch. Gating the dnd markup behind this
 * flag guarantees the server and first client render emit identical, id-free
 * markup, so hydration succeeds and drag-and-drop attaches right afterward.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
