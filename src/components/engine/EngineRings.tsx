"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EngineRingsProps {
  progress: number;
}

export const ANCHOR_DATA: { pos: [number, number, number]; color: string; name: string }[] = [
  { pos: [4.2 * Math.cos(0), Math.sin(0 * 0.5) * 0.3, 4.2 * Math.sin(0)], color: "#f59e0b", name: "MenuNova" },
  { pos: [4.2 * Math.cos((1 / 5) * Math.PI * 2), Math.sin((1 / 5) * Math.PI * 2 * 0.5) * 0.3, 4.2 * Math.sin((1 / 5) * Math.PI * 2)], color: "#6366f1", name: "Nova" },
  { pos: [4.2 * Math.cos((2 / 5) * Math.PI * 2), Math.sin((2 / 5) * Math.PI * 2 * 0.5) * 0.3, 4.2 * Math.sin((2 / 5) * Math.PI * 2)], color: "#38bdf8", name: "Gesture" },
  { pos: [4.2 * Math.cos((3 / 5) * Math.PI * 2), Math.sin((3 / 5) * Math.PI * 2 * 0.5) * 0.3, 4.2 * Math.sin((3 / 5) * Math.PI * 2)], color: "#10b981", name: "Dustbin" },
  { pos: [4.2 * Math.cos((4 / 5) * Math.PI * 2), Math.sin((4 / 5) * Math.PI * 2 * 0.5) * 0.3, 4.2 * Math.sin((4 / 5) * Math.PI * 2)], color: "rgba(255,255,255,0.4)", name: "Next" },
];

export function EngineRings({ progress }: EngineRingsProps) {
  const ring1Ref = useRef<THREE.Group>(null!);
  const ring2Ref = useRef<THREE.Group>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);
  const nodesRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    // Precise frame-rate independent rotation
    const rSpeed = delta * 60;
    if (ring1Ref.current) ring1Ref.current.rotation.y += 0.012 * rSpeed;
    if (ring2Ref.current) ring2Ref.current.rotation.y -= 0.008 * rSpeed;
    if (ring3Ref.current) ring3Ref.current.rotation.y += 0.003 * rSpeed;

    if (nodesRef.current) {
      nodesRef.current.rotation.y -= 0.008 * rSpeed;
    }
  });

  const ringOpacity = 0.3 + progress * 0.7;

  return (
    <group>
      {/* ── Ring 1: Inner (Amber) ── */}
      <group ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        {/* Core Wire Torus */}
        <mesh>
          <torusGeometry args={[2.0, 0.018, 8, 120]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={ringOpacity * 0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Glow Duplicate (Torus Bloom) */}
        <mesh>
          <torusGeometry args={[2.0, 0.06, 8, 80]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={ringOpacity * 0.06}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ── Ring 2: Mid (Indigo) ── */}
      <group ref={ring2Ref} rotation={[-Math.PI / 4, 0, Math.PI / 9]}>
        <mesh>
          <torusGeometry args={[3.0, 0.012, 8, 96]} />
          <meshBasicMaterial
            color="#6366f1"
            transparent
            opacity={ringOpacity * 0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 6 energy nodes orbiting on Ring 2 */}
      <group ref={nodesRef} rotation={[-Math.PI / 4, 0, Math.PI / 9]}>
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = 3.0 * Math.cos(angle);
          const z = 3.0 * Math.sin(angle);
          return (
            <group key={i} position={[x, 0, z]}>
              <mesh>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#a5b4fc" />
              </mesh>
              {/* Node soft halo */}
              <mesh>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ── Ring 3: Outer (Cyan) ── */}
      <mesh ref={ring3Ref} rotation={[Math.PI / 9, 0, -Math.PI / 18]}>
        <torusGeometry args={[4.2, 0.008, 8, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={ringOpacity * 0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 5 Project Anchor Points (Fixed in World Space) */}
      {ANCHOR_DATA.map((anchor, i) => (
        <group key={i} position={anchor.pos}>
          {/* Solid Point */}
          <mesh>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color={anchor.color} transparent opacity={0.3 + progress * 0.7} />
          </mesh>
          {/* Ring halo */}
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial color={anchor.color} transparent opacity={0.1 * progress} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
