"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface PlanetProps {
  color: string;
  emissiveColor: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  name: string;
  stack: string[];
  status: "live" | "wip";
  onSelect: () => void;
  hasRing?: boolean;
  shimmer?: boolean;
}

export function Planet({
  color,
  emissiveColor,
  radius,
  orbitRadius,
  orbitSpeed,
  name,
  stack,
  status,
  onSelect,
  hasRing = false,
  shimmer = false,
}: PlanetProps) {
  const orbitRef  = useRef<THREE.Group>(null!);
  const planetRef = useRef<THREE.Mesh>(null!);
  const atmoRef   = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const angleRef  = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    // Frame-rate independent orbit calculation
    angleRef.current += orbitSpeed * delta * 60;
    
    // Set position based on orbit radius and angle
    if (orbitRef.current) {
      orbitRef.current.position.x = orbitRadius * Math.cos(angleRef.current);
      orbitRef.current.position.z = orbitRadius * Math.sin(angleRef.current);
    }

    // Slow self-rotation
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.01 * delta * 60;
      
      // Organic shifting surface shimmer (displacement simulation)
      if (shimmer) {
        const time = state.clock.getElapsedTime();
        planetRef.current.scale.set(
          1 + Math.sin(time * 2.0) * 0.04,
          1 + Math.cos(time * 1.5) * 0.04,
          1 + Math.sin(time * 1.0) * 0.04
        );
      }
    }

    // Atmosphere pulsing
    if (atmoRef.current && atmoRef.current.material instanceof THREE.MeshBasicMaterial) {
      atmoRef.current.material.opacity = hovered
        ? 0.25
        : 0.12 + Math.sin(state.clock.getElapsedTime() * 2) * 0.02;
    }
  });

  return (
    <group ref={orbitRef}>
      {/* Atmosphere Glow Sphere (renders behind) */}
      <mesh ref={atmoRef}>
        <sphereGeometry args={[radius * 1.35, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Planet Mesh */}
      <mesh
        ref={planetRef}
        data-cursor="planet"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={onSelect}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={hovered ? 1.2 : 0.4}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* Saturn-style Rings (MenuNova specific) */}
      {hasRing && (
        <mesh rotation={[Math.PI / 2.6, 0.2, 0]}>
          <torusGeometry args={[radius * 1.6, 0.01, 8, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 0.9 : 0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Drei HTML Label with Depth Occlusion */}
      <Html
        center
        distanceFactor={9}
        position={[0, radius + 0.6, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            textAlign: "center",
            width: "max-content",
            transform: "translateY(-50%)",
          }}
        >
          {/* Status and Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 8px ${color}`,
                display: "inline-block",
                animation: "pulse 1.5s infinite alternate",
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "2px",
                color: color,
                textShadow: hovered ? `0 0 10px ${color}80` : "none",
                textTransform: "uppercase",
                transition: "text-shadow 0.2s",
              }}
            >
              {name}
            </span>
          </div>

          {/* Hover Stack Detail */}
          {hovered && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: "#e2e8f0",
                marginTop: "4px",
                background: "rgba(10, 15, 30, 0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "4px 8px",
                borderRadius: "4px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {stack.slice(0, 3).join(" · ")}
            </div>
          )}
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </Html>
    </group>
  );
}
