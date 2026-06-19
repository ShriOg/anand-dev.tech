"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EnergyPathProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  duration: number;
  progress: number;
}

function SinglePath({ start, end, color, duration, progress }: EnergyPathProps) {
  const sphereRef = useRef<THREE.Mesh>(null!);

  // Curve definition: start (anchor) → middle control point → end (core)
  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    // Midpoint curved slightly upward/outward
    const midVec = new THREE.Vector3()
      .addVectors(startVec, endVec)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, 1.2, 0));

    return new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
  }, [start, end]);

  // Generate points for the path tube
  const pathGeometry = useMemo(() => {
    // Generate a simple thin tube representing the cable
    return new THREE.TubeGeometry(curve, 32, 0.005, 8, false);
  }, [curve]);

  useFrame(({ clock }) => {
    if (!sphereRef.current) return;
    const time = clock.getElapsedTime();
    // Loop normalized parameter t from 0 to 1 based on duration
    const t = (time % duration) / duration;

    // Get position on curve
    const pos = curve.getPointAt(t);
    sphereRef.current.position.copy(pos);
  });

  return (
    <group>
      {/* Curved glowing line */}
      <mesh geometry={pathGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18 * progress}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Traveling light node */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={progress}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

interface EnergyPathsProps {
  progress: number;
  anchors: { pos: [number, number, number]; color: string }[];
}

export function EnergyPaths({ progress, anchors }: EnergyPathsProps) {
  // Speed variations for each node
  const durations = [2.2, 1.8, 3.0, 2.6, 2.0];

  return (
    <group>
      {anchors.map((anchor, i) => (
        <SinglePath
          key={i}
          start={anchor.pos}
          end={[0, 0, 0]}
          color={anchor.color}
          duration={durations[i % durations.length]}
          progress={progress}
        />
      ))}
    </group>
  );
}
