'use client'

// Dynamic import prevents SSR of the Three.js canvas
import dynamic from 'next/dynamic'

const WorkshopScene = dynamic(
  () => import('@/components/workshop/WorkshopScene').then(m => ({ default: m.WorkshopScene })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#080810',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
          color: 'rgba(255,255,255,0.4)',
          fontSize: '12px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        Loading workshop...
      </div>
    ),
  }
)

export function WorkshopPrototypePage() {
  return <WorkshopScene />
}
