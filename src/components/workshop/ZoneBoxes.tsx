'use client'

import * as THREE from 'three'

// Zone box definitions — one color per zone for orientation while testing.
// Positions match the floorplan from Section 18/20 of the brief.
// No materials beyond flat color; no textures. This is the prototype.

interface ZoneBox {
  name: string
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

const ZONE_BOXES: ZoneBox[] = [
  {
    name: 'Entrance',
    position: [0, 0.75, 0],
    size: [6, 1.5, 5],
    color: '#c8842a', // warm amber
  },
  {
    name: 'Workbench',
    position: [-3, 1.0, -4],
    size: [4, 2.0, 4],
    color: '#2a6bc8', // electric blue
  },
  {
    name: 'Creations',
    position: [3, 1.25, -8],
    size: [4, 2.5, 4],
    color: '#2ab87a', // soft green
  },
  {
    name: 'Mindset',
    position: [0, 1.5, -14],
    size: [5, 3.0, 3],
    color: '#9b6bc8', // lavender
  },
  {
    name: 'Window',
    position: [0, 2.0, -20],
    size: [8, 4.0, 1],
    color: '#c0dde8', // ice white / sky
  },
]

// Nova's Desk — a small sphere at the central position,
// visually distinct so its "always near" centrality can be felt
const NOVA_DESK = {
  position: [1.5, 1.0, -11] as [number, number, number],
  color: '#00e5ff', // cyan glow
}

function ZoneLabel({ text, position }: { text: string; position: [number, number, number] }) {
  // Simple floating text implemented as a scaled thin box with no text renderer
  // (Text rendering requires @react-three/drei's <Text>, which we'll use)
  return null // labels rendered via HTML overlay in WorkshopScene
}

export function ZoneBoxes() {
  return (
    <group>
      {/* Floor plane — gives spatial grounding */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -10]}>
        <planeGeometry args={[20, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>

      {/* Zone placeholder boxes */}
      {ZONE_BOXES.map((zone) => (
        <group key={zone.name} position={zone.position}>
          <mesh>
            <boxGeometry args={zone.size} />
            <meshStandardMaterial
              color={zone.color}
              roughness={0.7}
              metalness={0.1}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Wireframe overlay for definition */}
          <mesh>
            <boxGeometry args={zone.size} />
            <meshBasicMaterial color={zone.color} wireframe />
          </mesh>
        </group>
      ))}

      {/* Nova's Desk marker — small sphere, always present */}
      <group position={NOVA_DESK.position}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={NOVA_DESK.color}
            emissive={NOVA_DESK.color}
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </mesh>
        {/* Glowing ring around Nova marker */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.04, 8, 32]} />
          <meshBasicMaterial color={NOVA_DESK.color} />
        </mesh>
      </group>

      {/* Ambient lights — enough to see the boxes */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow={false} />
      <pointLight position={[-3, 3, -4]} intensity={0.6} color="#4a8fff" />
      <pointLight position={[3, 3, -8]}  intensity={0.5} color="#50d890" />
      <pointLight position={[0, 3, -14]} intensity={0.5} color="#b07ae8" />
      <pointLight position={[1.5, 2, -11]} intensity={1.2} color="#00e5ff" distance={6} />
      <pointLight position={[0, 4, -20]} intensity={0.8} color="#a8d4f0" />
    </group>
  )
}

export { NOVA_DESK, ZONE_BOXES }
