"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Edges } from "@react-three/drei";
import { useState, Suspense } from "react";
import * as THREE from "three";

/**
 * Architecture3D — Interactive 3D isometric architecture explorer.
 *
 * Phase 3 algorithmic differentiator: transforms the static 2D architecture
 * diagram into a 3D R3F canvas where users can orbit/zoom and hover each
 * layer to see details.
 *
 * 4 layers (bottom to top):
 *   1. Participants (banks, institutions, regulators)
 *   2. Control Plane (MITHQAL orchestration)
 *   3. Settlement Rails (SWIFT, RTGS, tokenized)
 *   4. Evidence Layer (audit, attestation, traceability)
 *
 * Performance: canvas is 400px tall, contained (not full-page).
 * OrbitControls with damping for smooth interaction.
 */

interface LayerData {
  name: string;
  y: number;
  color: string;
  desc: string;
}

const LAYERS: LayerData[] = [
  { name: "Participants", y: 0, color: "#1a2a4a", desc: "Banks, institutions, regulators" },
  { name: "Control Plane", y: 1.2, color: "#D4AF37", desc: "MITHQAL orchestration" },
  { name: "Settlement Rails", y: 2.4, color: "#2a3a5a", desc: "SWIFT, RTGS, tokenized" },
  { name: "Evidence Layer", y: 3.6, color: "#1a3a2a", desc: "Audit, attestation, traceability" },
];

function Layer({ data, isHovered, onHover }: { data: LayerData; isHovered: boolean; onHover: (name: string | null) => void }) {
  return (
    <group position={[0, data.y, 0]}>
      {/* Box geometry */}
      <mesh
        onPointerOver={() => onHover(data.name)}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[4, 0.6, 3]} />
        <meshStandardMaterial
          color={data.color}
          transparent
          opacity={isHovered ? 0.7 : 0.4}
          metalness={0.6}
          roughness={0.3}
        />
        <Edges color={data.name === "Control Plane" ? "#F3C879" : "#D4AF37"} />
      </mesh>
      {/* Layer label */}
      <Text
        position={[0, 0, 1.6]}
        fontSize={0.25}
        color="#D4AF37"
        anchorX="center"
        anchorY="middle"
      >
        {data.name}
      </Text>
    </group>
  );
}

function Scene({ onHover }: { onHover: (name: string | null) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#D4AF37" />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#4488ff" />

      {LAYERS.map((layer) => (
        <Layer
          key={layer.name}
          data={layer}
          isHovered={hovered === layer.name}
          onHover={(name) => {
            setHovered(name);
            onHover(name);
          }}
        />
      ))}

      {/* Connecting lines between layers */}
      {LAYERS.slice(0, -1).map((layer, i) => (
        <group key={i}>
          <mesh position={[2.5, layer.y + 0.6, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
            <meshStandardMaterial color="#D4AF37" opacity={0.5} transparent />
          </mesh>
          <mesh position={[-2.5, layer.y + 0.6, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
            <meshStandardMaterial color="#D4AF37" opacity={0.5} transparent />
          </mesh>
        </group>
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export default function Architecture3D() {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const hoveredData = LAYERS.find((l) => l.name === hoveredLayer);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-amber-500/10 bg-gradient-to-b from-[#0a0e1a] to-[#07090e]">
      <Canvas camera={{ position: [6, 4, 6], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene onHover={setHoveredLayer} />
        </Suspense>
      </Canvas>

      {/* Hover tooltip */}
      {hoveredData && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-amber-500/20 rounded-xl px-4 py-3 pointer-events-none">
          <div className="text-sm font-semibold text-amber-400 mb-1">{hoveredData.name}</div>
          <div className="text-xs text-[#cbd5e1]">{hoveredData.desc}</div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 right-4 text-xs text-[#94a3b8] bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/5">
        🖱️ Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}
