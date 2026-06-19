"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleCoronaProps {
  progress: number;
}

// Custom Shader for the Firefly Particle system
const FireflyShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aRandomSize;
    varying vec3 vColor;
    varying float vOpacity;

    void main() {
      vec3 pos = position;
      
      // Sine-wave float drift on Y-axis
      pos.y += sin(uTime * aSpeed + aPhase) * 0.35;
      pos.x += cos(uTime * (aSpeed * 0.5) + aPhase) * 0.15;
      
      // Expand shell with scroll progress
      float dist = length(pos);
      vec3 dir = normalize(pos);
      pos += dir * (uProgress * 1.5);

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Color mapping: Warm gold near core, cool blue far away
      float normDist = clamp((dist - 3.5) / 4.0, 0.0, 1.0);
      vec3 warmGold = vec3(1.0, 0.83, 0.5); // #ffd580
      vec3 coolBlue = vec3(0.77, 0.83, 1.0); // #c4d4ff
      vColor = mix(warmGold, coolBlue, normDist);

      // Opacity drops with distance
      vOpacity = mix(0.7, 0.15, normDist) * (0.3 + uProgress * 0.7);

      // Attenuate size by distance to camera
      gl_PointSize = aRandomSize * (300.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vOpacity;

    void main() {
      // Round particle shape
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      // Soft radial falloff for "firefly" bloom look
      float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
};

export function ParticleCorona({ progress }: ParticleCoronaProps) {
  const meshRef = useRef<THREE.Points>(null!);
  const count = 2500;

  const { positions, phases, speeds, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sp = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Shell r = 3.5 to 7.0
      const r = 3.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      ph[i] = Math.random() * Math.PI * 2;
      sp[i] = 0.4 + Math.random() * 0.8;
      sz[i] = 1.0 + Math.random() * 2.0; // random sizes 1.0–3.0
    }

    return { positions: pos, phases: ph, speeds: sp, sizes: sz };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.uTime.value = state.clock.getElapsedTime();
        mat.uniforms.uProgress.value = progress;
      }
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          args={[speeds, 1]}
        />
        <bufferAttribute
          attach="attributes-aRandomSize"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={FireflyShader.vertexShader}
        fragmentShader={FireflyShader.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
