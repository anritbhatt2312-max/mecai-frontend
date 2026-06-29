// app/chat/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import LoginTransition from '@/components/LoginTransition'
import ProjectsPage from '@/components/ProjectsPage'
import { useSmartSuggestions, trackMessage } from '@/hooks/useSmartSuggestions'
import { ArrowUp, Paperclip, FolderOpen, X, Search, StopCircle } from 'lucide-react'
import ModelViewer, { ModelType, ShapeDimensions } from '@/components/viewer/ModelViewer'
import Sidebar, { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, ThemePreference } from '@/components/sidebar/Sidebar'

const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"

interface Message { role: 'user' | 'assistant'; lines: string[]; visibleLines: number }

// ── Pharma table/chair conversational flow ────────────────────────────────
interface PharmaFlow {
  type: 'table' | 'chair'
  step: 'length' | 'width' | 'height' | 'chairs' | 'grade' | 'done'
  length?: number
  width?: number
  height?: number
  chairs?: number
  grade?: string
}

const PHARMA_QUESTIONS: Record<string, string> = {
  length: `What length do you need for the table? (standard pharma plant tables are 1200–2400 mm)`,
  width:  `What width? (standard range: 600–900 mm for single-sided workbenches, 900–1200 mm for double-sided)`,
  height: `What working height? (standard GMP height is 900 mm, adjustable-leg versions go 700–1100 mm)`,
  chairs: `How many chairs to pair with this table? (or 0 for table only)`,
  grade:  `Which stainless steel grade — 304 (general use) or 316L (higher corrosion resistance, recommended for wet areas and API contact)?`,
}

const PHARMA_TABLE_RESPONSE = (flow: PharmaFlow) => `Here is your pharma-grade stainless steel workstation.
Table dimensions: ${flow.length} mm L × ${flow.width} mm W × ${flow.height} mm H.
Material: ${flow.grade} stainless steel, 2B finish (Ra ≤ 0.8 μm) — compliant with GMP/cGMP requirements.
Coved internal corners — no dead zones for bacterial growth, cleanable without disassembly.
Welded tubular legs with adjustable feet (±25 mm) for levelling on uneven floors.
Undershelf optional — 304 SS mesh or solid sheet, same finish.
${(flow.chairs ?? 0) > 0 ? `${flow.chairs} cleanroom chair(s) included — 304 SS frame, perforated seat/back, footrest ring, ESD-safe castors.` : 'Table only configuration — no chairs.'}
Load capacity: 200 kg UDL on tabletop surface.
All welds are continuous and ground flush — no crevices for contamination.
Compliant with FDA 21 CFR Part 211, EU GMP Annex 1, and ISO 14644 cleanroom standards.`

const RESPONSES: Record<string, string> = {
  spur_gear: `Here is your spur gear model.
Spur gears are the most common gear type with straight teeth parallel to the rotation axis.
Teeth count: 20, Module: 2.0 mm, Pitch diameter: 40 mm.
Material: 4140 chromoly steel, heat-treated to 58 HRC.
Max recommended tangential load: 3.8 kN at the pitch circle.
Pressure angle: 20 degrees — the industry standard for most applications.`,
  helical_gear: `Here is your helical gear model.
Helical gears run quieter than spur gears due to gradual tooth engagement.
Teeth count: 18, Helix angle: 20 degrees, Normal module: 2.0 mm.
Material: 4140 chromoly steel.
The helical geometry produces axial thrust — thrust bearings are required on the shaft.
Recommended for applications above 1500 RPM where noise is a concern.`,
  shaft: `Here is your shaft model with shoulders and keyway.
Shaft diameter: 64 mm, Material: 1045 medium carbon steel, ground finish Ra 0.8 um.
The two shoulders locate bearings axially — interference fit H7/p6 recommended.
Keyway dimensions (DIN 6885): 12 x 8 x 50 mm for torque transmission.
At 3000 RPM with 80 Nm bending moment, safety factor = 2.66 — well within limits.`,
  materials: `Material comparison: 4140 Chromoly Steel vs 316 Stainless Steel for a marine pump shaft.
4140 Chromoly — Yield strength: 655 MPa, UTS: 850 MPa, Hardness: 28 HRC, cost: low.
4140 Chromoly — Corrosion resistance: poor in saltwater without coating.
316 Stainless — Yield strength: 310 MPa, UTS: 620 MPa, Hardness: 18 HRC, cost: high.
316 Stainless — Corrosion resistance: excellent in marine environments.
Verdict: for a marine pump shaft, 316 stainless is strongly recommended despite lower strength.
Saltwater corrosion will destroy uncoated 4140 within months — the strength advantage is irrelevant.
If high strength is critical, consider duplex 2205 stainless (yield 450 MPa, excellent marine resistance).`,
  physics: `Von Mises stress analysis — 64mm shaft at 3000 RPM, torque 120 Nm, bending 80 Nm.
Shear stress from torque: tau = 16T divided by pi x d cubed = 14.7 MPa.
Bending stress: sigma_b = 32M divided by pi x d cubed = 19.6 MPa.
Von Mises stress: sigma_vm = sqrt(sigma_b squared + 3 x tau squared) = 32.1 MPa.
Material: 1045 steel, yield strength Sy = 530 MPa.
Safety factor: n = 530 divided by 32.1 = 16.5 — extremely safe at this diameter.
Fatigue check using Goodman criterion: alternating stress 32.1 MPa vs endurance limit 265 MPa — passes.
This shaft is well within safe operating limits. No design changes needed.`,
  bearing: `Here is your deep groove ball bearing model.
Type: 6308 deep groove ball bearing, 10 balls, 52100 bearing steel.
Bore: 40 mm, Outer diameter: 90 mm, Width: 23 mm.
Dynamic load rating C: 42 kN, Static load rating C0: 24 kN.
Max speed: 6000 RPM with grease lubrication.
Suitable for radial and moderate axial loads in both directions.`,
  bolt: `Here is your M12 hex bolt model.
Standard: ISO 4014, Grade 8.8 alloy steel, zinc-plated.
Thread: M12 x 1.75 mm pitch, shank length 60 mm.
Proof load: 58.8 kN, Ultimate tensile load: 91.4 kN.
Recommended torque: 85 Nm with lubricated threads.
Use Grade 10 washers and prevailing-torque nuts for critical joints.`,
  cube: `Here is your cube model.
A perfect regular hexahedron — all six faces are equal squares.
Volume equals side cubed, Surface area equals 6 times side squared.
Material: structural steel (E = 200 GPa).
Would you like a stress analysis under a specific load case?`,
  rectangle: `Here is your rectangular box model.
Volume equals width times height times depth.
Material: structural steel (E = 200 GPa).
Ideal geometry for housing, bracket, or enclosure design.
Would you like wall thickness or bending stress calculations?`,
  sphere: `Here is your sphere model.
Volume equals 4/3 times pi times r cubed. Surface area equals 4 times pi times r squared.
A sphere has no stress concentrations under uniform internal pressure.
Material: structural steel. Ideal for pressure vessels or bearing balls.`,
  cylinder: `Here is your cylinder model.
Volume equals pi times r squared times h. Surface area equals 2 times pi times r times (r + h).
Used extensively in shafts, pressure vessels, and hydraulic actuators.
Material: structural steel. Would you like torsion or bending stress analysis?`,
  fatigue: `Fatigue life analysis — 42CrMo4 steel shaft, fully reversed bending 180 MPa at 2800 RPM.
Material properties: UTS = 1000 MPa, Yield = 850 MPa, Brinell hardness 300 HB.
Endurance limit estimate (Marin equation): Se' = 0.5 x UTS = 500 MPa.
Surface factor ka = 0.72 (machined finish), Size factor kb = 0.85 (shaft Ø > 50mm).
Reliability factor kc = 0.868 (99% reliability), Temperature factor kd = 1.0.
Modified endurance limit: Se = 0.72 x 0.85 x 0.868 x 500 = 265 MPa.
Goodman criterion: sigma_a / Se + sigma_m / UTS = 1 (fully reversed, sigma_m = 0).
Safety factor: n = Se / sigma_a = 265 / 180 = 1.47 — marginal, borderline safe.
Basquin equation for finite life: N = (sigma_a / sigma_f')^(1/b).
sigma_f' = 1.5 x UTS = 1500 MPa, b = -0.085 (steel).
Cycles to failure: N = (180 / 1500)^(1 / -0.085) = 387,000 cycles.
At 2800 RPM, time to failure: 387,000 / 2800 = 138 minutes of continuous operation.
Recommendation: increase shaft diameter or use shot peening to raise endurance limit.
A safety factor below 2.0 is not recommended for rotating machinery.`,
  heatmap: `Stress heatmap activated — simulated FEA analysis displayed on the model.
Red zones indicate critical stress concentrations — highest risk of fatigue failure.
Orange zones show high stress areas — monitor under cyclic loading conditions.
Yellow zones are medium stress — generally safe but worth noting under peak loads.
Green zones are low stress — structurally sound under normal operating conditions.
Note: this is a simulated heatmap for visualisation purposes.
Real FEA analysis will be available when the MecAI compute backend is connected.
Always verify with certified FEA software before manufacturing critical components.`,
  default: `I have received your request.
MecAI can generate spur gears, helical gears, shafts, bearings, bolts, basic shapes, and pharma-grade stainless steel furniture.
Try: generate a spur gear, show me a bolt, make a pharma table, or design a cleanroom chair.`,
}

function getResponse(input: string): string {
  const l = input.toLowerCase()
  if (l.includes('spur')) return RESPONSES.spur_gear
  if (l.includes('helical')) return RESPONSES.helical_gear
  if (l.includes('material') || l.includes('chromoly') || l.includes('marine')) return RESPONSES.materials
  if (l.includes('fatigue') || l.includes('goodman') || l.includes('cycles to failure') || l.includes('fatigue life') || l.includes('basquin')) return RESPONSES.fatigue
  if (l.includes('von mises') || l.includes('physics') || l.includes('stress') || l.includes('torque') || l.includes('bending') || l.includes('safe')) return RESPONSES.physics
  if (l.includes('shaft')) return RESPONSES.shaft
  if (l.includes('bearing')) return RESPONSES.bearing
  if (l.includes('bolt') || l.includes('screw') || l.includes('fastener')) return RESPONSES.bolt
  if (l.includes('cube') || l.includes('square block')) return RESPONSES.cube
  if (l.includes('rectangle') || l.includes('cuboid') || l.includes('rectangular box')) return RESPONSES.rectangle
  if (l.includes('box') && !l.includes('gear')) return RESPONSES.rectangle
  if (l.includes('sphere') || l.includes('ball')) return RESPONSES.sphere
  if (l.includes('cylinder')) return RESPONSES.cylinder
  if (l.includes('gear')) return RESPONSES.spur_gear
  return RESPONSES.default
}

function getModelType(input: string): ModelType | null {
  const l = input.toLowerCase()
  const hasGenerateIntent = l.includes('generate') || l.includes('show') || l.includes('create') || l.includes('make') || l.includes('draw') || l.includes('build') || l.includes('model') || l.includes('design')
  if (!hasGenerateIntent) return null
  if (l.includes('spur') || (l.includes('gear') && !l.includes('gearbox'))) return 'spur_gear'
  if (l.includes('helical')) return 'helical_gear'
  if (l.includes('shaft')) return 'shaft'
  if (l.includes('bearing')) return 'bearing'
  if (l.includes('bolt') || l.includes('screw') || l.includes('fastener')) return 'bolt'
  if (l.includes('cube') || l.includes('square')) return 'cube'
  if (l.includes('rectangle') || l.includes('cuboid') || l.includes('box')) return 'rectangle'
  if (l.includes('sphere') || l.includes('ball')) return 'sphere'
  if (l.includes('cylinder')) return 'cylinder'
  return null
}

function parseDimensions(input: string): ShapeDimensions {
  const nums = [...input.matchAll(/(\d+(?:\.\d+)?)\s*(?:mm|cm|m)?/g)].map(m => parseFloat(m[1]))
  const l = input.toLowerCase()
  if (l.includes('cube') || l.includes('square block')) return { width: nums[0] ?? 100 }
  if (l.includes('rectangle') || l.includes('box') || l.includes('cuboid')) return { width: nums[0] ?? 200, height: nums[1] ?? 100, depth: nums[2] ?? 80 }
  if (l.includes('sphere') || l.includes('ball')) return { radius: nums[0] ?? 80 }
  if (l.includes('cylinder')) return { radius: nums[0] ?? 50, length: nums[1] ?? 200 }
  if (l.includes('shaft')) return { radius: (nums[0] ?? 22) / 2, length: nums[1] ?? 300 }
  return {}
}

function splitLines(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter(l => l.trim().length > 0)
}

function extractNumber(input: string): number | null {
  const m = input.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

function isPharmaIntent(input: string): boolean {
  const l = input.toLowerCase()
  return (l.includes('table') || l.includes('chair') || l.includes('workbench') || l.includes('bench') || l.includes('stool')) &&
    (l.includes('pharma') || l.includes('stainless') || l.includes('cleanroom') || l.includes('gmp') || l.includes('316') || l.includes('304') || l.includes('plant') || l.includes('lab') || l.includes('laboratory'))
}

const PHARMA_CHAIR_RESPONSE = (flow: PharmaFlow) => `Here is your pharma-grade stainless steel cleanroom chair.
Seat height: ${flow.height ?? 450}–${(flow.height ?? 450) + 200} mm (adjustable gas lift).
Material: ${flow.grade ?? '304'} stainless steel frame, 2B finish Ra ≤ 0.8 μm.
Perforated seat and backrest — no dead zones, fully cleanable, compliant with ISO 14644.
Swivel base with ESD-safe castors — suitable for cleanroom and controlled environments.
Footrest ring: 304 SS tubular, welded and polished flush.
Compliant with GMP Annex 1, FDA 21 CFR Part 211, and ISO Class 5–8 cleanrooms.
Weight capacity: 120 kg. Dimensions: 450 mm seat width, 450 mm seat depth.`

function isHeatmapIntent(input: string): boolean {
  const l = input.toLowerCase()
  return l.includes('heatmap') || l.includes('heat map') ||
    l.includes('stress') || l.includes('weak') || l.includes('strong') ||
    l.includes('failure') || l.includes('fea') || l.includes('stress distribution') ||
    l.includes('where') && (l.includes('fail') || l.includes('break') || l.includes('stress')) ||
    l.includes('show me the stress') || l.includes('stress analysis') ||
    l.includes('load distribution') || l.includes('structural analysis')
}

const ALL_CHATS = [
  { id: '1', title: 'Helical gear 48T design', time: '2m ago' },
  { id: '2', title: 'Spur gear module 2.5',    time: '1h ago' },
  { id: '3', title: 'Shaft stress analysis',   time: '3h ago' },
  { id: '4', title: 'Ball bearing selection',  time: 'Yesterday' },
  { id: '5', title: 'M16 bolt torque calc',    time: 'Yesterday' },
]

function AppWordmark({ darkMode, onClick }: { darkMode: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: F, fontSize: '20px', lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none',
        background: 'none', border: 'none', padding: 0, cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontWeight: 300, color: darkMode ? 'rgba(255,255,255,0.88)' : 'rgba(10,10,10,0.80)' }}>Mec</span>
      <span style={{
        fontWeight: 500,
        background: 'linear-gradient(135deg, #1739E5, #CCDEFF, #1739E5)',
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'shimmer 4s ease infinite',
      }}>AI</span>
    </button>
  )
}

function CadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L22 7 L12 12 L2 7 Z" />
      <path d="M2 7 L2 17 L12 22 L12 12 Z" />
      <path d="M22 7 L22 17 L12 22 L12 12 Z" />
    </svg>
  )
}

function MecAvatar() {
  return (
    <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#0a1628', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    </div>
  )
}

interface InputBarProps {
  input: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onStop: () => void
  isStreaming: boolean
  placeholder: string
  disclaimer: string
  surface: string
  border: string
  textPrimary: string
  textMuted: string
  darkMode: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

function InputBar({ input, onChange, onKeyDown, onSend, onStop, isStreaming, placeholder, disclaimer, textPrimary, textMuted, darkMode, textareaRef }: InputBarProps) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        backgroundColor: darkMode ? '#252d3a' : '#f2f2f2',
        border: `1px solid ${darkMode ? '#2e3847' : '#e0e0e0'}`,
        borderRadius: '12px', padding: '10px 12px 10px 14px',
      }}>
        <label style={{ color: darkMode ? textMuted : '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Paperclip size={15} />
          <input type="file" style={{ display: 'none' }} />
        </label>
        <textarea
          ref={textareaRef} value={input}
          onChange={e => { onChange(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }}
          onKeyDown={onKeyDown} placeholder={placeholder} rows={1}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '16px', color: textPrimary, fontFamily: F, fontWeight: 300,
            resize: 'none', lineHeight: '1.5', overflowY: 'hidden',
            padding: 0, margin: 0, boxSizing: 'border-box',
          }}
        />
        {isStreaming ? (
          <button onClick={onStop} style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#e53e3e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <StopCircle size={13} color="white" />
          </button>
        ) : (
          <button onClick={onSend} disabled={!input.trim()} style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, backgroundColor: input.trim() ? '#0a1628' : (darkMode ? '#2a2f35' : '#d8d8d8'), border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s' }}>
            <ArrowUp size={13} color={input.trim() ? 'white' : (darkMode ? '#4a5568' : '#aaa')} />
          </button>
        )}
      </div>
      <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 300, color: darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', marginTop: '8px', fontFamily: F, letterSpacing: '0.01em' }}>
        {disclaimer}
      </p>
    </div>
  )
}

interface SearchPanelProps {
  open: boolean; query: string; onChange: (v: string) => void; onClose: () => void
  chats: typeof ALL_CHATS; surface: string; border: string; textPrimary: string
  textMuted: string; darkMode: boolean; inputRef: React.RefObject<HTMLInputElement>
  sidebarWidth: number; viewerWidth: number; viewerOpen: boolean
}

function SearchPanel({ open, query, onChange, onClose, chats, surface, border, textPrimary, textMuted, darkMode, inputRef }: SearchPanelProps) {
  const filtered = query ? chats.filter(c => c.title.toLowerCase().includes(query.toLowerCase())) : chats
  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0, zIndex: 49 }} />}
      <div style={{ position: 'fixed', top: '64px', left: '50%', transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)', width: '620px', maxWidth: 'calc(100vw - 48px)', zIndex: 50, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.18s ease, transform 0.18s ease' }}>
        <div style={{ backgroundColor: surface, borderRadius: '12px', border: `1px solid ${border}`, boxShadow: darkMode ? '0 16px 48px rgba(0,0,0,0.6)' : '0 8px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
            <Search size={13} color={textMuted} style={{ flexShrink: 0 }} />
            <input ref={inputRef} type="text" value={query} onChange={e => onChange(e.target.value)} placeholder="Search your chats..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', fontWeight: 300, color: textPrimary, fontFamily: F }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', padding: '2px', flexShrink: 0 }}><X size={12} /></button>
          </div>
          <div style={{ padding: '10px 16px 4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 500, color: textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: F }}>{query ? 'Results' : 'Recent chats'}</span>
          </div>
          <div style={{ padding: '2px 8px 8px' }}>
            {filtered.length === 0
              ? <p style={{ fontSize: '13px', fontWeight: 300, color: textMuted, fontFamily: F, padding: '8px 10px', margin: 0 }}>No chats found for &quot;{query}&quot;</p>
              : filtered.map(chat => (
                <button key={chat.id} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}>
                  <span style={{ fontSize: '13px', fontWeight: 300, color: textPrimary, fontFamily: F }}>{chat.title}</span>
                  <span style={{ fontSize: '9px', fontWeight: 400, color: textMuted, fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0, marginLeft: '8px' }}>{chat.time}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [showTransition, setShowTransition] = useState(true)

  const userName  = session?.user?.name  ?? 'there'
  const firstName = userName.split(' ')[0]

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerWidth, setViewerWidth] = useState(480)
  const [isDragging, setIsDragging] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState<'home' | 'projects'>('home')
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')
  const [systemDark, setSystemDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModel, setActiveModel] = useState<ModelType>('empty')
  const [pendingModel, setPendingModel] = useState<ModelType>('empty')
  const [shapeDims, setShapeDims] = useState<ShapeDimensions>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatKey, setChatKey] = useState(0)

  // ── Pharma conversational flow state ──
  const [pharmaFlow, setPharmaFlow] = useState<PharmaFlow | null>(null)

  const { cards: promptCards, isPersonalised } = useSmartSuggestions()

  const abortRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const inChat = messages.length > 0
  const sidebarWidth = sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED

  const [units, setUnits] = useState<'Metric (mm, MPa)' | 'Imperial (in, psi)'>('Metric (mm, MPa)')
  const [language, setLanguage] = useState('English')

  const T: Record<string, Record<string, string>> = {
    greeting_morning:   { English: 'Good morning',    French: 'Bonjour',        German: 'Guten Morgen',   Spanish: 'Buenos días',    Italian: 'Buongiorno',    Portuguese: 'Bom dia',       Japanese: 'おはようございます', Chinese_Simplified: '早上好', Arabic: 'صباح الخير', Hindi: 'सुप्रभात' },
    greeting_afternoon: { English: 'Good afternoon',  French: 'Bon après-midi', German: 'Guten Tag',      Spanish: 'Buenas tardes',  Italian: 'Buon pomeriggio',Portuguese: 'Boa tarde',     Japanese: 'こんにちは',       Chinese_Simplified: '下午好', Arabic: 'مساء الخير', Hindi: 'नमस्ते' },
    greeting_evening:   { English: 'Good evening',    French: 'Bonsoir',        German: 'Guten Abend',    Spanish: 'Buenas noches',  Italian: 'Buona sera',    Portuguese: 'Boa noite',     Japanese: 'こんばんは',       Chinese_Simplified: '晚上好', Arabic: 'مساء الخير', Hindi: 'शुभ संध्या' },
    sub_morning:        { English: 'What are you building today?', French: "Que construisez-vous aujourd'hui ?", German: 'Was bauen Sie heute?', Spanish: '¿Qué estás construyendo hoy?', Italian: 'Cosa stai costruendo oggi?', Portuguese: 'O que você está construindo hoje?', Japanese: '今日は何を作りますか？', Chinese_Simplified: '今天在做什么？', Arabic: 'ماذا تبني اليوم؟', Hindi: 'आज क्या बना रहे हैं?' },
    sub_afternoon:      { English: 'Back to the workshop?', French: "Retour à l'atelier ?", German: 'Zurück in der Werkstatt?', Spanish: '¿De vuelta al taller?', Italian: 'Tornato al laboratorio?', Portuguese: 'De volta à oficina?', Japanese: 'ワークショップに戻りましたか？', Chinese_Simplified: '回到工作室了？', Arabic: 'عودة إلى الورشة؟', Hindi: 'वापस कार्यशाला में?' },
    sub_evening:        { English: 'Late night engineering?', French: 'Ingénierie nocturne ?', German: 'Nächtliches Engineering?', Spanish: '¿Ingeniería nocturna?', Italian: 'Ingegneria notturna?', Portuguese: 'Engenharia noturna?', Japanese: '夜のエンジニアリング？', Chinese_Simplified: '深夜工程？', Arabic: 'هندسة في وقت متأخر من الليل؟', Hindi: 'देर रात इंजीनियरिंग?' },
    placeholder:        { English: 'What are we engineering today?', French: "Qu'est-ce qu'on ingénie aujourd'hui ?", German: 'Was konstruieren wir heute?', Spanish: '¿Qué estamos ingeniando hoy?', Italian: 'Cosa progettiamo oggi?', Portuguese: 'O que vamos projetar hoje?', Japanese: '今日は何を設計しますか？', Chinese_Simplified: '今天我们设计什么？', Arabic: 'ماذا نصمم اليوم؟', Hindi: 'आज हम क्या डिज़ाइन कर रहे हैं?' },
    disclaimer:         { English: 'MecAI can make mistakes — always verify critical dimensions before manufacturing.', French: 'MecAI peut faire des erreurs — vérifiez toujours les dimensions critiques avant la fabrication.', German: 'MecAI kann Fehler machen — überprüfen Sie immer kritische Abmessungen vor der Fertigung.', Spanish: 'MecAI puede cometer errores — verifique siempre las dimensiones críticas antes de fabricar.', Italian: 'MecAI può commettere errori — verificare sempre le dimensioni critiche prima della produzione.', Portuguese: 'MecAI pode cometer erros — verifique sempre as dimensões críticas antes da fabricação.', Japanese: 'MecAIは間違いを犯す可能性があります。製造前に重要な寸法を必ず確認してください。', Chinese_Simplified: 'MecAI可能会出错 — 制造前请务必验证关键尺寸。', Arabic: 'قد يخطئ MecAI — تحقق دائمًا من الأبعاد الحرجة قبل التصنيع.', Hindi: 'MecAI गलतियाँ कर सकता है — निर्माण से पहले हमेशा महत्वपूर्ण आयामों की जाँच करें।' },
  }

  function t(key: string): string {
    const langKey = language.replace(/\s+/g, '_').replace(/[()]/g, '')
    return T[key]?.[langKey] ?? T[key]?.['English'] ?? key
  }

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('mecai_theme') as ThemePreference | null
    if (saved) setThemePreference(saved)
    try {
      const s = localStorage.getItem('mecai_settings')
      if (s) {
        const parsed = JSON.parse(s)
        if (parsed.units) setUnits(parsed.units)
        if (parsed.language) setLanguage(parsed.language)
      }
    } catch {}
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    const onSettings = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.units) setUnits(detail.units)
      if (detail?.language) setLanguage(detail.language)
    }
    window.addEventListener('mecai-settings-change', onSettings)
    return () => {
      mq.removeEventListener('change', handler)
      window.removeEventListener('mecai-settings-change', onSettings)
    }
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60) }, [searchOpen])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    if (showTransition) return
    const timer = setTimeout(() => textareaRef.current?.focus(), 150)
    return () => clearTimeout(timer)
  }, [chatKey, showTransition])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const startX = e.clientX
    const startWidth = viewerWidth
    const onMove = (ev: MouseEvent) => { const min = Math.floor(window.innerWidth * 0.40); const max = Math.floor(window.innerWidth * 0.75); setViewerWidth(Math.max(min, Math.min(max, startWidth + (startX - ev.clientX)))) }
    const onUp = () => { setIsDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [viewerWidth])

  const openModelInViewer = useCallback(async (model: ModelType, dims: ShapeDimensions = {}) => {
    if (!model || model === 'empty') return
    setViewerOpen(true); setShapeDims(dims); setActiveModel('empty')
    setIsGenerating(true); setPendingModel('empty')
    await new Promise(r => setTimeout(r, 2800))
    setIsGenerating(false); setActiveModel(model)
  }, [])

  // ── Stream lines to the last assistant message ──
  const streamLines = useCallback(async (lines: string[]) => {
    setIsStreaming(true); abortRef.current = false
    for (let i = 0; i < lines.length; i++) {
      if (abortRef.current) break
      await new Promise(r => setTimeout(r, i === 0 ? 280 : 380))
      setMessages(prev => { const u = [...prev]; const l = { ...u[u.length - 1] }; l.visibleLines = i + 1; u[u.length - 1] = l; return u })
    }
    setIsStreaming(false)
  }, [])

  // ── Add an assistant message ──
  const addAssistant = useCallback((text: string) => {
    const lines = splitLines(text)
    setMessages(prev => [...prev, { role: 'assistant', lines, visibleLines: 0 }])
    return lines
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    setInput('')

    // ── Pharma flow: handle ongoing Q&A ──
    if (pharmaFlow && pharmaFlow.step !== 'done') {
      setMessages(prev => [...prev, { role: 'user', lines: [trimmed], visibleLines: 1 }])
      const num = extractNumber(trimmed)
      const l = trimmed.toLowerCase()
      let next = { ...pharmaFlow }

      if (next.step === 'length') {
        next.length = num ?? 1800
        next.step = 'width'
        const lines = addAssistant(PHARMA_QUESTIONS.width)
        setPharmaFlow(next)
        await streamLines(lines)
      } else if (next.step === 'width') {
        next.width = num ?? 750
        next.step = 'height'
        const lines = addAssistant(PHARMA_QUESTIONS.height)
        setPharmaFlow(next)
        await streamLines(lines)
      } else if (next.step === 'height') {
        next.height = num ?? (next.type === 'chair' ? 450 : 900)
        next.step = next.type === 'table' ? 'chairs' : 'grade'
        const q = next.type === 'table' ? PHARMA_QUESTIONS.chairs : PHARMA_QUESTIONS.grade
        const lines = addAssistant(q)
        setPharmaFlow(next)
        await streamLines(lines)
      } else if (next.step === 'chairs') {
        next.chairs = num ?? 0
        next.step = 'grade'
        const lines = addAssistant(PHARMA_QUESTIONS.grade)
        setPharmaFlow(next)
        await streamLines(lines)
      } else if (next.step === 'grade') {
        next.grade = (l.includes('316') || l.includes('316l')) ? '316L' : '304'
        next.step = 'done'
        setPharmaFlow(null)

        if (next.type === 'chair') {
          const response = PHARMA_CHAIR_RESPONSE(next)
          const lines = addAssistant(response)
          trackMessage(trimmed)
          openModelInViewer('pharma_chair', {})
          await streamLines(lines)
        } else {
          const response = PHARMA_TABLE_RESPONSE(next)
          const lines = addAssistant(response)
          trackMessage(trimmed)
          const dims: ShapeDimensions = { width: next.length, height: next.height, depth: next.width }
          openModelInViewer('pharma_table', dims)
          await streamLines(lines)
        }
      }
      return
    }

    // ── Pharma intent: start the flow ──
    if (isPharmaIntent(trimmed)) {
      setMessages(prev => [...prev, { role: 'user', lines: [trimmed], visibleLines: 1 }])
      const type: 'table' | 'chair' = trimmed.toLowerCase().includes('chair') || trimmed.toLowerCase().includes('stool') ? 'chair' : 'table'
      const flow: PharmaFlow = { type, step: type === 'chair' ? 'height' : 'length' }
      setPharmaFlow(flow)
      trackMessage(trimmed)

      const chairIntro = type === 'chair'
      ? `I will help you design a pharma-grade stainless steel cleanroom chair for your plant.
Let me ask a few questions to get the exact specifications right.
What seat height do you need? (standard adjustable range: 450–650 mm, gas-lift recommended for GMP)`
      : `I will help you design a pharma-grade stainless steel ${type} for your plant.
Let me ask a few questions to get the exact specifications right.
${PHARMA_QUESTIONS.length}`
    const intro = chairIntro
      const lines = addAssistant(intro)
      await streamLines(lines)
      return
    }

    // ── Standard flow ──
    const lines = splitLines(getResponse(trimmed))
    setMessages(prev => [...prev, { role: 'user', lines: [trimmed], visibleLines: 1 }, { role: 'assistant', lines, visibleLines: 0 }])
    setIsStreaming(true); abortRef.current = false
    trackMessage(trimmed)
    const model = getModelType(trimmed)
    if (model) openModelInViewer(model, parseDimensions(trimmed))
    for (let i = 0; i < lines.length; i++) {
      if (abortRef.current) break
      await new Promise(r => setTimeout(r, i === 0 ? 280 : 380))
      setMessages(prev => { const u = [...prev]; const l = { ...u[u.length - 1] }; l.visibleLines = i + 1; u[u.length - 1] = l; return u })
    }
    setIsStreaming(false)
  }, [isStreaming, openModelInViewer, pharmaFlow, addAssistant, streamLines])

  const stopStreaming = useCallback(() => { abortRef.current = true; setIsStreaming(false) }, [])
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }, [input, sendMessage])

  const handleNavigate = useCallback((p: 'home' | 'projects') => {
    abortRef.current = true
    setIsStreaming(false)
    setPharmaFlow(null)
    setPage(p)
    setMessages([])
    setInput('')
    setViewerOpen(false)
    setActiveModel('empty')
    setPendingModel('empty')
    setIsGenerating(false)
    if (p === 'home') setChatKey(k => k + 1)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [])

  const darkMode = themePreference === 'dark' ? true : themePreference === 'light' ? false : systemDark
  const dm = mounted && darkMode

  function handleThemeChange(theme: ThemePreference) {
    setThemePreference(theme)
    localStorage.setItem('mecai_theme', theme)
  }

  const bg          = dm ? '#0d1117' : '#ffffff'
  const surface     = dm ? '#161b22' : '#ffffff'
  const border      = dm ? '#21262d' : '#ebebeb'
  const textPrimary = dm ? '#e6edf3' : '#0a0a0a'
  const textMuted   = dm ? '#6e7681' : '#999999'

  const inputBarProps: InputBarProps = {
    input, onChange: setInput, onKeyDown: handleKeyDown,
    onSend: () => sendMessage(input), onStop: stopStreaming,
    isStreaming, surface, border, textPrimary, textMuted,
    darkMode: dm, textareaRef, placeholder: '',
    disclaimer: t('disclaimer'),
  }

  function greeting() {
    const h = new Date().getHours()
    const salutation = h < 12 ? t('greeting_morning') : h < 17 ? t('greeting_afternoon') : t('greeting_evening')
    return `${salutation}, ${firstName}.`
  }
  function subGreeting() {
    const h = new Date().getHours()
    if (h < 12) return t('sub_morning')
    if (h < 17) return t('sub_afternoon')
    return t('sub_evening')
  }

  if (status === 'loading') {
    return <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #1030c8 0%, #0a20a8 55%, #081898 100%)' }} />
  }

  if (showTransition && status === 'authenticated') {
    return (
      <LoginTransition
        userName={userName}
        onComplete={() => {
          setShowTransition(false)
          setTimeout(() => textareaRef.current?.focus(), 200)
        }}
      />
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Neue+Montreal:wght@300;400;500&display=swap');
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        * { font-family: ${F}; }
        ::placeholder { color: rgba(255,255,255,0.22); font-weight: 300; }
      `}</style>

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        onNavigate={handleNavigate}
        onSearchOpen={() => { setSearchOpen(true); setSearchQuery('') }}
        darkMode={dm}
        onThemeChange={handleThemeChange}
        themePreference={themePreference}
      />

      <SearchPanel
        open={searchOpen} query={searchQuery} onChange={setSearchQuery}
        onClose={() => { setSearchOpen(false); setSearchQuery('') }}
        chats={ALL_CHATS} surface={surface} border={border}
        textPrimary={textPrimary} textMuted={textMuted} darkMode={dm}
        inputRef={searchInputRef} sidebarWidth={sidebarWidth}
        viewerWidth={viewerWidth} viewerOpen={viewerOpen}
      />

      {/* 3D Viewer */}
      <div style={{ position: 'fixed', top: 0, right: viewerOpen ? 0 : -(viewerWidth + 10), width: viewerWidth, height: '100vh', zIndex: 100, transition: isDragging ? 'none' : 'right 0.45s cubic-bezier(0.16,1,0.3,1)', willChange: 'right', display: 'flex' }}>
        <div onMouseDown={handleDragStart} style={{ position: 'absolute', left: -16, top: 0, width: '32px', height: '100%', cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => {
            const line = e.currentTarget.querySelector('.drag-line') as HTMLElement
            const icon = e.currentTarget.querySelector('.drag-icon') as HTMLElement
            if (line) { line.style.backgroundColor = '#3b82f6'; line.style.boxShadow = '0 0 8px rgba(59,130,246,0.6)' }
            if (icon) { icon.style.opacity = '1'; icon.style.borderColor = 'rgba(59,130,246,0.6)'; icon.style.backgroundColor = 'rgba(30,50,90,0.95)' }
          }}
          onMouseLeave={e => {
            if (!isDragging) {
              const line = e.currentTarget.querySelector('.drag-line') as HTMLElement
              const icon = e.currentTarget.querySelector('.drag-icon') as HTMLElement
              if (line) { line.style.backgroundColor = dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; line.style.boxShadow = 'none' }
              if (icon) { icon.style.opacity = '0.7'; icon.style.borderColor = dm ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'; icon.style.backgroundColor = dm ? 'rgba(20,30,50,0.9)' : 'rgba(240,242,245,0.95)' }
            }
          }}
        >
          <div className="drag-line" style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: '1px', height: '100%', backgroundColor: dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', transition: 'background-color 0.2s, box-shadow 0.2s', pointerEvents: 'none' }} />
          <div className="drag-icon" style={{ display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'center', padding: '8px 7px', borderRadius: '8px', zIndex: 11, position: 'relative', backgroundColor: dm ? 'rgba(20,30,50,0.9)' : 'rgba(240,242,245,0.95)', border: `1px solid ${dm ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`, boxShadow: dm ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.7, transition: 'opacity 0.2s, border-color 0.2s, background-color 0.2s', pointerEvents: 'none' }}>
            <div style={{ width: '3px', height: '20px', borderRadius: '99px', backgroundColor: dm ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)' }} />
            <div style={{ width: '3px', height: '20px', borderRadius: '99px', backgroundColor: dm ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <ModelViewer onClose={() => { setViewerOpen(false); setActiveModel('empty'); setPendingModel('empty') }}
            darkMode={dm} modelType={activeModel} pendingModel={pendingModel} isGenerating={isGenerating} shapeDims={shapeDims} />
        </div>
      </div>

      {/* Main */}
      <main style={{ height: '100vh', backgroundColor: bg, display: 'flex', flexDirection: 'column', fontFamily: F, marginLeft: sidebarWidth, marginRight: viewerOpen ? viewerWidth : 0, transition: isDragging ? 'none' : 'margin-left 0.35s cubic-bezier(0.25,0.46,0.45,0.94), margin-right 0.4s cubic-bezier(0.25,0.46,0.45,0.94)', willChange: 'margin-left, margin-right', boxSizing: 'border-box', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 48, backgroundColor: bg, height: '52px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 20px', flexShrink: 0 }}>
          <div />
          <AppWordmark darkMode={dm} onClick={() => handleNavigate('home')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {!viewerOpen && (
              <button onClick={() => setViewerOpen(true)} style={{ padding: '6px 12px', borderRadius: '7px', border: `1px solid ${border}`, backgroundColor: 'transparent', fontSize: '11px', fontWeight: 400, letterSpacing: '0.02em', fontFamily: F, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: textMuted, transition: 'color 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = textPrimary; el.style.borderColor = '#aaa' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = textMuted; el.style.borderColor = border }}>
                <CadIcon />3D Model Viewer
              </button>
            )}
          </div>
        </div>

        {/* Home */}
        {page === 'home' && (
          <div key={chatKey} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {inChat ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', boxSizing: 'border-box' }}>
                  <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {messages.map((msg, i) => (
                      <div key={i}>
                        {msg.role === 'user' ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ maxWidth: '72%', padding: '11px 16px', borderRadius: '16px 16px 3px 16px', backgroundColor: '#0a1628', fontSize: '16px', fontWeight: 300, lineHeight: '1.7', color: 'rgba(255,255,255,0.9)', fontFamily: F }}>
                              {msg.lines[0]}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <MecAvatar />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '9px', fontWeight: 500, color: textMuted, fontFamily: F, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>MecAI</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {msg.lines.slice(0, msg.visibleLines).map((line, li) => (
                                  <span key={li} style={{ fontSize: '16px', fontWeight: 300, lineHeight: '1.8', color: textPrimary, fontFamily: F, display: 'block', animation: 'fadeSlideIn 0.35s ease forwards' }}>{line}</span>
                                ))}
                                {isStreaming && i === messages.length - 1 && msg.visibleLines < msg.lines.length && (
                                  <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0a1628', marginTop: '6px', animation: 'blink 0.8s infinite' }} />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <div style={{ padding: '12px 24px 20px', backgroundColor: bg, flexShrink: 0 }}>
                  <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <InputBar {...inputBarProps} placeholder={pharmaFlow ? 'Type your answer...' : 'Ask a follow-up...'} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 32px 0', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', maxWidth: '660px' }}>
                    <div style={{ textAlign: 'center', animation: 'cardFadeUp 0.5s cubic-bezier(0.22,0.68,0,1.2) both', animationDelay: '0.05s' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 200, letterSpacing: '1px', fontFamily: F, color: dm ? 'rgba(255,255,255,0.85)' : '#0a0a0a' }}>
                        {mounted ? greeting() : `Hello, ${firstName}.`}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 300, letterSpacing: '0.02em', color: textMuted, fontFamily: F }}>
                        {mounted ? subGreeting() : 'What are you building today?'}
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', width: '100%' }}>
                      {isPersonalised && (
                        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 500, color: textMuted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: F }}>Suggested for you</span>
                          <div style={{ flex: 1, height: '0.5px', background: border }} />
                        </div>
                      )}
                      {promptCards.map((card, i) => (
                        <button key={card.title}
                          onClick={() => { if (card.model) openModelInViewer(card.model); sendMessage(card.description) }}
                          style={{ backgroundColor: dm ? '#161b22' : '#fafafa', borderRadius: '10px', padding: '18px 20px', textAlign: 'left', border: `1px solid ${dm ? '#21262d' : '#e8e8e8'}`, cursor: 'pointer', transition: 'border-color 0.15s, background-color 0.15s', fontFamily: F, minHeight: '120px', display: 'flex', flexDirection: 'column', gap: '7px', animation: 'cardFadeUp 0.5s cubic-bezier(0.22,0.68,0,1.2) both', animationDelay: `${0.15 + i * 0.08}s` }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = dm ? '#444' : '#0a1628'; el.style.backgroundColor = dm ? '#1c2128' : '#ffffff' }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = dm ? '#21262d' : '#e8e8e8'; el.style.backgroundColor = dm ? '#161b22' : '#fafafa' }}>
                          <span style={{ fontSize: '9px', fontWeight: 500, color: textMuted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: F }}>{card.tag}</span>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: dm ? '#e6edf3' : '#0a0a0a', margin: 0, letterSpacing: '0.01em' }}>{card.title}</p>
                          <p style={{ fontSize: '11.5px', fontWeight: 300, color: textMuted, lineHeight: '1.65', margin: 0 }}>{card.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '20px 32px 24px', flexShrink: 0, animation: 'cardFadeUp 0.5s cubic-bezier(0.22,0.68,0,1.2) both', animationDelay: '0.45s' }}>
                  <div style={{ maxWidth: '660px', margin: '0 auto' }}>
                    <InputBar {...inputBarProps} placeholder={t('placeholder')} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {page === 'projects' && (
          <ProjectsPage darkMode={dm} textPrimary={textPrimary} textMuted={textMuted} border={border} bg={bg} />
        )}
      </main>
    </>
  )
}