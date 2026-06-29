export type MessageRole = 'user' | 'assistant'

export interface TextBlock {
  type: 'text'
  content: string
}

export interface FormulaBlock {
  type: 'formula'
  content: string
}

export interface CodeBlock {
  type: 'code'
  language: string
  content: string
}

export interface CadRefBlock {
  type: 'cad_ref'
  label: string
}

export type MessageBlock = TextBlock | FormulaBlock | CodeBlock | CadRefBlock

export interface Message {
  id: string
  role: MessageRole
  blocks: MessageBlock[]
  timestamp: string
}

export interface ChatSession {
  id: string
  title: string
  updatedAt: string
  projectId?: string
}

export interface GearParams {
  teeth: number
  module: number
  pressureAngle: number
  helixAngle: number
  faceWidth: number
  material: string
  pitchDiameter?: number
  addendumDiameter?: number
  dedendumDiameter?: number
  bendingStress?: number
  fos?: number
}