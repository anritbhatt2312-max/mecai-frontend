'use client'

import { Suspense, useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { X, Save, Download, RotateCcw, ZoomIn, ZoomOut, Grid3x3 } from 'lucide-react'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { useLoader } from '@react-three/fiber'

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

function RealSTLModel({ url, ar, wireframe }: { url: string; ar: boolean; wireframe: boolean }) {
  const geometry = useLoader(STLLoader, url)
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.5 })
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  const centeredGeometry = useMemo(() => {
    const geo = geometry.clone()
    geo.computeBoundingBox()
    const box = geo.boundingBox!
    const center = new THREE.Vector3()
    box.getCenter(center)
    geo.translate(-center.x, -center.y, -center.z)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? 3.0 / maxDim : 1
    geo.scale(scale, scale, scale)
    return geo
  }, [geometry])
  return <mesh ref={ref} geometry={centeredGeometry} material={mat} />
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
        <mesh key={i} geometry={geo} material={mat} position={[0, (i - slices / 2) * 0.075, 0]} rotation={[0, (i / slices) * 0.45, 0]} />
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

function RectangleModel({ dims, ar, wireframe }: { dims: ShapeDimensions; ar: boolean; wireframe: boolean }) {
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
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, pointerEvents: 'none' }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ opacity: 0.12 }}>
        <polygon points={pts.join(' ')} fill="none" stroke="#63b3ed" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={IR} fill="none" stroke="#63b3ed" strokeWidth="1" strokeDasharray="4,3" />
        <circle cx={cx} cy={cy} r={bore} fill="none" stroke="#63b3ed" strokeWidth="1.5" />
        <line x1={cx-OR-8} y1={cy} x2={cx+OR+8} y2={cy} stroke="#63b3ed" strokeWidth="0.7" strokeDasharray="6,3" />
        <line x1={cx} y1={cy-OR-8} x2={cx} y2={cy+OR+8} stroke="#63b3ed" strokeWidth="0.7" strokeDasharray="6,3" />
        <circle cx={cx+OR+18} cy={cy+OR+18} r={18} fill="none" stroke="#63b3ed" strokeWidth="1" strokeDasharray="3,2" />
        <circle cx={cx+OR+18} cy={cy+OR+18} r={6} fill="none" stroke="#63b3ed" strokeWidth="1" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.22)', fontFamily: F, letterSpacing: '0.01em' }}>Generate a component to view it here</p>
        <p style={{ margin: '5px 0 0', fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.12)', fontFamily: F }}>Try: "generate a spur gear" or "show a bolt"</p>
      </div>
    </div>
  )
}

const MODEL_META: Record<ModelType, { label: string; material: string; specs: { label: string; value: string }[] }> = {
  spur_gear:    { label: 'Spur Gear',       material: '4140 Chromoly Steel',   specs: [{ label: 'Teeth', value: '20' }, { label: 'Module', value: '2.0 mm' }, { label: 'Pitch \u00d8', value: '40 mm' }] },
  helical_gear: { label: 'Helical Gear',    material: '4140 Chromoly Steel',   specs: [{ label: 'Teeth', value: '18' }, { label: 'Helix', value: '20\u00b0' }, { label: 'Module', value: '2.0 mm' }] },
  shaft:        { label: 'Steel Shaft',     material: '1045 Medium Carbon',    specs: [{ label: '\u00d8', value: '64 mm' }, { label: 'Length', value: '360 mm' }, { label: 'Finish', value: 'Ra 0.8 \u03bcm' }] },
  bearing:      { label: 'Ball Bearing',    material: '52100 Bearing Steel',   specs: [{ label: 'Type', value: '6308 Deep Groove' }, { label: 'Balls', value: '10' }, { label: 'OD', value: '90 mm' }] },
  bolt:         { label: 'Hex Bolt M12',    material: 'Grade 8.8 Alloy Steel', specs: [{ label: 'Standard', value: 'ISO 4014' }, { label: 'Grade', value: '8.8' }, { label: 'Torque', value: '85 Nm' }] },
  cube:         { label: 'Cube',            material: 'Structural Steel',      specs: [{ label: 'Faces', value: '6' }, { label: 'Edges', value: '12' }, { label: 'E', value: '200 GPa' }] },
  rectangle:    { label: 'Rectangular Box', material: 'Structural Steel',      specs: [{ label: 'Faces', value: '6' }, { label: 'Type', value: 'Cuboid' }, { label: 'E', value: '200 GPa' }] },
  sphere:       { label: 'Sphere',          material: '316 Stainless Steel',   specs: [{ label: 'Type', value: 'Solid Ball' }, { label: 'Surface', value: 'Polished' }, { label: 'E', value: '193 GPa' }] },
  cylinder:     { label: 'Cylinder',        material: 'Structural Steel',      specs: [{ label: 'Ends', value: 'Flat' }, { label: 'E', value: '200 GPa' }, { label: 'Type', value: 'Solid' }] },
  pharma_table: { label: 'Pharma SS Table', material: '316L Stainless Steel (GMP)', specs: [{ label: 'Finish', value: 'Ra \u2264 0.8 \u03bcm' }, { label: 'Standard', value: 'GMP / cGMP' }, { label: 'Load', value: '200 kg UDL' }] },
  pharma_chair: { label: 'Pharma SS Chair', material: '304 Stainless Steel (GMP)', specs: [{ label: 'Seat H', value: '450\u2013650 mm' }, { label: 'Type', value: 'Swivel / ESD' }, { label: 'Rating', value: 'ISO 14644' }] },
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
  stlUrl?: string | null
  realSpecs?: { type: string; dimensions: string; material: string } | null
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
      <rect x={labelX-16} y={labelY-6} width={32} height={8} fill="white" stroke="none" transform={vertical ? `rotate(-90,${labelX},${labelY})` : undefined} />
      <text x={labelX} y={labelY} fill={DIM_COLOR} fontSize="6.5" fontFamily="'DM Sans',monospace" textAnchor="middle" transform={vertical ? `rotate(-90,${labelX},${labelY})` : undefined}>{label}</text>
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
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#d0d8e0', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', gap: '10px' }}>
      {isPending && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: '99px', padding: '5px 14px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#63b3ed', animation: 'mvSpin 1.2s ease-in-out infinite' }} />
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#63b3ed', fontFamily: F, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Preparing 3D model...</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ maxWidth: '100%', maxHeight: '100%', filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.25))' }}>
        {defs}{bg}
        <text x={cx} y={cy} fill={TEXT_COLOR} fontSize="11" fontFamily="'DM Sans',monospace" textAnchor="middle" opacity="0.4">2D Drawing</text>
      </svg>
    </div>
  )
}

function PharmaTableModel({ dims, ar, wireframe }: { dims: ShapeDimensions; ar: boolean; wireframe: boolean }) {
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
  return (
    <group ref={ref} position={[0, -legH / 2 - topThick / 2, 0]}>
      <mesh material={mat} position={[0, legH + topThick / 2, 0]}><boxGeometry args={[W, topThick, D]} /></mesh>
      <mesh material={matDark} position={[0, legH * 0.38, 0]}><boxGeometry args={[W - 0.12, topThick * 0.6, D - 0.12]} /></mesh>
      {([[-1,-1],[1,-1],[1,1],[-1,1]] as [number,number][]).map(([sx, sz], i) => (
        <mesh key={i} material={matDark} position={[sx * legOffX, legH / 2, sz * legOffZ]}>
          <cylinderGeometry args={[legR, legR * 1.1, legH, 16]} />
        </mesh>
      ))}
    </group>
  )
}

function PharmaChairModel({ ar, wireframe }: { ar: boolean; wireframe: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (ref.current && ar) ref.current.rotation.y += d * 0.4 })
  const mat     = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('stainless') }), [])
  const matDark = useMemo(() => new THREE.MeshStandardMaterial({ ...matProps('steel_dark') }), [])
  useEffect(() => { mat.wireframe = wireframe; mat.needsUpdate = true }, [mat, wireframe])
  useEffect(() => { matDark.wireframe = wireframe; matDark.needsUpdate = true }, [matDark, wireframe])
  const seatY = 1.2, seatR = 0.55, colR = 0.06, colH = seatY - 0.15, armLen = 0.7
  const starAngles = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2)
  return (
    <group ref={ref} position={[0, -seatY / 2 - 0.1, 0]}>
      <mesh material={mat} position={[0, seatY, 0]}><cylinderGeometry args={[seatR, seatR * 0.95, 0.06, 32]} /></mesh>
      <mesh material={matDark} position={[0, colH / 2 + 0.1, 0]}><cylinderGeometry args={[colR, colR * 0.85, colH, 16]} /></mesh>
      {starAngles.map((angle, i) => (
        <mesh key={i} material={matDark} position={[Math.cos(angle) * armLen / 2, 0.06, Math.sin(angle) * armLen / 2]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[armLen, 0.035, 0.05]} />
        </mesh>
      ))}
    </group>
  )
}

function ToolBtn({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
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
    >{children}</button>
  )
}

export default function ModelViewer({ onClose, modelType = 'empty', pendingModel = 'empty', isGenerating = false, shapeDims = {}, heatmap: heatmapProp, onHeatmapToggle, cadUrls = null, stlUrl = null, realSpecs = null }: ModelViewerProps) {
  const [wireframe, setWireframe] = useState(false)
  const [heatmap, setHeatmap]     = useState(false)
  useEffect(() => { if (heatmapProp !== undefined) setHeatmap(heatmapProp) }, [heatmapProp])
  const [gridVisible, setGrid]    = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [show2D, setShow2D]       = useState(false)
  const [zoomDelta, setZoomDelta] = useState(0)
  const [dots, setDots]           = useState('.')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const controlsRef = useRef<any>(null)
  const sceneRef    = useRef<THREE.Scene | null>(null)

  useEffect(() => {
    if (!isGenerating) return
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(id)
  }, [isGenerating])

  useEffect(() => { setAutoRotate(false); setWireframe(false); setShow2D(false); setHeatmap(false) }, [modelType])
  useEffect(() => { if (pendingModel !== 'empty') setShow2D(true); else setShow2D(false) }, [pendingModel])

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const handleReset    = useCallback(() => { setAutoRotate(false); setTimeout(() => controlsRef.current?.reset(), 50) }, [])
  const handleShowcase = useCallback(() => { if (autoRotate) { setAutoRotate(false); setTimeout(() => controlsRef.current?.reset(), 50) } else setAutoRotate(true) }, [autoRotate])

  const handleSave = useCallback(() => {
    const meta = MODEL_META[modelType]
    if (!meta.label) return
    const data = { model: meta.label, material: meta.material, specs: meta.specs, dims: shapeDims, savedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${meta.label.replace(/ /g, '_')}_spec.json`; a.click()
    URL.revokeObjectURL(url)
  }, [modelType, shapeDims])

  const handleExport = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a'); a.href = url; a.download = `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.png`; a.click()
  }, [modelType])

  const downloadFile = useCallback((url: string, filename: string) => {
    const a = document.createElement('a'); a.href = url; a.download = filename; a.target = '_blank'; a.rel = 'noopener noreferrer'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }, [])

  const handleExportSTL = useCallback(() => {
    if (cadUrls?.stl_url) { downloadFile(cadUrls.stl_url, `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.stl`); return }
    if (stlUrl) { downloadFile(stlUrl, `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.stl`); return }
    if (!sceneRef.current) return
    const exporter = new STLExporter()
    const stl = exporter.parse(sceneRef.current, { binary: false })
    const blob = new Blob([stl], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.stl`; a.click()
    URL.revokeObjectURL(url)
  }, [modelType, cadUrls, stlUrl, downloadFile])

  const handleExportSTEP = useCallback(() => {
    if (cadUrls?.step_url) downloadFile(cadUrls.step_url, `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.step`)
    else showToast('STEP export — coming soon')
  }, [cadUrls, modelType, downloadFile, showToast])

  const handleExportDXF = useCallback(() => {
    if (cadUrls?.dxf_url) downloadFile(cadUrls.dxf_url, `${MODEL_META[modelType]?.label?.replace(/ /g, '_') ?? 'model'}.dxf`)
    else showToast('DXF export — coming soon')
  }, [cadUrls, modelType, downloadFile, showToast])

  const meta = MODEL_META[modelType]
  const isEmpty = modelType === 'empty' && pendingModel === 'empty'
  const hasRealStl = Boolean(stlUrl)

  const displaySpecs = useMemo(() => {
    if (modelType === 'cube' && shapeDims.width) return [{ label: 'Side', value: `${shapeDims.width} mm` }, { label: 'Volume', value: `${Math.pow(shapeDims.width, 3).toLocaleString()} mm³` }]
    if (modelType === 'sphere' && shapeDims.radius) return [{ label: 'Radius', value: `${shapeDims.radius} mm` }, { label: 'Diameter', value: `${shapeDims.radius * 2} mm` }]
    if (modelType === 'cylinder' && shapeDims.radius) return [{ label: 'Radius', value: `${shapeDims.radius} mm` }, { label: 'Length', value: `${shapeDims.length ?? '—'} mm` }]
    return meta.specs
  }, [modelType, shapeDims, meta.specs])

  const StressIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="3" y2="3" strokeWidth="1.7"/>
      <line x1="3" y1="21" x2="21" y2="21" strokeWidth="1.7"/>
      <path d="M3 21 C3 21 8 8 11 6 S15 4 21 3" strokeWidth="1.7" fill="none"/>
      <text x="1" y="8" fontSize="4" stroke="none" fill="currentColor" fontStyle="italic">σ</text>
      <text x="18" y="20" fontSize="4" stroke="none" fill="currentColor" fontStyle="italic">ε</text>
    </svg>
  )

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#080e1a', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#4a5568', fontFamily: F, letterSpacing: '1.2px', minWidth: '130px', textTransform: 'uppercase' }}>
          {isGenerating ? `Generating${dots}` : (meta.label || '3D Model Viewer')}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <ToolBtn label="Save spec (JSON)" onClick={handleSave}><Save size={12} /></ToolBtn>
          <ToolBtn label="Export PNG"       onClick={handleExport}><Download size={12} /></ToolBtn>
          <ToolBtn label="Export STL"       onClick={handleExportSTL}><span style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1 }}>STL</span></ToolBtn>
          <ToolBtn label={cadUrls?.step_url ? 'Export STEP' : 'Export STEP — coming soon'} onClick={handleExportSTEP}><span style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1 }}>STP</span></ToolBtn>
          <ToolBtn label={cadUrls?.dxf_url ? 'Export DXF' : 'Export DXF — coming soon'} onClick={handleExportDXF}><span style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1 }}>DXF</span></ToolBtn>
          <ToolBtn label="Reset view"   onClick={handleReset}><RotateCcw size={12} /></ToolBtn>
          <ToolBtn label="Zoom in"      onClick={() => setZoomDelta(1.5)}><ZoomIn size={12} /></ToolBtn>
          <ToolBtn label="Zoom out"     onClick={() => setZoomDelta(-1.5)}><ZoomOut size={12} /></ToolBtn>
          <ToolBtn label="Toggle grid"  active={gridVisible} onClick={() => setGrid(g => !g)}><Grid3x3 size={12} /></ToolBtn>
          <ToolBtn label="2D Drawing" active={show2D} onClick={() => setShow2D(s => !s)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="1"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </ToolBtn>
          {/* #7 Stress & Strain Simulation */}
          <ToolBtn label="Stress & Strain Simulation — coming in V1" active={false} onClick={() => showToast('Stress & Strain simulation — coming in V1')}>
            <StressIcon />
          </ToolBtn>
        </div>

        <button onClick={onClose}
          style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4a5568'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        ><X size={12} /></button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
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
          <div style={{ position: 'absolute', inset: 0, zIndex: 6 }}>
            <Drawing2D
              modelType={pendingModel !== 'empty' ? pendingModel : modelType}
              shapeDims={shapeDims}
              meta={MODEL_META[pendingModel !== 'empty' ? pendingModel : modelType]}
              isPending={pendingModel !== 'empty'}
            />
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, display: show2D ? 'none' : 'block' }}>
          <Canvas frameloop="demand" camera={{ position: [0, 1.5, 6], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true }} style={{ width: '100%', height: '100%', background: '#080e1a' }}>
            <Suspense fallback={null}>
              <SceneCapture sceneRef={sceneRef} />
              <ambientLight intensity={1.0} />
              <directionalLight position={[8, 12, 8]}  intensity={2.8} color="#ffffff" />
              <directionalLight position={[-6, 6, -4]} intensity={1.4} color="#d0e4ff" />
              <directionalLight position={[0, -4, -6]} intensity={0.8} color="#9aaecc" />
              <directionalLight position={[4, 2, -8]}  intensity={1.2} color="#ffffff" />
              <pointLight       position={[0, 5, 4]}   intensity={1.6} color="#ffffff" />
              <pointLight       position={[-4, 2, 2]}  intensity={0.9} color="#c8dcff" />
              <InfiniteGrid visible={gridVisible} />
              {hasRealStl ? (
                <RealSTLModel url={stlUrl!} ar={autoRotate} wireframe={wireframe} />
              ) : (
                <>
                  {modelType === 'spur_gear'    && <SpurGearModel    ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'helical_gear' && <HelicalGearModel ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'shaft'        && <ShaftModel       ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'bearing'      && <BearingModel     ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'bolt'         && <BoltModel        ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'cube'         && <CubeModel        dims={shapeDims} ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'rectangle'    && <RectangleModel   dims={shapeDims} ar={autoRotate} wireframe={wireframe} />}
                  {modelType === 'sphere'       && <SphereModel      dims={shapeDims} ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'cylinder'     && <CylinderModel    dims={shapeDims} ar={autoRotate} wireframe={wireframe} heatmap={heatmap} />}
                  {modelType === 'pharma_table' && <PharmaTableModel dims={shapeDims} ar={autoRotate} wireframe={wireframe} />}
                  {modelType === 'pharma_chair' && <PharmaChairModel ar={autoRotate} wireframe={wireframe} />}
                </>
              )}
              {zoomDelta !== 0 && <CameraZoom delta={zoomDelta} onDone={() => setZoomDelta(0)} />}
              <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate enableDamping dampingFactor={0.08} minDistance={2} maxDistance={20} minPolarAngle={0} maxPolarAngle={Math.PI} enabled={!autoRotate} autoRotate={autoRotate} autoRotateSpeed={1.2} />
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

      <div style={{ padding: '6px 13px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '18px' }}>
          {(autoRotate ? ['Click ▶ to stop', 'Orbit disabled in showcase'] : ['Left drag — rotate', 'Right drag — pan', 'Scroll — zoom']).map(h => (
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