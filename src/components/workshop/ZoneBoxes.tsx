'use client'

// Zone markers — small glowing cubes at zone-centre positions.
// With architecture now providing the spatial context, these only need
// to serve as orientation beacons so zones are identifiable while testing.
// Kept deliberately small so they don't compete with the architecture.

interface ZoneMarker {
  name: string
  position: [number, number, number]
  color: string
  emissive: string
}

const ZONE_MARKERS: ZoneMarker[] = [
  {
    name: 'Entrance',
    position: [0,    0.5,  2],      // centre of entrance zone, on floor
    color: '#c8842a',
    emissive: '#c8641a',
  },
  {
    name: 'Workbench',
    position: [-2.5, 0.5, -1],
    color: '#2a6bc8',
    emissive: '#1a50c0',
  },
  {
    name: 'Creations',
    position: [2.5,  0.5, -5],
    color: '#2ab87a',
    emissive: '#1aaa60',
  },
  {
    name: 'Mindset',
    position: [-1,   0.5, -12],
    color: '#9b6bc8',
    emissive: '#7a4ab0',
  },
  {
    name: 'Window',
    position: [0,    0.5, -21],
    color: '#a0c8e8',
    emissive: '#6090d0',
  },
]

// Nova's Desk sphere has moved to NovaPresence.tsx

export function ZoneBoxes() {
  return (
    <group>
      {/* Small glowing zone markers */}
      {ZONE_MARKERS.map((m) => (
        <group key={m.name} position={m.position}>
          <mesh>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial
              color={m.color}
              emissive={m.emissive}
              emissiveIntensity={1.8}
              roughness={0.3}
              metalness={0.2}
            />
          </mesh>
          {/* Subtle floor glow disc under each marker */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.17, 0]}>
            <circleGeometry args={[0.5, 24]} />
            <meshStandardMaterial
              color={m.color}
              emissive={m.emissive}
              emissiveIntensity={0.6}
              transparent
              opacity={0.3}
              roughness={1}
            />
          </mesh>
        </group>
      ))}

    </group>
  )
}

export { ZONE_MARKERS }
