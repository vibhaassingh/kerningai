"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Props = {
  nodeCount?: number;
  connectRadius?: number;
};

/**
 * OntologyGraph — constellation of nodes connected by hairline edges,
 * slowly rotating. Reads as a knowledge graph rather than a generic
 * particle blob. Designed to be cheap on the GPU: a single Points draw
 * for nodes, a single LineSegments draw for edges, and a small dust
 * layer. Uniforms updated at most once per frame; no per-frame attribute
 * uploads.
 */
export function OntologyGraph({ nodeCount = 48, connectRadius = 1.0 }: Props) {
  const group = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const nodeMatRef = useRef<THREE.ShaderMaterial>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const dustMatRef = useRef<THREE.PointsMaterial>(null);
  const { viewport } = useThree();

  const pointer = useRef(new THREE.Vector2(0, 0));
  const pointerLerp = useRef(new THREE.Vector2(0, 0));
  const scrollProgress = useRef(0);

  const { positions, sizes, edgePositions } = useMemo(() => {
    const positions = new Float32Array(nodeCount * 3);
    const sizes = new Float32Array(nodeCount);

    let seed = 47;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < nodeCount; i++) {
      const u = rand();
      const v = rand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = Math.pow(rand(), 0.6) * 1.6;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta) * 1.6;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.95;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.9;
      sizes[i] = 0.4 + rand() * 1.4;
    }

    const edges: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const ax = positions[i * 3 + 0];
      const ay = positions[i * 3 + 1];
      const az = positions[i * 3 + 2];
      const candidates: { j: number; d: number }[] = [];
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = positions[j * 3 + 0] - ax;
        const dy = positions[j * 3 + 1] - ay;
        const dz = positions[j * 3 + 2] - az;
        const d = Math.hypot(dx, dy, dz);
        if (d < connectRadius) candidates.push({ j, d });
      }
      candidates.sort((a, b) => a.d - b.d);
      candidates.slice(0, 2).forEach(({ j }) => {
        edges.push(i, j);
      });
    }

    const edgePositions = new Float32Array(edges.length * 3);
    edges.forEach((idx, k) => {
      edgePositions[k * 3 + 0] = positions[idx * 3 + 0];
      edgePositions[k * 3 + 1] = positions[idx * 3 + 1];
      edgePositions[k * 3 + 2] = positions[idx * 3 + 2];
    });

    return { positions, sizes, edgePositions };
  }, [nodeCount, connectRadius]);

  const dust = useMemo(() => {
    const count = 140;
    const arr = new Float32Array(count * 3);
    let s = 91;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (rand() - 0.5) * 8;
      arr[i * 3 + 1] = (rand() - 0.5) * 5;
      arr[i * 3 + 2] = (rand() - 0.5) * 4 - 1;
    }
    return arr;
  }, []);

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, sizes]);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(edgePositions, 3));
    return g;
  }, [edgePositions]);

  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(dust, 3));
    return g;
  }, [dust]);

  const nodeUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      // Stark white wireframe — telemetry constellation, no chroma.
      uColor: { value: new THREE.Color("#ffffff") },
      uColorBright: { value: new THREE.Color("#ffffff") },
    }),
    [],
  );

  // Throttle scroll-progress reads to once per frame (cheap getter, but
  // we keep the value in a ref so React doesn't re-render).
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const px = (state.pointer.x * viewport.width) / 2;
    const py = (state.pointer.y * viewport.height) / 2;
    pointer.current.set(px, py);
    pointerLerp.current.lerp(pointer.current, 0.06);

    if (typeof window !== "undefined") {
      scrollProgress.current = Math.min(
        1,
        Math.max(0, window.scrollY / window.innerHeight),
      );
    }

    if (group.current) {
      group.current.rotation.y = t * 0.05 + pointerLerp.current.x * 0.05;
      group.current.rotation.x =
        Math.sin(t * 0.07) * 0.06 + pointerLerp.current.y * 0.03;
      const s = 1 + scrollProgress.current * 0.3;
      group.current.scale.set(s, s, s);
      group.current.position.y = -scrollProgress.current * 0.5;
    }

    if (nodeMatRef.current) {
      nodeMatRef.current.uniforms.uTime.value = t;
      nodeMatRef.current.uniforms.uPointer.value.copy(pointerLerp.current);
    }

    if (lineMatRef.current) {
      lineMatRef.current.opacity = 0.16 * (1 - scrollProgress.current * 0.6);
    }

    if (dustRef.current) {
      dustRef.current.rotation.y -= delta * 0.015;
    }
    if (dustMatRef.current) {
      dustMatRef.current.opacity = 0.32 * (1 - scrollProgress.current * 0.5);
    }
  });

  return (
    <>
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          ref={dustMatRef}
          color="#ffffff"
          size={0.014}
          sizeAttenuation
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      <group ref={group}>
        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial
            ref={lineMatRef}
            color="#ffffff"
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </lineSegments>

        <points geometry={nodeGeo}>
          <shaderMaterial
            ref={nodeMatRef}
            uniforms={nodeUniforms}
            vertexShader={NODE_VERT}
            fragmentShader={NODE_FRAG}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </>
  );
}

const NODE_VERT = /* glsl */ `
uniform float uTime;
uniform vec2 uPointer;

attribute float aSize;
varying float vDepth;
varying float vHover;

void main() {
  vec3 pos = position;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  vDepth = -mv.z;

  float pulse = 0.5 + 0.5 * sin(uTime * 1.2 + position.x * 3.0 + position.y * 2.0);

  vec2 screen = vec2(pos.x, pos.y);
  float d = distance(screen, uPointer);
  vHover = smoothstep(0.9, 0.0, d);

  float size = aSize * (4.0 + pulse * 1.6 + vHover * 7.0);
  gl_PointSize = size * (260.0 / vDepth);
}
`;

const NODE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uColorBright;
varying float vDepth;
varying float vHover;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.18, 0.0, d);
  float halo = smoothstep(0.5, 0.18, d) * 0.5;

  vec3 col = mix(uColor, uColorBright, vHover);
  float alpha = (core + halo * 0.6) * (0.5 + vHover * 0.45);

  float fog = smoothstep(8.0, 1.5, vDepth);
  alpha *= 0.55 + 0.55 * fog;

  gl_FragColor = vec4(col, alpha);
}
`;
