'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export default function ViewportPanel() {
  return (
    <div className="w-[480px] min-w-[480px] h-full bg-[#0f172a] relative overflow-hidden">
      <Canvas
        camera={{ position: [4, 3, 6], fov: 50 }}
        style={{ background: '#0f172a' }}
      >
        <Suspense fallback={null}>
          <SceneLights />
          <GridFloor />
          <DemoShape />
          <OrbitControls enableDamping dampingFactor={0.08} />
        </Suspense>
      </Canvas>

      {/* XYZ Axis indicator */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <AxisIndicator />
      </div>
    </div>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#6688cc" />
    </>
  )
}

function GridFloor() {
  return (
    <Grid
      args={[30, 30]}
      cellSize={1}
      cellThickness={0.4}
      cellColor="#1e3a5f"
      sectionSize={5}
      sectionThickness={0.8}
      sectionColor="#1e3a5f"
      fadeDistance={25}
      fadeStrength={1}
      position={[0, -1.5, 0]}
      infiniteGrid
    />
  )
}

function DemoShape() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
      <boxGeometry args={[2, 2.5, 2]} />
      <meshStandardMaterial
        color="#1e293b"
        metalness={0.6}
        roughness={0.4}
      />
    </mesh>
  )
}

function AxisIndicator() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      {/* X axis - red */}
      <line x1="30" y1="30" x2="52" y2="42" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <circle cx="52" cy="42" r="4" fill="#ef4444" />
      <text x="54" y="47" fill="#ef4444" fontSize="9" fontFamily="monospace">X</text>

      {/* Y axis - green */}
      <line x1="30" y1="30" x2="30" y2="6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="6" r="4" fill="#22c55e" />
      <text x="33" y="5" fill="#22c55e" fontSize="9" fontFamily="monospace">Y</text>

      {/* Z axis - blue */}
      <line x1="30" y1="30" x2="8" y2="42" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="42" r="4" fill="#3b82f6" />
      <text x="0" y="56" fill="#3b82f6" fontSize="9" fontFamily="monospace">Z</text>
    </svg>
  )
}