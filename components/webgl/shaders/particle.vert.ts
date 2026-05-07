export const particleVertexShader = /* glsl */ `
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uScrollProgress;
uniform float uSize;

attribute float aSeed;
attribute float aScale;

varying float vDepth;
varying float vSeed;

vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m*m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 curlNoise(vec3 p){
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 p_x0 = p - dx; vec3 p_x1 = p + dx;
  vec3 p_y0 = p - dy; vec3 p_y1 = p + dy;
  vec3 p_z0 = p - dz; vec3 p_z1 = p + dz;

  float x = snoise(p_y1) - snoise(p_y0) - snoise(p_z1) + snoise(p_z0);
  float y = snoise(p_z1) - snoise(p_z0) - snoise(p_x1) + snoise(p_x0);
  float z = snoise(p_x1) - snoise(p_x0) - snoise(p_y1) + snoise(p_y0);

  const float divisor = 1.0 / (2.0 * e);
  return normalize(vec3(x, y, z) * divisor);
}

void main() {
  vSeed = aSeed;

  float t = uTime * 0.07;
  vec3 basePos = position;
  vec3 curl = curlNoise(basePos * 0.55 + vec3(t, t * 0.9, t * 1.1));
  vec3 displaced = basePos + curl * 0.42 * (0.6 + 0.4 * sin(aSeed * 6.28 + uTime * 0.4));

  float scroll = clamp(uScrollProgress, 0.0, 1.0);
  displaced.x += scroll * 3.5 * (aSeed - 0.5);
  displaced.y *= 1.0 - scroll * 0.65;
  displaced.z *= 1.0 - scroll * 0.4;

  vec3 toPointer = displaced - vec3(uPointer * 1.6, 0.0);
  float dist = length(toPointer.xy);
  float push = exp(-dist * 1.4) * uPointerStrength;
  displaced += normalize(vec3(toPointer.xy, 0.001)) * push * 0.3;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vDepth = -mvPosition.z;
  gl_PointSize = uSize * aScale * (300.0 / vDepth);
}
`;
