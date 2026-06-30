'use client'

import { Suspense, useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { X, Save, Download, RotateCcw, ZoomIn, ZoomOut, Box, Grid3x3, Play, Square } from 'lucide-react'

export type ModelType = 'spur_gear' | 'helical_gear' | 'shaft' | 'bearing' | 'bolt' | 'cube' | 'rectangle' | 'sphere' | 'cylinder' | 'pharma_table' | 'pharma_chair' | 'empty'

export interface ShapeDimensions {
  width?: number; height?: number; depth?: number; radius?: number; length?: number
}

const F = "'DM Sans', 'Inter', system-ui, sans-serif"

function matProps(material: string) {
  switch (material) {
    case 'steel':       return { color: '#b8cdd8', metalness: 0.75, roughness: 0.30 }
    case 'steel_dark':  return { color: '#8aa0b0', metalness: 0.72, roughness: 0.38 }
    case 'alloy_steel': return { color: '#bec8d2', metalness: 0.74, roughness: 0.32 }
    case 'chromoly':    return { color: '#aabcc8', metalness: 0.74, roughness: 0.30 }
    case 'stainless':   return { color: '#ccd4dc', metalness: 0.70, roughness: 0.18 }
    case 'aluminium':   return { color: '#c8ccce', metalness: 0.68, roughness: 0.36 }
    case 'cast_iron':   return { color: '#626870', metalness: 0.50, roughness: 0.62 }
    default:            return { color: '#b4c4d0', metalness: 0.73, roughness: 0.30 }
  }
}

function InfiniteGrid({ visible }: { visible: boolean }) {
  if (!visible) return null
  return <gridHelper args={[100, 100, '#1e2d40', '#131f2e']} position={[0, -2.5, 0]} />
}

function makeGearGeo(teeth: number, innerR: number, outerR: number, depth: number) {
  const shape = new THREE.Shape()
  const toothW = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a0 = i * toothW, a1 = a0 + toothW * 0.25
    const a2 = a0 + toothW * 0.5, a3 = a0 + toothW * 0.75, a4 = a0 + toothW
    if (i === 0) shape.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR)
    else shape.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR)
    shape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR)
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR)
    shape.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR)
    shape.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR)
  }
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, innerR * 0.3, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 })
  geo.center(); geo.rotateX(Math.PI / 2)
  return geo
}

function SpurGearModel({ ar, wireframe, heatmap }: { ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.6 })
  const geo = useMemo(() => makeGearGeo(20, 1.0, 1.45, 0.5), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('chromoly') }), [])
  const mCrit = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0x440000, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.3 }), [])
  const mSafe = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x00cc44, emissive: 0x001a0a, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0.3 }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  return (
    <group ref={ref}>
      <mesh geometry={geo} material={heatmap ? mCrit : mat} />
      {heatmap && <mesh position={[0,0,0]}><cylinderGeometry args={[0.55, 0.55, 0.5, 32]} /><primitive object={mSafe} attach="material" /></mesh>}
    </group>
  )
}

function HelicalGearModel({ ar, wireframe, heatmap }: { ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.5 })
  const geo = useMemo(() => makeGearGeo(18, 1.0, 1.42, 0.09), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('chromoly') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  const slices = 8
  return (
    <group ref={ref}>
      {Array.from({ length: slices }, (_, i) => (
        <mesh key={i} geometry={geo} material={mat}
          position={[0, (i - slices / 2) * 0.075, 0]}
          rotation={[0, (i / slices) * 0.45, 0]}
        />
      ))}
    </group>
  )
}

function ShaftModel({ ar, wireframe, heatmap }: { ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const r = 0.32, len = 3.6
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.5 })
  const mat1 = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel') }), [])
  const mat2 = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel_dark') }), [])
  useEffect(() => { mat1.wireframe = wireframe; mat1.needsUpdate = true }, [mat1, wireframe])
  useEffect(() => { mat2.wireframe = wireframe; mat2.needsUpdate = true }, [mat2, wireframe])
  const hCrit = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0x440000, emissiveIntensity: 0.5, roughness: 0.5, metalness: 0.4 }), [])
  const hHigh = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xff7700, emissive: 0x331100, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.4 }), [])
  const hSafe = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x00cc44, emissive: 0x001a0a, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0.4 }), [])
  return (
    <group ref={ref}>
      <mesh material={heatmap ? hSafe : mat1}><cylinderGeometry args={[r, r, len, 64]} /></mesh>
      {[-1, 1].map(s => (
        <mesh key={s} material={heatmap ? hHigh : mat2} position={[0, s * len * 0.28, 0]}>
          <cylinderGeometry args={[r * 1.55, r * 1.55, len * 0.07, 64]} />
        </mesh>
      ))}
      <mesh material={heatmap ? hCrit : mat2} position={[r * 0.92, 0, 0]}>
        <boxGeometry args={[r * 0.5, len * 0.22, r * 0.6]} />
      </mesh>
      {[-1, 1].map(s => (
        <mesh key={`chamfer-${s}`} material={heatmap ? hHigh : mat2} position={[0, s * (len / 2 + 0.04), 0]}>
          <cylinderGeometry args={[r * 0.82, r, 0.1, 32]} />
        </mesh>
      ))}
    </group>
  )
}

function BearingModel({ ar, wireframe, heatmap }: { ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const innerRef = useRef<THREE.Group>(null)
  const ballsRef = useRef<THREE.Group>(null)
  useFrame((_, d) => {
    if (!ar) return
    if (innerRef.current) innerRef.current.rotation.y += d * 0.8
    if (ballsRef.current) ballsRef.current.rotation.y += d * 0.4
  })
  const ballCount = 10
  const OR = 2.0, OIR = 1.55, IR = 1.35, IRR = 0.85, W = 0.55, ballR = 0.22
  const ballTrackR = (OIR + IR) / 2
  const mOuter = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel_dark'), side: THREE.DoubleSide }), [])
  const mInner = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel'), side: THREE.DoubleSide }), [])
  const mBall  = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('stainless') }), [])
  useEffect(() => { mOuter.wireframe = wireframe; mOuter.needsUpdate = true }, [mOuter, wireframe])
  useEffect(() => { mInner.wireframe = wireframe; mInner.needsUpdate = true }, [mInner, wireframe])
  useEffect(() => { mBall.wireframe  = wireframe; mBall.needsUpdate  = true }, [mBall,  wireframe])
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={mOuter}><cylinderGeometry args={[OR, OR, W, 64, 1, true]} /></mesh>
      <mesh material={mOuter}><cylinderGeometry args={[OIR, OIR, W, 64, 1, true]} /></mesh>
      {[-1, 1].map(s => (
        <mesh key={s} material={mOuter} position={[0, s * W / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[OIR, OR, 64]} />
        </mesh>
      ))}
      <group ref={innerRef}>
        <mesh material={mInner}><cylinderGeometry args={[IR, IR, W, 64, 1, true]} /></mesh>
        <mesh material={mInner}><cylinderGeometry args={[IRR, IRR, W, 64, 1, true]} /></mesh>
        {[-1, 1].map(s => (
          <mesh key={s} material={mInner} position={[0, s * W / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[IRR, IR, 64]} />
          </mesh>
        ))}
      </group>
      <group ref={ballsRef}>
        {Array.from({ length: ballCount }, (_, i) => {
          const angle = (i / ballCount) * Math.PI * 2
          return (
            <mesh key={i} material={mBall} position={[Math.cos(angle) * ballTrackR, 0, Math.sin(angle) * ballTrackR]}>
              <sphereGeometry args={[ballR, 24, 24]} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

function BoltModel({ ar, wireframe, heatmap }: { ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.5 })
  const mS = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('alloy_steel') }), [])
  const mD = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel_dark') }), [])
  useEffect(() => { mS.wireframe = wireframe; mS.needsUpdate = true }, [mS, wireframe])
  useEffect(() => { mD.wireframe = wireframe; mD.needsUpdate = true }, [mD, wireframe])
  const hexShape = useMemo(() => {
    const s = new THREE.Shape()
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      if (i === 0) s.moveTo(Math.cos(a) * 0.55, Math.sin(a) * 0.55)
      else s.lineTo(Math.cos(a) * 0.55, Math.sin(a) * 0.55)
    }
    s.closePath(); return s
  }, [])
  const hexGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hexShape, { depth: 0.45, bevelEnabled: false })
    g.center(); return g
  }, [hexShape])
  return (
    <group ref={ref}>
      <mesh geometry={hexGeo} material={mD} position={[0, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh material={mS} position={[0, 0.2, 0]}><cylinderGeometry args={[0.22, 0.22, 2.4, 32]} /></mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} material={mD} position={[0, -0.8 + i * 0.14, 0]}>
          <torusGeometry args={[0.22, 0.028, 8, 24]} />
        </mesh>
      ))}
      <mesh material={mS} position={[0, -1.05, 0]}><cylinderGeometry args={[0.0, 0.22, 0.18, 32]} /></mesh>
      <mesh material={mS} position={[0, 1.18, 0]}><cylinderGeometry args={[0.52, 0.52, 0.1, 32]} /></mesh>
    </group>
  )
}

function CubeModel({ dims, ar, wireframe, heatmap }: { dims: ShapeDimensions; ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const s = Math.min((dims.width ?? 100) / 50, 3.5)
  useFrame((_, d) => { if (ref.current && ar) { ref.current.rotation.y += d * 0.5; ref.current.rotation.x += d * 0.2 } })
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  return <mesh ref={ref} material={mat}><boxGeometry args={[s, s, s]} /></mesh>
}

function RectangleModel({ dims, ar, wireframe, heatmap }: { dims: ShapeDimensions; ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const rawW = dims.width ?? 3, rawH = dims.height ?? 1.5, rawD = dims.depth ?? 1.2
  const scale = 3.2 / Math.max(rawW, rawH, rawD)
  const [w, h, d] = [rawW * scale, rawH * scale, rawD * scale]
  useFrame((_, dt) => { if (ref.current && ar) { ref.current.rotation.y += dt * 0.5; ref.current.rotation.x += dt * 0.15 } })
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  return <mesh ref={ref} material={mat}><boxGeometry args={[w, h, d]} /></mesh>
}

function SphereModel({ dims, ar, wireframe, heatmap }: { dims: ShapeDimensions; ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const r = Math.min((dims.radius ?? 80) / 60, 2.0)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.5 })
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('stainless') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  return <mesh ref={ref} material={mat}><sphereGeometry args={[r, 64, 40]} /></mesh>
}

function CylinderModel({ dims, ar, wireframe, heatmap }: { dims: ShapeDimensions; ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  const r = Math.min((dims.radius ?? 50) / 55, 1.8)
  const len = Math.min((dims.length ?? 200) / 80, 4.0)
  useFrame((_, d) => { if (ref.current && ar) { ref.current.rotation.y += d * 0.5; ref.current.rotation.z += d * 0.1 } })
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  return <mesh ref={ref} material={mat}><cylinderGeometry args={[r, r, len, 64]} /></mesh>
}

function CameraZoom({ delta, onDone }: { delta: number; onDone: () => void }) {
  const { camera } = useThree()
  useEffect(() => {
    if (delta === 0) return
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    camera.position.addScaledVector(dir, delta)
    onDone()
  }, [delta, camera, onDone])
  return null
}

function SceneCapture({ sceneRef }: { sceneRef: React.MutableRefObject<THREE.Scene | null> }) {
  const { scene } = useThree()
  useEffect(() => { sceneRef.current = scene }, [scene, sceneRef])
  return null
}

// ── Empty state — ghost wireframe gear SVG ────────────────────────────────
function EmptyState() {
  const teeth = 16
  const OR = 52, IR = 36, bore = 10
  const pts: string[] = []
  const toothW = (Math.PI * 2) / teeth
  const cx = 80, cy = 80
  for (let i = 0; i < teeth; i++) {
    const a0=i*toothW, a1=a0+toothW*0.25, a2=a0+toothW*0.5, a3=a0+toothW*0.75, a4=a0+toothW
    pts.push(`${cx+Math.cos(a0)*IR},${cy+Math.sin(a0)*IR}`)
    pts.push(`${cx+Math.cos(a1)*OR},${cy+Math.sin(a1)*OR}`)
    pts.push(`${cx+Math.cos(a2)*OR},${cy+Math.sin(a2)*OR}`)
    pts.push(`${cx+Math.cos(a3)*OR},${cy+Math.sin(a3)*OR}`)
    pts.push(`${cx+Math.cos(a4)*IR},${cy+Math.sin(a4)*IR}`)
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 2,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, pointerEvents: 'none',
    }}>
      {/* Ghost gear illustration */}
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ opacity: 0.12 }}>
        {/* Outer gear */}
        <polygon points={pts.join(' ')} fill="none" stroke="#63b3ed" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={IR} fill="none" stroke="#63b3ed" strokeWidth="1" strokeDasharray="4,3" />
        <circle cx={cx} cy={cy} r={bore} fill="none" stroke="#63b3ed" strokeWidth="1.5" />
        {/* Cross centre lines */}
        <line x1={cx-OR-8} y1={cy} x2={cx+OR+8} y2={cy} stroke="#63b3ed" strokeWidth="0.7" strokeDasharray="6,3" />
        <line x1={cx} y1={cy-OR-8} x2={cx} y2={cy+OR+8} stroke="#63b3ed" strokeWidth="0.7" strokeDasharray="6,3" />
        {/* Small second gear hint */}
        <circle cx={cx+OR+18} cy={cy+OR+18} r={18} fill="none" stroke="#63b3ed" strokeWidth="1" strokeDasharray="3,2" />
        <circle cx={cx+OR+18} cy={cy+OR+18} r={6} fill="none" stroke="#63b3ed" strokeWidth="1" />
      </svg>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.22)', fontFamily: F, letterSpacing: '0.01em' }}>
          Generate a component to view it here
        </p>
        <p style={{ margin: '5px 0 0', fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.12)', fontFamily: F }}>
          Try: "generate a spur gear" or "show a bolt"
        </p>
      </div>
    </div>
  )
}

const MODEL_META: Record<ModelType, { label: string; material: string; specs: { label: string; value: string }[] }> = {
  spur_gear:    { label: 'Spur Gear',       material: '4140 Chromoly Steel',   specs: [{ label: 'Teeth', value: '20' }, { label: 'Module', value: '2.0 mm' }, { label: 'Pitch Ø', value: '40 mm' }] },
  helical_gear: { label: 'Helical Gear',    material: '4140 Chromoly Steel',   specs: [{ label: 'Teeth', value: '18' }, { label: 'Helix', value: '20°' }, { label: 'Module', value: '2.0 mm' }] },
  shaft:        { label: 'Steel Shaft',     material: '1045 Medium Carbon',    specs: [{ label: 'Ø', value: '64 mm' }, { label: 'Length', value: '360 mm' }, { label: 'Finish', value: 'Ra 0.8 μm' }] },
  bearing:      { label: 'Ball Bearing',    material: '52100 Bearing Steel',   specs: [{ label: 'Type', value: '6308 Deep Groove' }, { label: 'Balls', value: '10' }, { label: 'OD', value: '90 mm' }] },
  bolt:         { label: 'Hex Bolt M12',    material: 'Grade 8.8 Alloy Steel', specs: [{ label: 'Standard', value: 'ISO 4014' }, { label: 'Grade', value: '8.8' }, { label: 'Torque', value: '85 Nm' }] },
  cube:         { label: 'Cube',            material: 'Structural Steel',      specs: [{ label: 'Faces', value: '6' }, { label: 'Edges', value: '12' }, { label: 'E', value: '200 GPa' }] },
  rectangle:    { label: 'Rectangular Box', material: 'Structural Steel',      specs: [{ label: 'Faces', value: '6' }, { label: 'Type', value: 'Cuboid' }, { label: 'E', value: '200 GPa' }] },
  sphere:       { label: 'Sphere',          material: '316 Stainless Steel',   specs: [{ label: 'Type', value: 'Solid Ball' }, { label: 'Surface', value: 'Polished' }, { label: 'E', value: '193 GPa' }] },
  cylinder:     { label: 'Cylinder',        material: 'Structural Steel',      specs: [{ label: 'Ends', value: 'Flat' }, { label: 'E', value: '200 GPa' }, { label: 'Type', value: 'Solid' }] },
  pharma_table: { label: 'Pharma SS Table', material: '316L Stainless Steel (GMP)', specs: [{ label: 'Finish', value: 'Ra ≤ 0.8 μm' }, { label: 'Standard', value: 'GMP / cGMP' }, { label: 'Load', value: '200 kg UDL' }] },
  pharma_chair: { label: 'Pharma SS Chair', material: '304 Stainless Steel (GMP)', specs: [{ label: 'Seat H', value: '450–650 mm' }, { label: 'Type', value: 'Swivel / ESD' }, { label: 'Rating', value: 'ISO 14644' }] },
  empty:        { label: '', material: '', specs: [] },
}

export interface CadUrls {
  stl_url: string | null
  step_url: string | null
  dxf_url: string | null
}

export interface ModelViewerProps {
  onClose: () => void
  darkMode?: boolean
  heatmap?: boolean
  onHeatmapToggle?: () => void
  modelType?: ModelType
  pendingModel?: ModelType
  isGenerating?: boolean
  shapeDims?: ShapeDimensions
  cadUrls?: CadUrls | null
}

const DIM_COLOR  = '#1a1a1a'
const LINE_COLOR = '#000000'
const CL_COLOR   = '#cc0000'
const TEXT_COLOR = '#111111'

function DimLine({ x1, y1, x2, y2, label, labelX, labelY, vertical = false }:
  { x1:number; y1:number; x2:number; y2:number; label:string; labelX:number; labelY:number; vertical?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={DIM_COLOR} strokeWidth="0.6" markerStart="url(#arr)" markerEnd="url(#arr)" />
      <rect x={labelX-16} y={labelY-6} width={32} height={8} fill="white" stroke="none"
        transform={vertical ? `rotate(-90,${labelX},${labelY})` : undefined} />
      <text x={labelX} y={labelY} fill={DIM_COLOR} fontSize="6.5" fontFamily="'DM Sans',monospace" textAnchor="middle"
        transform={vertical ? `rotate(-90,${labelX},${labelY})` : undefined}>{label}</text>
    </g>
  )
}

function CentreLine({ x1, y1, x2, y2 }: { x1:number; y1:number; x2:number; y2:number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={CL_COLOR} strokeWidth="0.55" strokeDasharray="8,3,2,3" />
}

function Drawing2D({ modelType, shapeDims, meta, isPending = false }: { modelType: ModelType; shapeDims: ShapeDimensions; meta: typeof MODEL_META[ModelType]; isPending?: boolean }) {
  const W = 500, H = 380
  const cx = W / 2, cy = H / 2

  const defs = (
    <defs>
      <marker id="arr" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
        <path d="M0,0.5 L4.5,2.5 L0,4.5 Z" fill="#1a1a1a" />
      </marker>
    </defs>
  )

  const bg = (
    <>
      <rect width={W} height={H} fill="#ffffff" />
      <rect x={6} y={6} width={W-12} height={H-12} fill="none" stroke="#000" strokeWidth="1.5" />
      <rect x={14} y={14} width={W-28} height={H-56} fill="none" stroke="#000" strokeWidth="0.5" />
      <line x1={6} y1={H-42} x2={W-6} y2={H-42} stroke="#000" strokeWidth="1" />
      <line x1={W*0.38} y1={H-42} x2={W*0.38} y2={H-6} stroke="#000" strokeWidth="0.5" />
      <line x1={W*0.62} y1={H-42} x2={W*0.62} y2={H-6} stroke="#000" strokeWidth="0.5" />
      <line x1={W*0.80} y1={H-42} x2={W*0.80} y2={H-6} stroke="#000" strokeWidth="0.5" />
      <line x1={6} y1={H-24} x2={W-6} y2={H-24} stroke="#000" strokeWidth="0.5" />
      <text x={16} y={H-30} fill="#444" fontSize="5.5" fontFamily="'DM Sans',monospace" letterSpacing="0.5">PART NAME</text>
      <text x={W*0.38+8} y={H-30} fill="#444" fontSize="5.5" fontFamily="'DM Sans',monospace" letterSpacing="0.5">MATERIAL</text>
      <text x={W*0.62+8} y={H-30} fill="#444" fontSize="5.5" fontFamily="'DM Sans',monospace" letterSpacing="0.5">SCALE</text>
      <text x={W*0.80+8} y={H-30} fill="#444" fontSize="5.5" fontFamily="'DM Sans',monospace" letterSpacing="0.5">FORMAT</text>
      <text x={16} y={H-13} fill="#000" fontSize="8" fontFamily="'DM Sans',monospace" fontWeight="700">{meta.label.toUpperCase()}</text>
      <text x={W*0.38+8} y={H-13} fill="#000" fontSize="7" fontFamily="'DM Sans',monospace">{meta.material}</text>
      <text x={W*0.62+8} y={H-13} fill="#000" fontSize="7.5" fontFamily="'DM Sans',monospace" fontWeight="600">1:1</text>
      <text x={W*0.80+8} y={H-13} fill="#000" fontSize="7.5" fontFamily="'DM Sans',monospace">A3</text>
    </>
  )

  let drawing: React.ReactNode = null

  if (modelType === 'spur_gear' || modelType === 'helical_gear') {
    const teeth = modelType === 'spur_gear' ? 20 : 18
    const OR = 80, IR = 55, bore = 16, helix = modelType === 'helical_gear'
    const pts: string[] = []
    const toothW = (Math.PI * 2) / teeth
    for (let i = 0; i < teeth; i++) {
      const a0=i*toothW, a1=a0+toothW*0.25, a2=a0+toothW*0.5, a3=a0+toothW*0.75, a4=a0+toothW
      pts.push(`${cx+Math.cos(a0)*IR},${cy+Math.sin(a0)*IR}`)
      pts.push(`${cx+Math.cos(a1)*OR},${cy+Math.sin(a1)*OR}`)
      pts.push(`${cx+Math.cos(a2)*OR},${cy+Math.sin(a2)*OR}`)
      pts.push(`${cx+Math.cos(a3)*OR},${cy+Math.sin(a3)*OR}`)
      pts.push(`${cx+Math.cos(a4)*IR},${cy+Math.sin(a4)*IR}`)
    }
    drawing = (
      <g>
        <CentreLine x1={cx-OR-20} y1={cy} x2={cx+OR+20} y2={cy} />
        <CentreLine x1={cx} y1={cy-OR-20} x2={cx} y2={cy+OR+20} />
        <polygon points={pts.join(' ')} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={IR} fill="none" stroke={LINE_COLOR} strokeWidth="0.8" strokeDasharray="4,3" opacity="0.5" />
        <circle cx={cx} cy={cy} r={bore} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <DimLine x1={cx} y1={cy-OR-8} x2={cx+OR} y2={cy-OR-8} label={`Ø${OR*2/10*2} mm`} labelX={cx+OR/2} labelY={cy-OR-14} />
        <DimLine x1={cx} y1={cy+IR+8} x2={cx+IR} y2={cy+IR+8} label={`PCD ${IR*2/10*2} mm`} labelX={cx+IR/2} labelY={cy+IR+18} />
        <DimLine x1={cx-bore-8} y1={cy} x2={cx-bore-8} y2={cy-bore} label={`Ø${bore/10*20} mm`} labelX={cx-bore-22} labelY={cy-bore/2} vertical />
        {helix && <text x={cx+OR+14} y={cy+4} fill={DIM_COLOR} fontSize="7" fontFamily="'DM Sans',monospace">β=20°</text>}
        <text x={cx} y={cy+OR+30} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW — {teeth}T MODULE 2.0</text>
      </g>
    )
  } else if (modelType === 'shaft') {
    const len = 280, r = 22, sr = 34, kW = 11, kH = 8, kL = 62
    const sx = cx - len/2, ex = cx + len/2
    drawing = (
      <g>
        <CentreLine x1={sx-16} y1={cy} x2={ex+16} y2={cy} />
        <rect x={sx} y={cy-r} width={len} height={r*2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        {[-1,1].map(s => {
          const bx = s === -1 ? sx + 50 : ex - 70
          return <rect key={s} x={bx} y={cy-sr} width={20} height={sr*2} fill="none" stroke={LINE_COLOR} strokeWidth="1" />
        })}
        <rect x={cx-kL/2} y={cy-r-kH} width={kL} height={kH} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" strokeDasharray="2,1" />
        <line x1={sx} y1={cy-r} x2={sx+8} y2={cy-r+5} stroke={LINE_COLOR} strokeWidth="0.8" />
        <line x1={sx} y1={cy+r} x2={sx+8} y2={cy+r-5} stroke={LINE_COLOR} strokeWidth="0.8" />
        <line x1={ex} y1={cy-r} x2={ex-8} y2={cy-r+5} stroke={LINE_COLOR} strokeWidth="0.8" />
        <line x1={ex} y1={cy+r} x2={ex-8} y2={cy+r-5} stroke={LINE_COLOR} strokeWidth="0.8" />
        <DimLine x1={sx} y1={cy+r+18} x2={ex} y2={cy+r+18} label="360 mm" labelX={cx} labelY={cy+r+28} />
        <DimLine x1={sx-18} y1={cy} x2={sx-18} y2={cy-r} label="Ø64" labelX={sx-32} labelY={cy-r/2} vertical />
        <DimLine x1={sx-18} y1={cy} x2={sx-18} y2={cy-sr} label="Ø88" labelX={sx-46} labelY={cy-sr/2} vertical />
        <text x={cx} y={cy-r-kH-10} fill={DIM_COLOR} fontSize="6.5" fontFamily="'DM Sans',monospace" textAnchor="middle">KW 12×8×62 (DIN 6885)</text>
        <text x={cx} y={cy+r+46} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW — 1045 STEEL — Ra 0.8 μm</text>
      </g>
    )
  } else if (modelType === 'bearing') {
    const OR=90, OIR=70, IR=60, IRR=38, W2=24
    const bx = cx - W2/2*4
    drawing = (
      <g>
        <CentreLine x1={bx-20} y1={cy} x2={bx+W2*4+20} y2={cy} />
        <CentreLine x1={cx} y1={cy-OR/2-10} x2={cx} y2={cy+OR/2+10} />
        <rect x={bx} y={cy-OR/2} width={W2*4} height={OR/2-OIR/2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <rect x={bx} y={cy+OIR/2} width={W2*4} height={OR/2-OIR/2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <rect x={bx} y={cy-IR/2} width={W2*4} height={IR/2-IRR/2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <rect x={bx} y={cy+IRR/2} width={W2*4} height={IR/2-IRR/2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        {[-1,1].map(s => <circle key={s} cx={cx} cy={cy+s*(OIR/2+IR/2)/2} r={6} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" />)}
        <circle cx={cx} cy={cy} r={8} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" />
        <circle cx={cx+160} cy={cy} r={OR/2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <circle cx={cx+160} cy={cy} r={OIR/2} fill="none" stroke={LINE_COLOR} strokeWidth="0.7" strokeDasharray="3,2" opacity="0.5" />
        <circle cx={cx+160} cy={cy} r={IR/2} fill="none" stroke={LINE_COLOR} strokeWidth="0.7" strokeDasharray="3,2" opacity="0.5" />
        <circle cx={cx+160} cy={cy} r={IRR/2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <CentreLine x1={cx+160-OR/2-10} y1={cy} x2={cx+160+OR/2+10} y2={cy} />
        <CentreLine x1={cx+160} y1={cy-OR/2-10} x2={cx+160} y2={cy+OR/2+10} />
        <DimLine x1={bx} y1={cy+OR/2+16} x2={bx+W2*4} y2={cy+OR/2+16} label="23 mm" labelX={cx-30} labelY={cy+OR/2+26} />
        <DimLine x1={cx+160+OR/2+12} y1={cy} x2={cx+160+OR/2+12} y2={cy-OR/2} label="Ø90" labelX={cx+160+OR/2+26} labelY={cy-OR/4} vertical />
        <DimLine x1={cx+160+OR/2+28} y1={cy} x2={cx+160+OR/2+28} y2={cy-IRR/2} label="Ø40" labelX={cx+160+OR/2+42} labelY={cy-IRR/4} vertical />
        <text x={cx-30} y={cy+OR/2+44} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">SECTION A-A — 6308 DEEP GROOVE</text>
        <text x={cx+160} y={cy+OR/2+44} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW</text>
      </g>
    )
  } else if (modelType === 'bolt') {
    const hW=28, hH=20, shL=120, shR=11, thL=80
    const bx = cx - shL/2 - hH/2
    drawing = (
      <g>
        <CentreLine x1={bx-10} y1={cy} x2={bx+shL+hH+10} y2={cy} />
        <rect x={bx} y={cy-hW/2} width={hH} height={hW} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <line x1={bx+hH*0.25} y1={cy-hW/2} x2={bx+hH*0.25} y2={cy+hW/2} stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.4" />
        <line x1={bx+hH*0.75} y1={cy-hW/2} x2={bx+hH*0.75} y2={cy+hW/2} stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.4" />
        <rect x={bx+hH} y={cy-shR*1.8} width={6} height={shR*3.6} fill="none" stroke={LINE_COLOR} strokeWidth="0.8" />
        <rect x={bx+hH+6} y={cy-shR} width={shL-thL} height={shR*2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <rect x={bx+hH+6+shL-thL} y={cy-shR} width={thL} height={shR*2} fill="none" stroke={LINE_COLOR} strokeWidth="0.7" strokeDasharray="3,2" />
        {Array.from({length:12},(_,i) => (
          <line key={i} x1={bx+hH+6+shL-thL+i*(thL/12)} y1={cy-shR} x2={bx+hH+6+shL-thL+i*(thL/12)} y2={cy+shR} stroke={LINE_COLOR} strokeWidth="0.4" opacity="0.35" />
        ))}
        <polygon points={`${bx+hH+6+shL},${cy-shR} ${bx+hH+6+shL+8},${cy} ${bx+hH+6+shL},${cy+shR}`} fill="none" stroke={LINE_COLOR} strokeWidth="1" />
        <DimLine x1={bx} y1={cy+hW/2+16} x2={bx+hH+6+shL+8} y2={cy+hW/2+16} label="L=80 mm total" labelX={cx} labelY={cy+hW/2+26} />
        <DimLine x1={bx-14} y1={cy} x2={bx-14} y2={cy-shR} label="M12" labelX={bx-28} labelY={cy-shR/2} vertical />
        <DimLine x1={bx-14} y1={cy} x2={bx-14} y2={cy-hW/2} label="SW19" labelX={bx-42} labelY={cy-hW/4} vertical />
        <text x={bx+hH+6+shL-thL+thL/2} y={cy-shR-8} fill={DIM_COLOR} fontSize="6.5" fontFamily="'DM Sans',monospace" textAnchor="middle">p=1.75mm</text>
        <text x={cx} y={cy+hW/2+44} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">SIDE VIEW — M12 ISO 4014 GR.8.8</text>
      </g>
    )
  } else if (modelType === 'cube') {
    const s = 110
    const dx=s*0.55, dy=s*0.32
    drawing = (
      <g>
        <rect x={cx-s/2} y={cy-s/2} width={s} height={s} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <polygon points={`${cx-s/2},${cy-s/2} ${cx-s/2+dx},${cy-s/2-dy} ${cx+s/2+dx},${cy-s/2-dy} ${cx+s/2},${cy-s/2}`} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <polygon points={`${cx+s/2},${cy-s/2} ${cx+s/2+dx},${cy-s/2-dy} ${cx+s/2+dx},${cy+s/2-dy} ${cx+s/2},${cy+s/2}`} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <CentreLine x1={cx-s/2-10} y1={cy} x2={cx+s/2+dx+10} y2={cy} />
        <CentreLine x1={cx} y1={cy-s/2-dy-10} x2={cx} y2={cy+s/2+10} />
        <DimLine x1={cx-s/2} y1={cy+s/2+18} x2={cx+s/2} y2={cy+s/2+18} label={shapeDims.width ? `${shapeDims.width} mm` : '100 mm'} labelX={cx} labelY={cy+s/2+28} />
        <DimLine x1={cx-s/2-18} y1={cy-s/2} x2={cx-s/2-18} y2={cy+s/2} label={shapeDims.width ? `${shapeDims.width} mm` : '100 mm'} labelX={cx-s/2-32} labelY={cy} vertical />
        <text x={cx} y={cy+s/2+46} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">ISO VIEW — STRUCTURAL STEEL</text>
      </g>
    )
  } else if (modelType === 'cylinder') {
    const r2 = 55, len2 = 200
    drawing = (
      <g>
        <CentreLine x1={cx-len2/2-20} y1={cy} x2={cx+len2/2+20} y2={cy} />
        <rect x={cx-len2/2} y={cy-r2} width={len2} height={r2*2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <ellipse cx={cx-len2/2} cy={cy} rx={10} ry={r2} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" strokeDasharray="3,2" />
        <ellipse cx={cx+len2/2} cy={cy} rx={10} ry={r2} fill="none" stroke={LINE_COLOR} strokeWidth="1.1" />
        <DimLine x1={cx-len2/2} y1={cy+r2+18} x2={cx+len2/2} y2={cy+r2+18} label={shapeDims.length ? `${shapeDims.length} mm` : '200 mm'} labelX={cx} labelY={cy+r2+28} />
        <DimLine x1={cx+len2/2+18} y1={cy} x2={cx+len2/2+18} y2={cy-r2} label={shapeDims.radius ? `Ø${shapeDims.radius*2} mm` : 'Ø100 mm'} labelX={cx+len2/2+34} labelY={cy-r2/2} vertical />
        <text x={cx} y={cy+r2+46} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW — STRUCTURAL STEEL</text>
      </g>
    )
  } else if (modelType === 'sphere') {
    const r3 = 80
    drawing = (
      <g>
        <CentreLine x1={cx-r3-20} y1={cy} x2={cx+r3+20} y2={cy} />
        <CentreLine x1={cx} y1={cy-r3-20} x2={cx} y2={cy+r3+20} />
        <circle cx={cx} cy={cy} r={r3} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <ellipse cx={cx} cy={cy} rx={r3} ry={r3*0.2} fill="none" stroke={LINE_COLOR} strokeWidth="0.7" strokeDasharray="4,2" opacity="0.5" />
        <DimLine x1={cx-r3-16} y1={cy} x2={cx-r3-16} y2={cy-r3} label={shapeDims.radius ? `R${shapeDims.radius} mm` : 'R80 mm'} labelX={cx-r3-32} labelY={cy-r3/2} vertical />
        <DimLine x1={cx-r3} y1={cy+r3+16} x2={cx+r3} y2={cy+r3+16} label={shapeDims.radius ? `Ø${shapeDims.radius*2} mm` : 'Ø160 mm'} labelX={cx} labelY={cy+r3+26} />
        <text x={cx} y={cy+r3+44} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW — 316 STAINLESS</text>
      </g>
    )
  } else if (modelType === 'rectangle') {
    const W2 = shapeDims.width  ? Math.min(shapeDims.width  / 2, 140) : 130
    const H2 = shapeDims.height ? Math.min(shapeDims.height / 2,  90) :  75
    const D2 = shapeDims.depth  ? Math.min(shapeDims.depth  / 2,  80) :  60
    const dx = D2 * 0.45, dy = D2 * 0.28
    const fX = cx - W2 - 20, fY = cy
    const sX = cx + 30, sY = cy
    drawing = (
      <g>
        <rect x={fX} y={fY - H2} width={W2 * 2} height={H2 * 2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <CentreLine x1={fX - 10} y1={fY} x2={fX + W2 * 2 + 10} y2={fY} />
        <CentreLine x1={fX + W2} y1={fY - H2 - 10} x2={fX + W2} y2={fY + H2 + 10} />
        <DimLine x1={fX} y1={fY + H2 + 18} x2={fX + W2 * 2} y2={fY + H2 + 18} label={shapeDims.width ? `${shapeDims.width} mm` : '200 mm'} labelX={fX + W2} labelY={fY + H2 + 28} />
        <DimLine x1={fX - 18} y1={fY - H2} x2={fX - 18} y2={fY + H2} label={shapeDims.height ? `${shapeDims.height} mm` : '100 mm'} labelX={fX - 34} labelY={fY} vertical />
        <text x={fX + W2} y={fY + H2 + 46} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW</text>
        <rect x={sX} y={sY - H2} width={D2} height={H2 * 2} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <CentreLine x1={sX - 8} y1={sY} x2={sX + D2 + 8} y2={sY} />
        <DimLine x1={sX} y1={sY + H2 + 18} x2={sX + D2} y2={sY + H2 + 18} label={shapeDims.depth ? `${shapeDims.depth} mm` : '80 mm'} labelX={sX + D2 / 2} labelY={sY + H2 + 28} />
        <text x={sX + D2 / 2} y={sY + H2 + 46} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">SIDE VIEW</text>
        <line x1={fX + W2 * 2} y1={fY - H2} x2={fX + W2 * 2 + dx} y2={fY - H2 - dy} stroke={LINE_COLOR} strokeWidth="0.8" opacity="0.5" />
        <line x1={fX + W2 * 2 + dx} y1={fY - H2 - dy} x2={fX + W2 * 2 + dx + D2 * 0.7} y2={fY - H2 - dy} stroke={LINE_COLOR} strokeWidth="0.8" opacity="0.5" />
        <text x={cx} y={cy + H2 + 64} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">{'W×H×D — STRUCTURAL STEEL — E=200 GPa'}</text>
      </g>
    )
  } else if (modelType === 'pharma_table') {
    const tL = 320, tW = 100, tH = 160, legR = 8, shelfY = 80
    const tx = cx - tL / 2, ty = cy - tH / 2
    drawing = (
      <g>
        <CentreLine x1={tx - 16} y1={cy} x2={tx + tL + 16} y2={cy} />
        {/* Tabletop */}
        <rect x={tx} y={ty} width={tL} height={10} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        {/* Legs */}
        <rect x={tx + 12} y={ty + 10} width={legR * 2} height={tH - 10} fill="none" stroke={LINE_COLOR} strokeWidth="1" />
        <rect x={tx + tL - 12 - legR * 2} y={ty + 10} width={legR * 2} height={tH - 10} fill="none" stroke={LINE_COLOR} strokeWidth="1" />
        {/* Undershelf */}
        <rect x={tx + 8} y={ty + shelfY} width={tL - 16} height={7} fill="none" stroke={LINE_COLOR} strokeWidth="0.8" strokeDasharray="4 2" />
        {/* Feet */}
        <rect x={tx + 6} y={ty + tH - 6} width={legR * 2 + 8} height={6} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" />
        <rect x={tx + tL - 14 - legR * 2} y={ty + tH - 6} width={legR * 2 + 8} height={6} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" />
        {/* Side view (right) */}
        <rect x={cx + 80} y={ty} width={tW} height={10} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        <rect x={cx + 92} y={ty + 10} width={legR * 2} height={tH - 10} fill="none" stroke={LINE_COLOR} strokeWidth="1" />
        <rect x={cx + 80 + tW - 12 - legR * 2} y={ty + 10} width={legR * 2} height={tH - 10} fill="none" stroke={LINE_COLOR} strokeWidth="1" />
        <CentreLine x1={cx + 72} y1={cy} x2={cx + 90 + tW} y2={cy} />
        {/* Dims */}
        <DimLine x1={tx} y1={ty + tH + 18} x2={tx + tL} y2={ty + tH + 18} label={shapeDims.width ? `${shapeDims.width} mm` : '1800 mm'} labelX={cx - 50} labelY={ty + tH + 28} />
        <DimLine x1={tx - 18} y1={ty} x2={tx - 18} y2={ty + tH} label={shapeDims.height ? `${shapeDims.height} mm` : '900 mm'} labelX={tx - 34} labelY={cy} vertical />
        <DimLine x1={cx + 80} y1={ty + tH + 18} x2={cx + 80 + tW} y2={ty + tH + 18} label={shapeDims.depth ? `${shapeDims.depth} mm` : '750 mm'} labelX={cx + 80 + tW / 2} labelY={ty + tH + 28} />
        <text x={cx - 50} y={ty + tH + 46} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW — GMP SS WORKBENCH</text>
        <text x={cx + 80 + tW / 2} y={ty + tH + 46} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">SIDE VIEW</text>
        <text x={cx - 50} y={ty - 14} fill={DIM_COLOR} fontSize="6.5" fontFamily="'DM Sans',monospace" textAnchor="middle">COVED CORNERS — Ra ≤ 0.8 μm — GMP / cGMP COMPLIANT</text>
      </g>
    )
  } else if (modelType === 'pharma_chair') {
    const cx2 = cx, cy2 = cy + 10
    const seatR = 55, seatY = 80, colW = 10, colH = 100
    const backW = 90, backH = 75, baseArmL = 60, casR = 8

    drawing = (
      <g>
        <CentreLine x1={cx2 - 100} y1={cy2 + seatY + colH / 2} x2={cx2 + 100} y2={cy2 + seatY + colH / 2} />
        <CentreLine x1={cx2} y1={cy2 - backH - 20} x2={cx2} y2={cy2 + seatY + colH + 20} />

        {/* Backrest */}
        <rect x={cx2 - backW / 2} y={cy2 - backH - seatR * 0.18} width={backW} height={backH} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        {/* Backrest perforations */}
        {[0.25, 0.5, 0.75].map((t, i) => (
          <line key={i} x1={cx2 - backW / 2 + 5} y1={cy2 - backH - seatR * 0.18 + backH * t} x2={cx2 + backW / 2 - 5} y2={cy2 - backH - seatR * 0.18 + backH * t} stroke={LINE_COLOR} strokeWidth="0.6" strokeDasharray="4 2" />
        ))}
        {/* Backrest post */}
        <line x1={cx2} y1={cy2 - seatR * 0.18} x2={cx2} y2={cy2 - backH - seatR * 0.18} stroke={LINE_COLOR} strokeWidth="0.9" />

        {/* Round seat — front view shows as rectangle */}
        <rect x={cx2 - seatR} y={cy2 - seatR * 0.18} width={seatR * 2} height={8} fill="none" stroke={LINE_COLOR} strokeWidth="1.2" />
        {/* Seat edge curve hint */}
        <ellipse cx={cx2} cy={cy2 - seatR * 0.18 + 8} rx={seatR} ry={5} fill="none" stroke={LINE_COLOR} strokeWidth="0.6" strokeDasharray="3 2" opacity="0.5" />

        {/* Gas lift column */}
        <rect x={cx2 - colW / 2} y={cy2 - seatR * 0.18 + 8} width={colW} height={colH} fill="none" stroke={LINE_COLOR} strokeWidth="1.1" />
        {/* Column cap (wider at top) */}
        <rect x={cx2 - colW * 0.9} y={cy2 - seatR * 0.18 + 5} width={colW * 1.8} height={5} fill="none" stroke={LINE_COLOR} strokeWidth="0.8" />

        {/* Footrest ring */}
        <ellipse cx={cx2} cy={cy2 - seatR * 0.18 + 8 + colH * 0.42} rx={seatR * 0.65} ry={5} fill="none" stroke={LINE_COLOR} strokeWidth="1" />

        {/* 5-star base — show 3 visible arms in front view */}
        {[-1, 0, 1].map((offset, i) => (
          <line key={i}
            x1={cx2 + offset * baseArmL * 0.6} y1={cy2 - seatR * 0.18 + 8 + colH - 4}
            x2={cx2 + offset * baseArmL} y2={cy2 - seatR * 0.18 + 8 + colH + 5}
            stroke={LINE_COLOR} strokeWidth="1.1" />
        ))}
        {/* Base hub */}
        <ellipse cx={cx2} cy={cy2 - seatR * 0.18 + 8 + colH} rx={12} ry={4} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" />
        {/* Castors */}
        {[-1, 0, 1].map((offset, i) => (
          <circle key={i} cx={cx2 + offset * baseArmL} cy={cy2 - seatR * 0.18 + 8 + colH + 5 + casR} r={casR} fill="none" stroke={LINE_COLOR} strokeWidth="0.9" />
        ))}

        {/* Dims */}
        <DimLine x1={cx2 - seatR - 14} y1={cy2 - seatR * 0.18} x2={cx2 - seatR - 14} y2={cy2 - seatR * 0.18 + 8 + colH + casR * 2 + 10} label="500 mm" labelX={cx2 - seatR - 30} labelY={cy2 + colH / 2} vertical />
        <DimLine x1={cx2 - seatR} y1={cy2 - seatR * 0.18 - 14} x2={cx2 + seatR} y2={cy2 - seatR * 0.18 - 14} label="Ø450 mm seat" labelX={cx2} labelY={cy2 - seatR * 0.18 - 22} />
        <DimLine x1={cx2 + backW / 2 + 14} y1={cy2 - backH - seatR * 0.18} x2={cx2 + backW / 2 + 14} y2={cy2 - seatR * 0.18} label="380 mm" labelX={cx2 + backW / 2 + 30} labelY={cy2 - backH / 2 - seatR * 0.09} vertical />
        <text x={cx2} y={cy2 - seatR * 0.18 + 8 + colH + casR * 2 + 32} fill={TEXT_COLOR} fontSize="7" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.6">FRONT VIEW — 304/316L SS CLEANROOM CHAIR — 5-STAR BASE — ESD CASTORS</text>
      </g>
    )
  } else {
    drawing = (
      <text x={cx} y={cy} fill={TEXT_COLOR} fontSize="11" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.4">No drawing available for this part</text>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#d0d8e0', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', gap: '10px' }}>
      {isPending && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: '99px', padding: '5px 14px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#63b3ed', animation: 'mvSpin 1.2s ease-in-out infinite' }} />
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#63b3ed', fontFamily: F, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Preparing 3D model...</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ maxWidth: '100%', maxHeight: '100%', filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.25))' }}>
        {defs}{bg}{drawing}
      </svg>
    </div>
  )
}


// ── Pharma-grade SS Table ─────────────────────────────────────────────────
function PharmaTableModel({ dims, ar, wireframe, heatmap }: { dims: ShapeDimensions; ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.3 })

  const W = Math.min((dims.width ?? 1800) / 400, 4.5)
  const D = Math.min((dims.depth ?? 750) / 400, 2.2)
  const H = Math.min((dims.height ?? 900) / 400, 2.4)

  const mat     = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('stainless') }), [])
  const matDark = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel_dark') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  useEffect(() => { matDark.wireframe = wireframe; matDark.needsUpdate = true }, [matDark, wireframe])

  const legR = 0.055, topThick = 0.045, legH = H - topThick
  const legOffX = W / 2 - 0.12, legOffZ = D / 2 - 0.10

  // Position group so table sits on y=0 plane (grid)
  // legs go from y=0 to y=legH, tabletop at y=legH
  return (
    <group ref={ref} position={[0, -legH / 2 - topThick / 2, 0]}>
      {/* Tabletop */}
      <mesh material={mat} position={[0, legH + topThick / 2, 0]}>
        <boxGeometry args={[W, topThick, D]} />
      </mesh>
      {/* Undershelf at 35% leg height */}
      <mesh material={matDark} position={[0, legH * 0.38, 0]}>
        <boxGeometry args={[W - 0.12, topThick * 0.6, D - 0.12]} />
      </mesh>
      {/* 4 legs — bottom at y=0, top at y=legH */}
      {([[-1,-1],[1,-1],[1,1],[-1,1]] as [number,number][]).map(([sx, sz], i) => (
        <mesh key={i} material={matDark} position={[sx * legOffX, legH / 2, sz * legOffZ]}>
          <cylinderGeometry args={[legR, legR * 1.1, legH, 16]} />
        </mesh>
      ))}
      {/* Adjustable feet at bottom */}
      {([[-1,-1],[1,-1],[1,1],[-1,1]] as [number,number][]).map(([sx, sz], i) => (
        <mesh key={`foot-${i}`} material={mat} position={[sx * legOffX, 0.03, sz * legOffZ]}>
          <cylinderGeometry args={[legR * 1.6, legR * 1.6, 0.05, 16]} />
        </mesh>
      ))}
      {/* Side cross braces */}
      <mesh material={matDark} position={[0, legH * 0.35,  legOffZ]}>
        <boxGeometry args={[W - 0.24, 0.025, 0.025]} />
      </mesh>
      <mesh material={matDark} position={[0, legH * 0.35, -legOffZ]}>
        <boxGeometry args={[W - 0.24, 0.025, 0.025]} />
      </mesh>
    </group>
  )
}

// ── Pharma-grade SS Chair ─────────────────────────────────────────────────
function PharmaChairModel({ ar, wireframe, heatmap }: { ar: boolean; wireframe: boolean; heatmap: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.4 })

  const mat     = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('stainless') }), [])
  const matDark = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel_dark') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  useEffect(() => { matDark.wireframe = wireframe; matDark.needsUpdate = true }, [matDark, wireframe])

  const seatY  = 1.2
  const seatR  = 0.55
  const colR   = 0.06
  const colH   = seatY - 0.15
  const armLen = 0.7
  const starAngles = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2)

  return (
    <group ref={ref} position={[0, -seatY / 2 - 0.1, 0]}>
      {/* Round seat */}
      <mesh material={mat} position={[0, seatY, 0]}>
        <cylinderGeometry args={[seatR, seatR * 0.95, 0.06, 32]} />
      </mesh>
      {/* Gas-lift column */}
      <mesh material={matDark} position={[0, colH / 2 + 0.1, 0]}>
        <cylinderGeometry args={[colR, colR * 0.85, colH, 16]} />
      </mesh>
      {/* Column top cap */}
      <mesh material={mat} position={[0, colH + 0.1, 0]}>
        <cylinderGeometry args={[colR * 1.4, colR * 1.4, 0.04, 16]} />
      </mesh>
      {/* 5-star base */}
      {starAngles.map((angle, i) => (
        <mesh key={i} material={matDark}
          position={[Math.cos(angle) * armLen / 2, 0.06, Math.sin(angle) * armLen / 2]}
          rotation={[0, -angle, 0]}>
          <boxGeometry args={[armLen, 0.035, 0.05]} />
        </mesh>
      ))}
      {/* Central hub */}
      <mesh material={matDark} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.10, 0.10, 0.04, 16]} />
      </mesh>
      {/* Castors */}
      {starAngles.map((angle, i) => (
        <mesh key={`c-${i}`} material={mat}
          position={[Math.cos(angle) * (armLen - 0.05), 0.035, Math.sin(angle) * (armLen - 0.05)]}>
          <cylinderGeometry args={[0.055, 0.055, 0.05, 10]} />
        </mesh>
      ))}
    </group>
  )
}

function ToolBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button title={label} onClick={onClick} style={{
      width: '26px', height: '26px', borderRadius: '6px', border: '1px solid',
      borderColor: active ? 'rgba(99,179,237,0.5)' : 'rgba(255,255,255,0.07)',
      backgroundColor: active ? 'rgba(99,179,237,0.12)' : 'transparent',
      color: active ? '#63b3ed' : '#4a5568',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#4a5568' } }}
    >{icon}</button>
  )
}

export default function ModelViewer({ onClose, modelType = 'empty', pendingModel = 'empty', isGenerating = false, shapeDims = {}, heatmap: heatmapProp, onHeatmapToggle, cadUrls = null }: ModelViewerProps) {
  const [wireframe, setWireframe]     = useState(false)
  const [heatmap, setHeatmap]         = useState(false)
  useEffect(() => { if (heatmapProp !== undefined) setHeatmap(heatmapProp) }, [heatmapProp])

  const STRESS_ZONES: Record<string, { zone: string; label: string }[]> = {
    spur_gear:    [{ zone: 'critical', label: 'Root fillet — max bending stress' }, { zone: 'high', label: 'Pitch line contact' }, { zone: 'medium', label: 'Tooth flank' }, { zone: 'low', label: 'Tooth tip' }, { zone: 'safe', label: 'Gear body / hub' }],
    helical_gear: [{ zone: 'critical', label: 'Root fillet — helical contact' }, { zone: 'high', label: 'Lead entry zone' }, { zone: 'medium', label: 'Flank contact band' }, { zone: 'low', label: 'Tooth tip' }, { zone: 'safe', label: 'Gear body' }],
    shaft:        [{ zone: 'critical', label: 'Keyway stress concentration' }, { zone: 'high', label: 'Shoulder fillet — bearing seat' }, { zone: 'medium', label: 'Mid-span bending zone' }, { zone: 'low', label: 'Shaft body' }, { zone: 'safe', label: 'End sections' }],
    bearing:      [{ zone: 'critical', label: 'Inner race contact patch' }, { zone: 'high', label: 'Ball-raceway interface' }, { zone: 'medium', label: 'Outer race contact' }, { zone: 'low', label: 'Cage' }, { zone: 'safe', label: 'Housing shoulder' }],
    bolt:         [{ zone: 'critical', label: 'Thread root — first engaged' }, { zone: 'high', label: 'Shank-to-head fillet' }, { zone: 'medium', label: 'Thread engagement zone' }, { zone: 'low', label: 'Shank body' }, { zone: 'safe', label: 'Head bearing face' }],
    cube:         [{ zone: 'critical', label: 'Corner stress concentration' }, { zone: 'high', label: 'Edge load zone' }, { zone: 'medium', label: 'Face centre' }, { zone: 'low', label: 'Body' }, { zone: 'safe', label: 'Supported faces' }],
    rectangle:    [{ zone: 'critical', label: 'Corner concentration' }, { zone: 'high', label: 'Long edge bending' }, { zone: 'medium', label: 'Face centre' }, { zone: 'low', label: 'Body' }, { zone: 'safe', label: 'Base' }],
    sphere:       [{ zone: 'critical', label: 'Pole — max hoop stress' }, { zone: 'high', label: 'Upper hemisphere' }, { zone: 'medium', label: 'Equatorial band' }, { zone: 'low', label: 'Lower hemisphere' }, { zone: 'safe', label: 'Base contact' }],
    cylinder:     [{ zone: 'critical', label: 'End cap junction' }, { zone: 'high', label: 'Bore pressure wall' }, { zone: 'medium', label: 'Mid-body hoop' }, { zone: 'low', label: 'Outer wall' }, { zone: 'safe', label: 'End supports' }],
    pharma_table: [{ zone: 'critical', label: 'Leg-to-top weld joint' }, { zone: 'high', label: 'Tabletop centre span' }, { zone: 'medium', label: 'Cross brace connection' }, { zone: 'low', label: 'Leg mid-section' }, { zone: 'safe', label: 'Adjustable feet' }],
    pharma_chair: [{ zone: 'critical', label: 'Column-to-base junction' }, { zone: 'high', label: 'Star arm root' }, { zone: 'medium', label: 'Seat-to-column interface' }, { zone: 'low', label: 'Star arm body' }, { zone: 'safe', label: 'Castor housings' }],
  }
  const [gridVisible, setGrid]        = useState(true)
  const [autoRotate, setAutoRotate]   = useState(false)
  const [show2D, setShow2D]           = useState(false)
  const [zoomDelta, setZoomDelta]     = useState(0)
  const [dots, setDots]               = useState('.')
  // Each export/feature button now has its own toast message instead of one shared flag
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const controlsRef = useRef<any>(null)
  const sceneRef    = useRef<THREE.Scene | null>(null)

  useEffect(() => {
    if (!isGenerating) return
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(id)
  }, [isGenerating])

  useEffect(() => { setAutoRotate(false); setWireframe(false); setShow2D(false); setHeatmap(false) }, [modelType])

  useEffect(() => {
    if (pendingModel !== 'empty') setShow2D(true)
    else setShow2D(false)
  }, [pendingModel])

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const handleReset = useCallback(() => {
    setAutoRotate(false)
    setTimeout(() => controlsRef.current?.reset(), 50)
  }, [])

  const handleShowcase = useCallback(() => {
    if (autoRotate) { setAutoRotate(false); setTimeout(() => controlsRef.current?.reset(), 50) }
    else setAutoRotate(true)
  }, [autoRotate])

  const handleSave = useCallback(() => {
    const meta = MODEL_META[modelType]
    if (!meta.label) return
    const data = { model: meta.label, material: meta.material, specs: meta.specs, dims: shapeDims, savedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${meta.label.replace(/ /g, '_')}_spec.json`; a.click()
    URL.revokeObjectURL(url)
  }, [modelType, shapeDims])

  const handleExport = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.png`
    a.click()
  }, [modelType])

  const downloadFile = useCallback((url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const handleExportSTL = useCallback(() => {
    if (cadUrls?.stl_url) {
      downloadFile(cadUrls.stl_url, `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.stl`)
      return
    }
    if (!sceneRef.current) return
    const exporter = new STLExporter()
    const stl = exporter.parse(sceneRef.current, { binary: false })
    const blob = new Blob([stl], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.stl`
    a.click()
    URL.revokeObjectURL(url)
  }, [modelType, cadUrls, downloadFile])

  const handleExportSTEP = useCallback(() => {
    if (cadUrls?.step_url) {
      downloadFile(cadUrls.step_url, `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.step`)
    } else {
      showToast('STEP export — coming soon')
    }
  }, [cadUrls, modelType, downloadFile, showToast])

  const handleExportDXF = useCallback(() => {
    if (cadUrls?.dxf_url) {
      downloadFile(cadUrls.dxf_url, `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.dxf`)
    } else {
      showToast('DXF export — coming soon')
    }
  }, [cadUrls, modelType, downloadFile, showToast])

  const handleHeatmapClick = useCallback(() => {
    showToast('Stress heatmap — available when compute backend is connected')
  }, [showToast])

  const meta = MODEL_META[modelType]
  const isEmpty = modelType === 'empty' && pendingModel === 'empty'

  const displaySpecs = useMemo(() => {
    if (modelType === 'cube' && shapeDims.width) return [
      { label: 'Side', value: `${shapeDims.width} mm` },
      { label: 'Volume', value: `${Math.pow(shapeDims.width, 3).toLocaleString()} mm³` },
    ]
    if (modelType === 'rectangle' && shapeDims.width) return [
      { label: 'W × H × D', value: `${shapeDims.width} × ${shapeDims.height ?? '—'} × ${shapeDims.depth ?? '—'} mm` },
    ]
    if (modelType === 'sphere' && shapeDims.radius) return [
      { label: 'Radius', value: `${shapeDims.radius} mm` },
      { label: 'Diameter', value: `${shapeDims.radius * 2} mm` },
    ]
    if (modelType === 'cylinder' && shapeDims.radius) return [
      { label: 'Radius', value: `${shapeDims.radius} mm` },
      { label: 'Length', value: `${shapeDims.length ?? '—'} mm` },
    ]
    return meta.specs
  }, [modelType, shapeDims, meta.specs])

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#080e1a', display: 'flex', flexDirection: 'column' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', flexShrink: 0, backgroundColor: 'transparent' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#4a5568', fontFamily: F, letterSpacing: '1.2px', minWidth: '130px', textTransform: 'uppercase' }}>
          {isGenerating ? `Generating${dots}` : (meta.label || '3D Model Viewer')}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <ToolBtn icon={<Save size={12} />}     label="Save spec (JSON)" onClick={handleSave} />
          <ToolBtn icon={<Download size={12} />} label="Export PNG"       onClick={handleExport} />
          <ToolBtn icon={<span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>STL</span>} label="Export STL"            onClick={handleExportSTL} />
          <ToolBtn icon={<span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>STP</span>} label={cadUrls?.step_url ? 'Export STEP' : 'Export STEP — coming soon'} onClick={handleExportSTEP} />
          <ToolBtn icon={<span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1 }}>DXF</span>} label={cadUrls?.dxf_url ? 'Export DXF' : 'Export DXF — coming soon'} onClick={handleExportDXF} />
          <ToolBtn icon={<RotateCcw size={12} />} label="Reset view"  onClick={handleReset} />
          <ToolBtn icon={<ZoomIn size={12} />}    label="Zoom in"     onClick={() => setZoomDelta(1.5)} />
          <ToolBtn icon={<ZoomOut size={12} />}   label="Zoom out"    onClick={() => setZoomDelta(-1.5)} />
          <ToolBtn icon={<Box size={12} />}       label="Wireframe"   active={wireframe}   onClick={() => setWireframe(w => !w)} />
          <ToolBtn icon={<span style={{ fontSize: '10px' }}>🌡</span>} label="Stress heatmap" active={false} onClick={handleHeatmapClick} />
          <ToolBtn icon={<Grid3x3 size={12} />}   label="Toggle grid" active={gridVisible} onClick={() => setGrid(g => !g)} />
        </div>

        <button onClick={onClose}
          style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4a5568'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        ><X size={12} /></button>
      </div>

      {/* ── Canvas area ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── Empty state ── */}
        {isEmpty && !isGenerating && <EmptyState />}

        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,14,26,0.92)', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(99,179,237,0.12)', borderTopColor: '#63b3ed', animation: 'mvSpin 0.9s linear infinite', marginBottom: '14px' }} />
            <span style={{ fontSize: '10px', color: '#4a5568', fontFamily: F, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Generating model{dots}</span>
          </div>
        )}

        {autoRotate && modelType !== 'empty' && (
          <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 5, backgroundColor: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: '99px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#6ee7b7' }} />
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#6ee7b7', fontFamily: F, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Showcase</span>
          </div>
        )}

        {wireframe && !show2D && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 5, backgroundColor: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: '99px', padding: '4px 10px' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#63b3ed', fontFamily: F, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Wireframe</span>
          </div>
        )}
        {show2D && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 5, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '99px', padding: '4px 10px' }}>
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#ffffff', fontFamily: F, letterSpacing: '0.1em', textTransform: 'uppercase' }}>2D Drawing</span>
          </div>
        )}

        {show2D && (modelType !== 'empty' || pendingModel !== 'empty') && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 6, transition: 'opacity 0.4s ease', opacity: 1 }}>
            <Drawing2D
              modelType={pendingModel !== 'empty' ? pendingModel : modelType}
              shapeDims={shapeDims}
              meta={MODEL_META[pendingModel !== 'empty' ? pendingModel : modelType]}
              isPending={pendingModel !== 'empty'}
            />
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, display: show2D ? 'none' : 'block' }}>
          <Canvas
            frameloop="demand"
            camera={{ position: [0, 1.5, 6], fov: 45 }}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            style={{ width: '100%', height: '100%', background: '#080e1a' }}
          >
            <Suspense fallback={null}>
              <SceneCapture sceneRef={sceneRef} />
              <ambientLight intensity={1.0} />
              <directionalLight position={[8, 12, 8]}   intensity={2.8} color="#ffffff" />
              <directionalLight position={[-6, 6, -4]}  intensity={1.4} color="#d0e4ff" />
              <directionalLight position={[0, -4, -6]}  intensity={0.8} color="#9aaecc" />
              <directionalLight position={[4, 2, -8]}   intensity={1.2} color="#ffffff" />
              <pointLight       position={[0, 5, 4]}    intensity={1.6} color="#ffffff" />
              <pointLight       position={[-4, 2, 2]}   intensity={0.9} color="#c8dcff" />
              <InfiniteGrid visible={gridVisible} />
              {modelType === 'spur_gear'    && <SpurGearModel    ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'helical_gear' && <HelicalGearModel ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'shaft'        && <ShaftModel       ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'bearing'      && <BearingModel     ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'bolt'         && <BoltModel        ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'cube'         && <CubeModel        dims={shapeDims} ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'rectangle'    && <RectangleModel   dims={shapeDims} ar={autoRotate} wireframe={wireframe} />}
              {modelType === 'sphere'       && <SphereModel      dims={shapeDims} ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'cylinder'     && <CylinderModel    dims={shapeDims} ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'pharma_table' && <PharmaTableModel dims={shapeDims} ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
              {modelType === 'pharma_chair' && <PharmaChairModel ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
    
          {zoomDelta !== 0 && <CameraZoom delta={zoomDelta} onDone={() => setZoomDelta(0)} />}
              <OrbitControls
                ref={controlsRef}
                enablePan enableZoom enableRotate
                enableDamping dampingFactor={0.08}
                minDistance={2} maxDistance={20}
                minPolarAngle={0} maxPolarAngle={Math.PI}
                minAzimuthAngle={-Infinity} maxAzimuthAngle={Infinity}
                enabled={!autoRotate}
                autoRotate={autoRotate}
                autoRotateSpeed={1.2}
              />
              <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
                <GizmoViewport axisColors={['#ff4444', '#44dd88', '#4488ff']} labelColor="white" />
              </GizmoHelper>
            </Suspense>
          </Canvas>
        </div>



        {toastMessage && (
          <div style={{ position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)', background: 'rgba(12,20,34,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 18px', zIndex: 20, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeSlideUp 0.2s ease' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', fontFamily: F, letterSpacing: '0.1em', textTransform: 'uppercase' }}>COMING SOON</span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: F }}>{toastMessage}</span>
          </div>
        )}

        {displaySpecs.length > 0 && !isGenerating && (
          <div style={{ position: 'absolute', bottom: '48px', left: '12px', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: '8px', padding: '8px 12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {meta.material && (
              <div style={{ marginBottom: '6px', paddingBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '9px', color: '#63b3ed', fontFamily: F, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{meta.material}</span>
              </div>
            )}
            {displaySpecs.map(item => (
              <div key={item.label} style={{ display: 'flex', gap: '10px', marginBottom: '2px' }}>
                <span style={{ fontSize: '10px', color: '#374151', fontFamily: F, width: '76px' }}>{item.label}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: F, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '6px 13px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: 'transparent' }}>
        <div style={{ display: 'flex', gap: '18px' }}>
          {(autoRotate
            ? ['Click ▶ to stop', 'Orbit disabled in showcase']
            : ['Left drag — rotate', 'Right drag — pan', 'Scroll — zoom']
          ).map(h => (
            <span key={h} style={{ fontSize: '10px', color: '#1e2d40', fontFamily: F }}>{h}</span>
          ))}
        </div>
        <span style={{ fontSize: '10px', color: '#1e2d40', fontFamily: F }}>MecAI v0.1</span>
      </div>

      <style>{`
        @keyframes mvSpin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateX(-50%) translateY(6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  )
}