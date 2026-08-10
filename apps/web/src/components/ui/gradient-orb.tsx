"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

/**
 * Configuration options for the gradient orb.
 * All fields are optional and fall back to sensible defaults.
 */
export type GradientOrbConfig = {
  /** Hue rotation in degrees applied to all gradient colors. @default 0 */
  hue?: number;
  /** Constant rotation speed of the orb (radians/sec). @default 0.28 */
  rotationSpeed?: number;
  /** Scale of the noise pattern inside the orb. @default 0.7 */
  noiseScale?: number;
  /** Inner radius of the orb glow (0–1). @default 0.18 */
  innerRadius?: number;
  /**
   * How large the orb appears inside its container.
   * Lower = bigger (zooms the shader). @default 0.68
   */
  orbScale?: number;
  /** Optional RGB color overrides. When omitted, colors are derived from theme `--primary`. */
  colors?: [THREE.ColorRepresentation, THREE.ColorRepresentation, THREE.ColorRepresentation];
};

const defaults = {
  hue: 0,
  rotationSpeed: 0.28,
  noiseScale: 0.7,
  innerRadius: 0.18,
  orbScale: 0.68,
} as const;

type ResolvedConfig = Required<Omit<GradientOrbConfig, "colors">> & {
  color0: THREE.Vector3;
  color1: THREE.Vector3;
  color2: THREE.Vector3;
};

type Rgba = { r: number; g: number; b: number; a: number };

/** Normalize any CSS color (hex / rgb / oklch) via a 1×1 canvas. */
function normalizeCssColor(input: string): Rgba | null {
  const raw = input.trim();
  if (!raw || raw === "transparent") return null;
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000000";
  ctx.fillStyle = raw;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return { r: r! / 255, g: g! / 255, b: b! / 255, a: a! / 255 };
}

function parseCssColorToVec3(input: string, fallback: THREE.Vector3): THREE.Vector3 {
  const rgb = normalizeCssColor(input);
  if (!rgb || rgb.a < 0.05) return fallback.clone();
  return new THREE.Vector3(rgb.r, rgb.g, rgb.b);
}

function lighten(v: THREE.Vector3, amount: number): THREE.Vector3 {
  return new THREE.Vector3(
    THREE.MathUtils.clamp(v.x + (1 - v.x) * amount, 0, 1),
    THREE.MathUtils.clamp(v.y + (1 - v.y) * amount, 0, 1),
    THREE.MathUtils.clamp(v.z + (1 - v.z) * amount, 0, 1),
  );
}

function resolveThemeColors(
  colors?: GradientOrbConfig["colors"],
): Pick<ResolvedConfig, "color0" | "color1" | "color2"> {
  const primaryFallback = new THREE.Vector3(0.22, 0.714, 1); // #38b6ff

  if (colors && colors.length === 3) {
    return {
      color0: parseCssColorToVec3(String(colors[0]), primaryFallback),
      color1: parseCssColorToVec3(String(colors[1]), lighten(primaryFallback, 0.25)),
      color2: parseCssColorToVec3(String(colors[2]), lighten(primaryFallback, 0.55)),
    };
  }

  if (typeof window === "undefined") {
    return {
      color0: primaryFallback.clone(),
      color1: lighten(primaryFallback, 0.2),
      color2: lighten(primaryFallback, 0.55),
    };
  }

  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue("--primary").trim() || "#38b6ff";
  const color0 = parseCssColorToVec3(primary, primaryFallback);
  return {
    color0,
    color1: lighten(color0, 0.18),
    color2: lighten(color0, 0.58),
  };
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float iTime;
  uniform vec3 iResolution;
  uniform float hue;
  uniform float rot;
  uniform float noiseScale;
  uniform float innerRadius;
  uniform float orbScale;
  uniform vec3 uColor0;
  uniform vec3 uColor1;
  uniform vec3 uColor2;

  varying vec2 vUv;

  vec3 rgb2yiq(vec3 c) {
    return vec3(
      dot(c, vec3(0.299, 0.587, 0.114)),
      dot(c, vec3(0.596, -0.274, -0.322)),
      dot(c, vec3(0.211, -0.523, 0.312))
    );
  }

  vec3 yiq2rgb(vec3 c) {
    return vec3(
      c.x + 0.956 * c.y + 0.621 * c.z,
      c.x - 0.272 * c.y - 0.647 * c.z,
      c.x - 1.106 * c.y + 1.703 * c.z
    );
  }

  vec3 adjustHue(vec3 color, float hueDeg) {
    float hueRad = radians(hueDeg);
    vec3 yiq = rgb2yiq(color);
    float cosA = cos(hueRad);
    float sinA = sin(hueRad);
    yiq.yz = vec2(yiq.y * cosA - yiq.z * sinA, yiq.y * sinA + yiq.z * cosA);
    return yiq2rgb(yiq);
  }

  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
  }

  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(
      dot(d0, hash33(i)),
      dot(d1, hash33(i + i1)),
      dot(d2, hash33(i + i2)),
      dot(d3, hash33(i + 1.0))
    );
    return dot(vec4(31.316), n);
  }

  float light1(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * attenuation);
  }

  float light2(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * dist * attenuation);
  }

  vec4 draw(vec2 uv) {
    vec3 color0 = adjustHue(uColor0, hue);
    vec3 color1 = adjustHue(uColor1, hue);
    vec3 color2 = adjustHue(uColor2, hue);
    vec3 colorCore = vec3(1.0);

    float len = length(uv);
    float invLen = len > 0.0 ? 1.0 / len : 0.0;

    float pulse = sin(iTime * 1.35) * 0.012;
    float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.45)) * 0.5 + 0.5;

    float r0 = mix(mix(innerRadius + pulse, 0.72, 0.4), mix(innerRadius + pulse, 0.72, 0.62), n0);

    float d0 = distance(uv, (r0 * invLen) * uv);
    float v0 = light1(1.15, 10.0, d0);
    v0 *= smoothstep(r0 * 1.02, r0 * 0.86, len);
    float cl = cos(atan(uv.y, uv.x) + iTime * 1.75) * 0.5 + 0.5;

    float a = iTime * -0.9;
    vec2 pos = vec2(cos(a), sin(a)) * r0 * 0.78;
    float d = distance(uv, pos);
    float v1 = light2(0.65, 7.0, d);
    v1 *= light1(1.0, 45.0, d0);

    float body = smoothstep(0.7, 0.16, len);
    float halo = exp(-4.0 * len * len) * (0.5 + 0.18 * n0);

    vec3 swirl = mix(color1, color2, cl);
    swirl = mix(swirl, color0, n0);

    vec3 col = mix(colorCore, swirl, clamp(v0, 0.0, 1.0));
    col += color2 * v1 * 0.25;
    col = mix(color0, col, body);
    col = clamp(col, 0.0, 1.0);

    float alpha = clamp(body * 0.98 + halo * 0.65, 0.0, 1.0);
    alpha *= smoothstep(0.98, 0.42, len);
    return vec4(col, alpha);
  }

  void main() {
    vec2 center = iResolution.xy * 0.5;
    float size = min(iResolution.x, iResolution.y);
    // orbScale < 1 zooms the orb so it fills more of the same container
    vec2 uv = (vUv * iResolution.xy - center) / size * 2.0 * orbScale;

    float s = sin(rot);
    float c = cos(rot);
    uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

    vec4 col = draw(uv);
    // Premultiplied alpha — required for clean transparent canvas edges
    gl_FragColor = vec4(col.rgb * col.a, col.a);
  }
`;

function GradientScene({ config }: { config: ResolvedConfig }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport, gl, scene } = useThree();
  const rotRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    gl.setClearColor(0x000000, 0);
    scene.background = null;
  }, [gl, scene]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    return geo;
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(size.width, size.height, 1) },
      hue: { value: config.hue },
      rot: { value: 0 },
      noiseScale: { value: config.noiseScale },
      innerRadius: { value: config.innerRadius },
      orbScale: { value: config.orbScale },
      uColor0: { value: config.color0.clone() },
      uColor1: { value: config.color1.clone() },
      uColor2: { value: config.color2.clone() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  );

  useFrame((state) => {
    if (!materialRef.current) return;

    const t = state.clock.elapsedTime;
    const dt = t - lastTimeRef.current;
    lastTimeRef.current = t;

    rotRef.current += dt * config.rotationSpeed;

    const u = materialRef.current.uniforms;
    if (!u.iTime || !u.hue || !u.rot || !u.iResolution) return;
    u.iTime.value = t;
    u.hue.value = config.hue;
    u.rot.value = rotRef.current;
    u.noiseScale.value = config.noiseScale;
    u.innerRadius.value = config.innerRadius;
    u.orbScale.value = config.orbScale;
    u.uColor0.value.copy(config.color0);
    u.uColor1.value.copy(config.color1);
    u.uColor2.value.copy(config.color2);
    u.iResolution.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
      size.width / size.height,
    );
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.CustomBlending}
        blendSrc={THREE.OneFactor}
        blendDst={THREE.OneMinusSrcAlphaFactor}
        blendSrcAlpha={THREE.OneFactor}
        blendDstAlpha={THREE.OneMinusSrcAlphaFactor}
      />
    </mesh>
  );
}

/**
 * Transparent glowing orb that composites over the parent background.
 * Theme primary drives the orb colors; canvas itself has no backdrop.
 */
export function GradientOrb({
  config: configOverrides,
  className = "",
}: {
  config?: GradientOrbConfig;
  className?: string;
}) {
  const themeMode = usePreferencesStore((s) => s.themeMode);

  const config = useMemo(() => {
    const themeColors = resolveThemeColors(configOverrides?.colors);
    return {
      ...defaults,
      ...configOverrides,
      ...themeColors,
    } satisfies ResolvedConfig;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configOverrides), themeMode]);

  return (
    <div className={`h-full w-full bg-transparent ${className}`}>
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <GradientScene config={config} />
      </Canvas>
    </div>
  );
}

export default GradientOrb;
