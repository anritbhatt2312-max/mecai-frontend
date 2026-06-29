// hooks/useSmartSuggestions.ts — create this new file in a hooks/ folder
import { useEffect, useState } from 'react'
import { ModelType } from '@/components/viewer/ModelViewer'

export interface PromptCard {
  title: string
  description: string
  model: ModelType | null
  tag: string
}

// ── Full library of all possible suggestions ──
const ALL_SUGGESTIONS: (PromptCard & { keywords: string[] })[] = [
  {
    title: 'Spur gear',
    description: 'Generate a 20-tooth spur gear, module 2.0 mm, 4140 steel.',
    model: 'spur_gear', tag: 'Gear',
    keywords: ['spur', 'gear', 'teeth', 'module', 'pitch'],
  },
  {
    title: 'Helical gear',
    description: 'Generate a helical gear, 18 teeth, 20° helix angle, 4140 steel.',
    model: 'helical_gear', tag: 'Gear',
    keywords: ['helical', 'gear', 'helix', 'angle', 'noise'],
  },
  {
    title: 'Ball bearing',
    description: 'Generate a 6308 deep groove ball bearing, 10 balls, 52100 steel.',
    model: 'bearing', tag: 'Component',
    keywords: ['bearing', 'ball', 'groove', 'radial', 'axial', 'rpm'],
  },
  {
    title: 'Shaft design',
    description: 'Generate a 64mm shaft with shoulders and keyway, 1045 steel.',
    model: 'shaft', tag: 'Component',
    keywords: ['shaft', 'keyway', 'shoulder', 'torque', 'rotate'],
  },
  {
    title: 'Hex bolt',
    description: 'Generate an M12 hex bolt, Grade 8.8, ISO 4014, zinc-plated.',
    model: 'bolt', tag: 'Fastener',
    keywords: ['bolt', 'screw', 'fastener', 'm12', 'thread', 'torque'],
  },
  {
    title: 'Von Mises stress',
    description: 'Calculate von Mises stress on a 64mm shaft under 120 Nm torque and 80 Nm bending at 3000 RPM.',
    model: null, tag: 'Physics',
    keywords: ['von mises', 'stress', 'bending', 'torsion', 'safety', 'factor', 'physics'],
  },
  {
    title: 'Material comparison',
    description: 'Compare 4140 chromoly vs 316 stainless for a marine pump shaft — strength, corrosion, cost.',
    model: null, tag: 'Materials',
    keywords: ['material', 'stainless', 'chromoly', 'steel', 'compare', 'marine', 'corrosion'],
  },
  {
    title: 'Fatigue analysis',
    description: 'Run a Goodman fatigue analysis on a rotating steel shaft under cyclic bending load.',
    model: null, tag: 'Physics',
    keywords: ['fatigue', 'goodman', 'cyclic', 'endurance', 'limit', 'alternating'],
  },
  {
    title: 'Compression spring',
    description: 'Design a helical compression spring — 50mm free length, 15mm OD, spring steel.',
    model: null, tag: 'Component',
    keywords: ['spring', 'compression', 'helical', 'coil', 'stiffness', 'deflection'],
  },
  {
    title: 'Pressure vessel',
    description: 'Calculate wall thickness for a cylindrical pressure vessel, 200mm diameter, 15 MPa internal.',
    model: 'cylinder', tag: 'Physics',
    keywords: ['pressure', 'vessel', 'cylinder', 'wall', 'hoop', 'stress'],
  },
  {
    title: 'Cube geometry',
    description: 'Generate a 100mm steel cube — volume, surface area, stress analysis.',
    model: 'cube', tag: 'Geometry',
    keywords: ['cube', 'square', 'block', 'box', 'geometry'],
  },
  {
    title: 'Sphere model',
    description: 'Generate a steel sphere — ideal for pressure vessels or bearing balls.',
    model: 'sphere', tag: 'Geometry',
    keywords: ['sphere', 'ball', 'round', 'radius', 'pressure'],
  },
  {
    title: 'Gearbox torque',
    description: 'Calculate output torque and efficiency for a 4-stage gearbox with 5:1 ratio per stage.',
    model: null, tag: 'Physics',
    keywords: ['gearbox', 'torque', 'ratio', 'efficiency', 'stage', 'output'],
  },
  {
    title: 'Fatigue life analysis',
    description: 'Calculate the fatigue life of a 42CrMo4 steel shaft under fully reversed bending of 180 MPa at 2800 RPM — apply Goodman criterion and estimate cycles to failure.',
    model: null, tag: 'Physics',
    keywords: ['fatigue', 'goodman', 'cyclic', 'bending', 'life', 'cycles', 'failure', 'alternating', 'endurance'],
  },
  {
    title: 'Pharma SS table',
    description: 'Design a GMP-grade 316L stainless steel workbench for a pharma plant — dimensions, grade, and chair count.',
    model: 'pharma_table' as ModelType | null, tag: 'Pharma',
    keywords: ['pharma', 'table', 'stainless', 'gmp', 'cleanroom', 'workbench', 'bench', '316', '304', 'chair'],
  },
  {
    title: 'Keyway stress',
    description: 'Analyse stress concentration at a keyway under combined torsion and bending.',
    model: null, tag: 'Physics',
    keywords: ['keyway', 'key', 'stress', 'concentration', 'torsion'],
  },
]

const DEFAULT_CARDS: PromptCard[] = [
  { title: 'Spur gear',        description: 'Generate a 20-tooth spur gear, module 2.0 mm, 4140 steel.',                                                                    model: 'spur_gear', tag: 'Gear' },
  { title: 'Ball bearing',     description: 'Generate a 6308 deep groove ball bearing, 10 balls, 52100 bearing steel.',                                                     model: 'bearing',   tag: 'Component' },
  { title: 'Von Mises stress', description: 'Calculate the von Mises stress on a 64mm steel shaft under 120 Nm torque and 80 Nm bending at 3000 RPM. Is it safe?',         model: null,        tag: 'Physics' },
  { title: 'Material compare', description: 'Compare 4140 chromoly steel vs 316 stainless steel for a marine pump shaft — yield strength, corrosion resistance, and cost.', model: null,        tag: 'Materials' },
]

const STORAGE_KEY = 'mecai_topic_scores'

// ── Score each topic based on what the user has typed ──
function scoreTopic(keywords: string[], history: Record<string, number>): number {
  return keywords.reduce((score, kw) => score + (history[kw] ?? 0), 0)
}

// ── Extract keywords from a user message ──
export function trackMessage(message: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const history: Record<string, number> = raw ? JSON.parse(raw) : {}
    const lower = message.toLowerCase()

    ALL_SUGGESTIONS.forEach(s => {
      s.keywords.forEach(kw => {
        if (lower.includes(kw)) {
          history[kw] = (history[kw] ?? 0) + 1
        }
      })
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {}
}

// ── Hook: returns 4 smart suggestions based on history ──
export function useSmartSuggestions(): { cards: PromptCard[]; isPersonalised: boolean } {
  const [cards, setCards] = useState<PromptCard[]>(DEFAULT_CARDS)
  const [isPersonalised, setIsPersonalised] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const history: Record<string, number> = JSON.parse(raw)
      const totalInteractions = Object.values(history).reduce((a, b) => a + b, 0)

      // Need at least 3 interactions before personalising
      if (totalInteractions < 3) return

      // Score all suggestions
      const scored = ALL_SUGGESTIONS.map(s => ({
        ...s,
        score: scoreTopic(s.keywords, history),
      }))

      // Sort by score, pick top 4, shuffle slightly so it doesn't feel static
      const top = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)

      if (top.length < 2) return  // not enough signal yet

      // Pick 4 — top 2 guaranteed, rest random from remaining top
      const guaranteed = top.slice(0, 2)
      const rest = top.slice(2).sort(() => Math.random() - 0.5).slice(0, 2)
      const picked = [...guaranteed, ...rest]

      // Pad with defaults if needed
      if (picked.length < 4) {
        const defaults = DEFAULT_CARDS.filter(d => !picked.find(p => p.title === d.title))
        picked.push(...defaults.slice(0, 4 - picked.length))
      }

      setCards(picked.slice(0, 4).map(({ keywords: _k, score: _s, ...card }) => card) as PromptCard[])
      setIsPersonalised(true)
    } catch {}
  }, [])

  return { cards, isPersonalised }
}