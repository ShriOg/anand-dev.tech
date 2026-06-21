import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "The Workshop — Anand Shukla",
  description: "A founder's studio — one continuous 3D space, one resident character, six zones. Ideas become reality here.",
}

/**
 * Workshop route layout — intentionally minimal.
 * The 3D scene is full-screen and manages its own overlays.
 * No header, no footer, no old-site UI — this layout replaces them entirely
 * for the /workshop route.
 */
export default function WorkshopLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
