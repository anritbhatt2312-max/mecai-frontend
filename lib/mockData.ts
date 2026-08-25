import { Message, ChatSession } from './types'

export const MOCK_SESSIONS: ChatSession[] = [
  { id: '1', title: 'Helical gear 48T / M2', updatedAt: '09:16', projectId: 'gearbox' },
  { id: '2', title: 'Spur gear stress calc', updatedAt: 'Yesterday', projectId: 'gearbox' },
  { id: '3', title: 'Titanium yield analysis', updatedAt: 'Mon' },
  { id: '4', title: 'Shaft torsion — 12mm', updatedAt: 'Mon' },
  { id: '5', title: 'Bearing load 6204', updatedAt: 'Sun', projectId: 'actuator' },
]

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    timestamp: '09:14',
    blocks: [
      {
        type: 'text',
        content: "Hello! I'm ready to help you design mechanical components and run engineering calculations. Describe a part, specify dimensions, and I'll generate the geometry and any relevant stress or material analysis.",
      },
    ],
  },
  {
    id: 'msg-2',
    role: 'user',
    timestamp: '09:16',
    blocks: [
      {
        type: 'text',
        content: 'Generate a helical gear with 48 teeth, module 2, pressure angle 20°, helix angle 15°, face width 30mm. Material: 4140 steel. Calculate bending stress at 120 Nm torque.',
      },
    ],
  },
  {
    id: 'msg-3',
    role: 'assistant',
    timestamp: '09:16',
    blocks: [
      { type: 'text', content: 'Gear geometry generated. Here are the key parameters and bending stress result:' },
      { type: 'formula', content: 'd = m × Z / cos(ψ) = 2 × 48 / cos(15°) = 99.35 mm\nd_a = d + 2m = 103.35 mm\nd_f = d - 2.5m = 94.35 mm' },
      { type: 'formula', content: 'σ_b = Ft / (b · m · Yf) · KA · Kv = 2414 / (30 × 2 × 0.38) · 1.12 ≈ 118.6 MPa' },
      { type: 'text', content: 'Factor of safety: **2.61** — within safe limits for 4140 steel (allowable: 310 MPa).' },
      { type: 'cad_ref', label: 'View in CAD panel' },
    ],
  },
]