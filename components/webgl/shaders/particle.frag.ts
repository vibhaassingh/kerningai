export const particleFragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;

varying float vDepth;
varying float vSeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  // Soft circular falloff
  float alpha = smoothstep(0.5, 0.05, d);

  // Bias colour mix toward the deeper accent so the field reads gold
  // rather than washing to white when many particles overlap.
  float mixVal = clamp(0.5 + 0.5 * sin(vSeed * 6.28 + uTime * 0.3), 0.0, 1.0);
  mixVal = pow(mixVal, 1.8);
  vec3 col = mix(uColorA, uColorB, mixVal * 0.4);

  // Subtle depth fog
  float fog = smoothstep(10.0, 2.0, vDepth);
  col *= 0.45 + 0.30 * fog;

  // Strongly damped overall alpha — additive blending stays atmospheric,
  // never blowing out the centre.
  gl_FragColor = vec4(col, alpha * (0.18 + 0.14 * fog));
}
`;
