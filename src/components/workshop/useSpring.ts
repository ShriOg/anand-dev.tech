import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Critically-damped spring that chases a target value every frame.
 *
 * IMPORTANT: This hook is the ONLY thing that moves `current` toward `target`.
 * No scroll handler or nav click should ever write directly to `current`.
 * Input sets `target`; the spring sets `current`. Always.
 *
 * @param target   The ref holding the desired value to move toward
 * @param stiffness  Spring stiffness constant (higher = snappier)
 * @param damping    Spring damping constant (tune to avoid overshoot)
 */
export function useDampedSpring(
  target: React.MutableRefObject<number>,
  stiffness = 120,
  damping = 20
): React.MutableRefObject<number> {
  const current = useRef(target.current)
  const velocity = useRef(0)

  useFrame((_, delta) => {
    // Clamp delta to avoid huge jumps after tab-switch/freeze
    const dt = Math.min(delta, 0.05)

    const curr = current.current
    const tgt = target.current
    const vel = velocity.current

    // Critically-damped spring integration (semi-implicit Euler)
    const springForce = -stiffness * (curr - tgt)
    const dampingForce = -damping * vel
    const acceleration = springForce + dampingForce

    velocity.current = vel + acceleration * dt
    current.current = curr + velocity.current * dt
  })

  return current
}
