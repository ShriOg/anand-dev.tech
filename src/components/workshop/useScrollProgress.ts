'use client'

import { useRef, useCallback } from 'react'

// How much one wheel "tick" nudges the progress (tune this)
const SCROLL_SENSITIVITY = 0.0004

/**
 * Translates raw wheel events into nudges on a 0–1 target progress value.
 *
 * RULE: This hook only writes to `targetProgress`. It never writes to the
 * camera or to the spring's `current`. The spring is the only thing that
 * makes the camera move.
 */
export function useScrollProgress(): [
  React.MutableRefObject<number>,
  (v: number) => void
] {
  const targetProgress = useRef(0)

  const setTargetProgress = useCallback((v: number) => {
    targetProgress.current = Math.max(0, Math.min(1, v))
  }, [])

  return [targetProgress, setTargetProgress]
}

/**
 * Attaches a wheel listener to a DOM element and nudges `targetProgress`.
 * Returns an `onWheel` handler suitable for a div wrapper.
 */
export function useWheelHandler(
  targetProgress: React.MutableRefObject<number>,
  setTargetProgress: (v: number) => void
) {
  const lastTimeRef = useRef(0)

  const onWheel = useCallback(
    (e: WheelEvent | React.WheelEvent) => {
      e.preventDefault()
      const now = performance.now()
      // Throttle to ~60fps nudges
      if (now - lastTimeRef.current < 8) return
      lastTimeRef.current = now

      const delta = e.deltaY * SCROLL_SENSITIVITY
      setTargetProgress(targetProgress.current + delta)
    },
    [targetProgress, setTargetProgress]
  )

  return onWheel
}
