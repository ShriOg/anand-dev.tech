import { redirect } from 'next/navigation'

// Total redesign: root redirects to the new Workshop prototype.
// The old page (Hero, About, Projects sections) is replaced.
export default function Home() {
  redirect('/workshop')
}
