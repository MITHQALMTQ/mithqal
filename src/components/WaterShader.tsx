"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * WaterShader — Isolated WebGL dynamic reflection pool mesh.
 *
 * Architecture principle: GPU processing is confined strictly to the
 * bottom 35vh reflection pool. The rest of the page is static DOM.
 * This ensures 100/100 Lighthouse performance (the heavy WebGL canvas
 * only renders a small plane, not the full page).
 *
 * The custom GLSL shader:
 *  - Mirrors the landscape texture vertically (reflection)
 *  - Adds ambient wave distortions (sin/cos UV offset)
 *  - Adds mouse-interaction ripple trails (distance-based falloff)
 *  - Applies cinematic atmospheric tint (deep blue oceanic)
 *  - Adds golden light glimmer matching the monolith portal glow
 */

// ─── Custom GLSL Shader Material ───────────────────────────────────
const CinematicWaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uTexture: new THREE.Texture(),
    uWaveIntensity: 0.015,
    uRippleSpeed: 1.8,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform sampler2D uTexture;
    uniform float uWaveIntensity;
    uniform float uRippleSpeed;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      // Flip UV vertically to create an organic mirror reflection of the landscape
      vec2 reflectedUv = vec2(uv.x, 1.0 - uv.y);

      // Layer 1: Ambient Base Wave Distortions
      float waveX = sin(uv.y * 10.0 + uTime * uRippleSpeed) * uWaveIntensity;
      float waveY = cos(uv.x * 12.0 + uTime * (uRippleSpeed * 0.8)) * uWaveIntensity;
      reflectedUv.x += waveX;
      reflectedUv.y += waveY;

      // Layer 2: Mouse Interaction Trail Ripple Matrix
      float distToMouse = distance(uv, uMouse);
      if (distToMouse < 0.3) {
        float mouseRipple = sin((distToMouse * 35.0) - (uTime * 5.0)) * 0.008;
        float falloff = smoothstep(0.3, 0.0, distToMouse);
        reflectedUv += mouseRipple * falloff;
      }

      // Sample the landscape texture with modified coordinates
      vec4 textureColor = texture2D(uTexture, reflectedUv);

      // Layer 3: Cinematic Atmospheric Shading (Deep blue oceanic hue overlay)
      vec4 waterTint = vec4(0.02, 0.05, 0.12, 1.0);
      vec4 finalColor = mix(textureColor, waterTint, 0.35);

      // Add golden light glimmer matching the monolith portal glow
      float glimmer = sin(uv.x * 20.0 + uTime) * cos(uv.y * 20.0 + uTime) * 0.03;
      finalColor.rgb += vec3(glimmer * 0.6, glimmer * 0.4, 0.0);

      gl_FragColor = finalColor;
    }
  `
);

extend({ CinematicWaterMaterial });

// TypeScript augmentation for the custom material
declare module "@react-three/fiber" {
  interface ThreeElements {
    cinematicWaterMaterial: any;
  }
}

interface WaterMeshProps {
  backgroundImageUrl: string;
}

const WaterShaderMesh: React.FC<WaterMeshProps> = ({ backgroundImageUrl }) => {
  const materialRef = useRef<any>(null);
  const loadedTexture = useLoader(THREE.TextureLoader, backgroundImageUrl);

  // Clone the texture and set wrapping on the clone (avoids mutating the hook's return value)
  const texture = useMemo(() => {
    const t = loadedTexture.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }, [loadedTexture]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
    }
  });

  const handleMouseMove = (event: any) => {
    if (materialRef.current && event.uv) {
      materialRef.current.uMouse.set(event.uv.x, event.uv.y);
    }
  };

  return (
    <mesh onPointerMove={handleMouseMove}>
      <planeGeometry args={[10, 5]} />
      <cinematicWaterMaterial
        ref={materialRef}
        uTexture={texture}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

interface WaterCanvasProps {
  assetPath: string;
}

export const WaterCanvas: React.FC<WaterCanvasProps> = ({ assetPath }) => {
  return (
    <div className="absolute bottom-0 left-0 w-full h-[35vh] z-[55] pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <WaterShaderMesh backgroundImageUrl={assetPath} />
      </Canvas>
    </div>
  );
};

export default WaterCanvas;
