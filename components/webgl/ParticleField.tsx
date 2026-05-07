"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { particleVertexShader } from "./shaders/particle.vert";
import { particleFragmentShader } from "./shaders/particle.frag";

type ParticleFieldProps = {
  count: number;
  size: number;
};

export function ParticleField({ count, size }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const pointer = useRef(new THREE.Vector2(0, 0));
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const pointerStrength = useRef(0);
  const scrollProgress = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // distribute within a more compact ovoid, biased to the centre
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = Math.pow(Math.random(), 0.55) * 1.25;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3 + 0] = x * 1.15;
      positions[i * 3 + 1] = y * 0.7;
      positions[i * 3 + 2] = z;

      seeds[i] = Math.random();
      scales[i] = 0.5 + Math.random() * 0.7;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerStrength: { value: 0 },
      uScrollProgress: { value: 0 },
      uSize: { value: size },
      uColorA: { value: new THREE.Color("#d4b773") },
      uColorB: { value: new THREE.Color("#e4cf9a") },
    }),
    [size],
  );

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const px = (state.pointer.x * viewport.width) / 2;
    const py = (state.pointer.y * viewport.height) / 2;
    pointerTarget.current.set(px, py);

    pointer.current.lerp(pointerTarget.current, 0.08);
    pointerStrength.current += (1.0 - pointerStrength.current) * 0.04;

    scrollProgress.current = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));

    const mat = materialRef.current;
    mat.uniforms.uTime.value += delta;
    mat.uniforms.uPointer.value.set(pointer.current.x, pointer.current.y);
    mat.uniforms.uPointerStrength.value = pointerStrength.current;
    mat.uniforms.uScrollProgress.value = scrollProgress.current;

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.08;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
