import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The Workshop — Prototype 0.1 | Anand Shukla",
  description: "Camera-spline prototype: validating the spring-damped traversal feel before art work begins.",
  robots: { index: false }, // don't index the prototype
}

// Force dynamic rendering — this page hosts a live 3D canvas
export const dynamic = 'force-dynamic'

// Client component import must be in a separate file per App Router rules
import { WorkshopPrototypePage } from './WorkshopPrototypePage'

export default function WorkshopPage() {
  return <WorkshopPrototypePage />
}
