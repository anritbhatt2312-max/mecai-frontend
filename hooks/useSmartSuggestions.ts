// hooks/useSmartSuggestions.ts
import { useEffect, useState } from 'react'
import { ModelType } from '@/components/viewer/ModelViewer'

export interface PromptCard {
  title: string
  description: string
  model: ModelType | null
  tag: string
}

interface ScoredCard extends PromptCard {
  keywords: string[]
  score: number
}

// ── Full library of all possible suggestions ──
const ALL_SUGGESTIONS: ScoredCard[] = [
  { title: 'Spur gear',            description: 'Generate a 20-tooth spur gear, module 2.0 mm, 4140 steel.',                                                       model: 'spur_gear',    tag: 'Gear',      score: 0, keywords: ['spur', 'gear', 'teeth', 'module', 'pitch'] },
  { title: 'Helical gear',         description: 'Generate a helical gear, 18 teeth, 20° helix angle, 4140 steel.',                                                  model: 'helical_gear', tag: 'Gear',      score: 0, keywords: ['helical', 'gear', 'helix', 'angle'] },
  { title: 'Bevel gear',           description: 'Generate a bevel gear, 20 teeth, 45° pitch angle, 4140 steel.',                                                    model: null,           tag: 'Gear',      score: 0, keywords: ['bevel', 'gear', 'conical', 'angle'] },
  { title: 'Spur gear pair',       description: 'Generate a meshing spur gear pair, 20T driver and 40T driven, module 2.0 mm.',                                     model: 'spur_gear',    tag: 'Assembly',  score: 0, keywords: ['gear pair', 'mesh', 'driver', 'driven'] },
  { title: 'Rack and pinion',      description: 'Generate a rack and pinion assembly, 15-tooth pinion, module 2.0 mm, 200mm rack.',                                 model: null,           tag: 'Assembly',  score: 0, keywords: ['rack', 'pinion', 'linear', 'motion'] },
  { title: 'Ball bearing',         description: 'Generate a 6308 deep groove ball bearing, 10 balls, 52100 bearing steel.',                                         model: 'bearing',      tag: 'Component', score: 0, keywords: ['bearing', 'ball', 'groove', 'radial'] },
  { title: 'Bolt',                 description: 'Generate an M12 hex bolt, Grade 8.8, ISO 4014, 80mm length.',                                                      model: 'bolt',         tag: 'Fastener',  score: 0, keywords: ['bolt', 'hex', 'm12', 'fastener', 'thread'] },
  { title: 'Bolt nut washer',      description: 'Generate a bolt, nut and washer assembly, M12, Grade 8.8.',                                                        model: null,           tag: 'Assembly',  score: 0, keywords: ['bolt', 'nut', 'washer', 'assembly', 'fastener'] },
  { title: 'Stepped shaft',        description: 'Generate a stepped shaft, 3 steps, 60/50/40mm diameters, 300mm total length, 1045 steel.',                        model: 'shaft',        tag: 'Component', score: 0, keywords: ['shaft', 'stepped', 'shoulder', 'diameter'] },
  { title: 'Shaft + bearings',     description: 'Generate a shaft with two ball bearings assembly, 40mm shaft diameter, 200mm length.',                             model: 'shaft',        tag: 'Assembly',  score: 0, keywords: ['shaft', 'bearing', 'assembly', 'support'] },
  { title: 'Shaft bearing gear',   description: 'Generate a shaft, bearing and spur gear assembly, 40mm shaft, 20-tooth gear.',                                     model: null,           tag: 'Assembly',  score: 0, keywords: ['shaft', 'bearing', 'gear', 'assembly', 'drivetrain'] },
  { title: 'Pulley',               description: 'Generate a pulley, 150mm diameter, 30mm width, 20mm bore, cast iron.',                                             model: null,           tag: 'Component', score: 0, keywords: ['pulley', 'belt', 'bore', 'drive'] },
  { title: 'Pulley pair',          description: 'Generate a pulley pair assembly, 150mm and 300mm diameter, 2:1 ratio.',                                            model: null,           tag: 'Assembly',  score: 0, keywords: ['pulley', 'pair', 'belt', 'ratio'] },
  { title: 'Sprocket',             description: 'Generate a 24-tooth sprocket, ANSI #40 chain, 1045 steel.',                                                        model: null,           tag: 'Component', score: 0, keywords: ['sprocket', 'chain', 'teeth', 'ansi'] },
  { title: 'I-beam',               description: 'Generate a 200mm I-beam, 150mm flange width, 8mm web, 500mm length, structural steel.',                           model: null,           tag: 'Structure', score: 0, keywords: ['i-beam', 'beam', 'flange', 'web', 'structural'] },
  { title: 'C-channel',            description: 'Generate a C-channel, 100mm height, 50mm flange, 6mm thickness, 400mm length.',                                   model: null,           tag: 'Structure', score: 0, keywords: ['c-channel', 'channel', 'structural', 'section'] },
  { title: 'Flanged pipe',         description: 'Generate a flanged pipe, DN50, PN16 rating, 300mm length, carbon steel.',                                          model: null,           tag: 'Component', score: 0, keywords: ['pipe', 'flange', 'dn50', 'piping'] },
  { title: 'Flanged pipe assembly', description: 'Generate two flanged pipes bolted together, DN50, PN16, with gasket.',                                            model: null,           tag: 'Assembly',  score: 0, keywords: ['pipe', 'flange', 'assembly', 'bolted', 'connection'] },
  { title: 'Heat sink',            description: 'Generate an aluminium heat sink, 80mm x 80mm base, 10 fins, 30mm fin height.',                                     model: null,           tag: 'Component', score: 0, keywords: ['heat sink', 'fins', 'cooling', 'thermal', 'aluminium'] },
  { title: 'Bracket',              description: 'Generate an L-bracket, 100x80mm arms, 6mm thickness, 4 mounting holes, mild steel.',                              model: null,           tag: 'Component', score: 0, keywords: ['bracket', 'mounting', 'l-bracket', 'support'] },
  { title: 'Connecting rod',       description: 'Generate a connecting rod, 150mm centre-to-centre, big end 40mm, small end 25mm, 4140 steel.',                    model: null,           tag: 'Component', score: 0, keywords: ['connecting rod', 'conrod', 'piston', 'engine', 'crank'] },
  { title: 'Cam follower',         description: 'Generate a cam and follower assembly, eccentric cam, flat-faced follower, 40mm cam radius.',                       model: null,           tag: 'Assembly',  score: 0, keywords: ['cam', 'follower', 'eccentric', 'mechanism'] },
  { title: 'Hollow sphere',        description: 'Generate a hollow sphere, 100mm outer diameter, 5mm wall thickness, stainless steel.',                             model: 'sphere',       tag: 'Geometry',  score: 0, keywords: ['hollow', 'sphere', 'shell', 'pressure', 'vessel'] },
  { title: 'Torus',                description: 'Generate a torus, 80mm major radius, 20mm minor radius, aluminium.',                                               model: null,           tag: 'Geometry',  score: 0, keywords: ['torus', 'ring', 'donut', 'circular'] },
]

const DEFAULT_CARDS: PromptCard[] = [
  { title: 'Spur gear',        description: 'Generate a 20-tooth spur gear, module 2.0 mm, 4140 steel.',                                          model: 'spur_gear', tag: 'Gear' },
  { title: 'Ball bearing',     description: 'Generate a 6308 deep groove ball bearing, 10 balls, 52100 bearing steel.',                            model: 'bearing',   tag: 'Component' },
  { title: 'I-beam',           description: 'Generate a 200mm I-beam, 150mm flange width, 8mm web thickness, structural steel.',                   model: null,        tag: 'Structure' },
  { title: 'Shaft + bearings', description: 'Generate a shaft with two ball bearings assembly, 40mm shaft diameter, 200mm length, 1045 steel.',    model: 'shaft',     tag: 'Assembly' },
]

const STORAGE_KEY = 'mecai_topic_scores'

function scoreTopic(keywords: string[], history: Record<string, number>): number {
  return keywords.reduce((score, kw) => score + (history[kw] ?? 0), 0)
}

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

export function useSmartSuggestions(): { cards: PromptCard[]; isPersonalised: boolean } {
  const [cards, setCards] = useState<PromptCard[]>(DEFAULT_CARDS)
  const [isPersonalised, setIsPersonalised] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const history: Record<string, number> = JSON.parse(raw)
      const totalInteractions = Object.values(history).reduce((a, b) => a + b, 0)

      if (totalInteractions < 3) return

      const scored: ScoredCard[] = ALL_SUGGESTIONS.map(s => ({
        ...s,
        score: scoreTopic(s.keywords, history),
      }))

      const top = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)

      if (top.length < 2) return

      const guaranteed = top.slice(0, 2)
      const rest = top.slice(2).sort(() => Math.random() - 0.5).slice(0, 2)
      const picked: ScoredCard[] = [...guaranteed, ...rest]

      if (picked.length < 4) {
        const defaults = DEFAULT_CARDS
          .filter(d => !picked.find(p => p.title === d.title))
          .slice(0, 4 - picked.length)
          .map(({ title, description, model, tag }) => ({
            title, description, model, tag,
            score: 0,
            keywords: [] as string[],
          }))
        picked.push(...defaults)
      }

      setCards(picked.slice(0, 4).map(({ title, description, model, tag }) => ({
        title, description, model, tag,
      })))
      setIsPersonalised(true)
    } catch {}
  }, [])

  return { cards, isPersonalised }
}