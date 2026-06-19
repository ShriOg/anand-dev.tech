"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EngineRings, ANCHOR_DATA } from "./EngineRings";
import { ParticleCorona } from "./ParticleCorona";
import { EnergyPaths } from "./EnergyPaths";

interface BuilderEngineProps {
  progress: number;
}

export function BuilderEngine({ progress }: BuilderEngineProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const coreRef  = useRef<THREE.Mesh>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Track mouse coordinates on window for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    // Parallax mouse rotation lerp
    if (groupRef.current) {
      const targetRX = mouseRef.current.y * 0.15;
      const targetRY = mouseRef.current.x * 0.15;
      
      groupRef.current.rotation.x += (targetRX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetRY - groupRef.current.rotation.y) * 0.05;
    }

    // Core sphere rotation
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.004 * delta * 60;
      coreRef.current.rotation.z += 0.002 * delta * 60;
      
      // Heartbeat pulse size
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 2.5) * 0.03;
      coreRef.current.scale.setScalar(pulse);

      if (coreRef.current.material instanceof THREE.MeshStandardMaterial) {
        coreRef.current.material.emissiveIntensity = 0.6 + progress * 0.8;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Lighting (Cinematic Sun & Fill Setup) ── */}
      {/* Sun PointLight — creates dramatic light/shadow side */}
      <pointLight
        position={[10, 8, 5]}
        color="#fff0e0"
        intensity={3.5}
        distance={45}
      />
      {/* Core PointLight */}
      <pointLight
        position={[0, 0, 0]}
        color="#6366f1"
        intensity={2.0 + progress * 2.5}
        distance={15}
      />
      {/* Fill Light (dark blue) to prevent pure black shadows */}
      <pointLight
        position={[-8, -4, -3]}
        color="#0d1a4a"
        intensity={1.2}
        distance={40}
      />

      {/* ── Core marble sphere ── */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.0, 64, 64]} />
        <meshStandardMaterial
          color="#1a0a3a"
          emissive="#4338ca"
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Atmosphere shell / planet glow halo */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.08 + progress * 0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Fake Volumetric Bloom Layers */}
      <mesh>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.04}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.015}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ── Ring system ── */}
      <EngineRings progress={progress} />

      {/* ── Energy paths ── */}
      <EnergyPaths progress={progress} anchors={ANCHOR_DATA} />

      {/* ── Particle fireflies ── */}
      <ParticleCorona progress={progress} />
    </group>
  );
}
