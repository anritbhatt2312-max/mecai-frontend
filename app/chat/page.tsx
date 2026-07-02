// app/chat/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import LoginTransition from '@/components/LoginTransition'
import { useSmartSuggestions, trackMessage } from '@/hooks/useSmartSuggestions'
import { ArrowUp, X, Search, StopCircle, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ModelViewer, { ModelType, ShapeDimensions } from '@/components/viewer/ModelViewer'
import Sidebar, { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, ThemePreference } from '@/components/sidebar/Sidebar'

const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const CHAT_API = 'https://web-production-9f493.up.railway.app/chat'
const CONVERSATIONS_API = 'https://web-production-9f493.up.railway.app/conversations'

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface Message { role: 'user' | 'assistant'; lines: string[]; visibleLines: number }

interface CadUrls {
  stl_url: string | null
  step_url: string | null
  dxf_url: string | null
}

interface AssistantMessage extends Message {
  role: 'assistant'
  cadUrls?: CadUrls
}
type ChatMessage = Message | AssistantMessage

function DownloadButtons({ urls, darkMode }: { urls: CadUrls; darkMode: boolean }) {
  const border = darkMode ? '#2e3847' : '#e0e0e0'
  const textMuted = darkMode ? '#6e7681' : '#999999'
  const textPrimary = darkMode ? '#e6edf3' : '#0a0a0a'
  const buttons = [
    { label: 'STL',  url: urls.stl_url  },
    { label: 'STEP', url: urls.step_url },
    { label: 'DXF',  url: urls.dxf_url  },
  ].filter(b => b.url)
  if (buttons.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
      {buttons.map(({ label, url }) => (
        <a key={label} href={url!} download target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${border}`, backgroundColor: 'transparent', fontSize: '11px', fontWeight: 500, fontFamily: F, color: textMuted, textDecoration: 'none', transition: 'color 0.15s, border-color 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = textPrimary; el.style.borderColor = darkMode ? '#4a5568' : '#aaa' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = textMuted; el.style.borderColor = border }}
        >
          <Download size={11} />{label}
        </a>
      ))}
    </div>
  )
}

const EMPTY_CHATS: { id: string; title: string; time: string }[] = []

function splitLines(text: string): string[] {
  return [text]
}
  
function detectStatusWord(prompt: string): string {
  const p = prompt.toLowerCase()
  const calcKeywords = ['calculate', 'stress', 'force', 'torque', 'load', 'pressure', 'strain', 'deflection', 'formula', 'equation', 'rpm', 'velocity', 'acceleration', 'fos', 'factor of safety', 'fea', 'fatigue']
  const genKeywords = ['generate', 'create', 'design a', 'make a', 'build a', 'model a', 'show a', 'show me a']
  const evalKeywords = ['compare', 'which material', 'best material', 'should i use', 'recommend', 'pros and cons', 'difference between', 'evaluate', 'analyse', 'analyze']

  if (genKeywords.some(k => p.includes(k))) return 'Generating'
  if (calcKeywords.some(k => p.includes(k))) return 'Calculating'
  if (evalKeywords.some(k => p.includes(k))) return 'Evaluating'
  return 'Thinking'
}

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
  chats: { id: string; title: string; time: string }[]; surface: string; border: string; textPrimary: string
  textMuted: string; darkMode: boolean; inputRef: React.RefObject<HTMLInputElement>
  sidebarWidth: number; viewerWidth: number; viewerOpen: boolean
  onSelectChat: (id: string) => void
}

function SearchPanel({ open, query, onChange, onClose, chats, surface, border, textPrimary, textMuted, darkMode, inputRef, onSelectChat }: SearchPanelProps) {
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
                <button key={chat.id} onClick={() => { onSelectChat(chat.id); onClose() }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' }}
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [statusWord, setStatusWord] = useState('Thinking')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerWidth, setViewerWidth] = useState(
    typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.45) : 480
  )
  const [isDragging, setIsDragging] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState<'home' | 'projects'>('home')
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')
  const [systemDark, setSystemDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModel, setActiveModel] = useState<ModelType>('empty')
  const [currentStlUrl, setCurrentStlUrl] = useState<string | null>(null)
  const [realSpecs, setRealSpecs] = useState<{ type: string; dimensions: string; material: string } | null>(null)
  const [pendingModel, setPendingModel] = useState<ModelType>('empty')
  const [shapeDims, setShapeDims] = useState<ShapeDimensions>({})
  const [currentCadUrls, setCurrentCadUrls] = useState<CadUrls | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [conversations, setConversations] = useState<{ id: string; title: string; time: string }[]>([])

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

  useEffect(() => {
  if (!session?.user?.id) return
    fetch("https://web-production-9f493.up.railway.app/auth/upsert-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? "" }) }).catch(() => {})
  fetch(`${CONVERSATIONS_API}/${session.user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then((res: { conversations: Conversation[] } | Conversation[]) => {
  const data = Array.isArray(res) ? res : (res as { conversations: Conversation[] }).conversations ?? []
  if (!Array.isArray(data)) return
  const formatted = data.map(c => ({
          id: c.id,
          title: c.title ?? 'Untitled conversation',
          time: formatConversationTime(c.updated_at),
        }))
        setConversations(formatted)
      })
      .catch(() => {})
  }, [session?.user?.id])

  function formatConversationTime(iso: string): string {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)   return 'Just now'
    if (mins < 60)  return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)   return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return 'Yesterday'
    return `${days}d ago`
  }

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!session?.user?.id) return
    setIsLoadingChat(true)
    try {
      const res = await fetch(`${CONVERSATIONS_API}/${conversationId}/messages`)
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data.messages)) return
      const loaded: ChatMessage[] = data.messages.map((m: { role: string; content: string; has_stl?: boolean; stl_url?: string }) => {
        const content = m.role === 'assistant'
          ? (m.content ?? '').replace(/COMPONENT_REQUEST[\s\S]*?END_COMPONENT_REQUEST/g, '').replace(/ASSEMBLY_REQUEST[\s\S]*?END_ASSEMBLY_REQUEST/g, '').trim()
          : m.content
        return {
          role: m.role as 'user' | 'assistant',
          lines: m.role === 'assistant' ? splitLines(content) : [content],
          visibleLines: m.role === 'assistant' ? splitLines(content).length : 1,
        }
      })

      // Restore the last STL from this conversation
      const lastStlMessage = [...data.messages].reverse().find((m: { has_stl?: boolean; stl_url?: string }) => m.has_stl && m.stl_url)
      if (lastStlMessage) {
        setCurrentStlUrl(lastStlMessage.stl_url)
        setViewerOpen(true)
        setActiveModel('cube')
        const specMatch = lastStlMessage.content?.match(/type:\s*(.+)/i)
        const dimsMatch = lastStlMessage.content?.match(/dimensions:\s*(.+)/i)
        const materialMatch = lastStlMessage.content?.match(/material:\s*(.+)/i)
        setRealSpecs({
          type: specMatch ? specMatch[1].trim() : '',
          dimensions: dimsMatch ? dimsMatch[1].trim() : '',
          material: materialMatch ? materialMatch[1].trim() : '',
        })
      } else {
        setCurrentStlUrl(null)
        setRealSpecs(null)
      }

      setMessages(loaded)
      setCurrentConversationId(conversationId)
      setChatKey(k => k + 1)
    } catch {}
    finally {
      setIsLoadingChat(false)
    }
  }, [session?.user?.id])
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

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    setInput('')

    setMessages(prev => [...prev, { role: 'user', lines: [trimmed], visibleLines: 1 }])
    setIsStreaming(true)
    setStatusWord(detectStatusWord(trimmed))
    abortRef.current = false
    trackMessage(trimmed)

    setMessages(prev => [...prev, { role: 'assistant', lines: [], visibleLines: 0 } as AssistantMessage])

    try {
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: trimmed }],
          user_id: session?.user?.id ?? 'anonymous',
          conversation_id: currentConversationId,
        }),
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const data = await response.json()

      if (data.conversation_id) {
        setCurrentConversationId(data.conversation_id)
        setConversations(prev => {
          const exists = prev.find(c => c.id === data.conversation_id)
          if (exists) return prev
          return [{ id: data.conversation_id, title: trimmed.slice(0, 50), time: 'Just now' }, ...prev]
        })
      }

      const cleanedResponse = (data.response ?? '')
  .replace(/COMPONENT_REQUEST[\s\S]*?END_COMPONENT_REQUEST/g, '')
  .replace(/ASSEMBLY_REQUEST[\s\S]*?END_ASSEMBLY_REQUEST/g, '')
  .trim()
const lines = splitLines(cleanedResponse || 'No response received.')

      const cadUrls: CadUrls = {
        stl_url:  data.stl_url  ?? null,
        step_url: data.step_url ?? null,
        dxf_url:  data.dxf_url  ?? null,
      }

      if (data.has_stl) {
        setCurrentCadUrls(cadUrls)
      }

      if (data.has_stl) {
        setViewerOpen(true)
        setIsGenerating(true)
        setActiveModel('empty')
        setCurrentStlUrl(data.stl_url ?? null)
        const specMatch = data.response.match(/type:\s*(.+)/i)
        const dimsMatch = data.response.match(/dimensions:\s*(.+)/i)
        const materialMatch = data.response.match(/material:\s*(.+)/i)
        setRealSpecs({
          type: specMatch ? specMatch[1].trim() : '',
          dimensions: dimsMatch ? dimsMatch[1].trim() : '',
          material: materialMatch ? materialMatch[1].trim() : '',
        })
        setTimeout(() => {
          setIsGenerating(false)
          const tl = (data.response ?? '').toLowerCase()
          let inferred: ModelType = 'cube'
          if (tl.includes('spur gear'))                           inferred = 'spur_gear'
          else if (tl.includes('helical'))                        inferred = 'helical_gear'
          else if (tl.includes('shaft'))                          inferred = 'shaft'
          else if (tl.includes('bearing'))                        inferred = 'bearing'
          else if (tl.includes('bolt') || tl.includes('screw'))  inferred = 'bolt'
          else if (tl.includes('sphere') || tl.includes('ball')) inferred = 'sphere'
          else if (tl.includes('cylinder'))                       inferred = 'cylinder'
          else if (tl.includes('rectangle') || tl.includes('box')) inferred = 'rectangle'
          setActiveModel(inferred)
        }, 2800)
      }

      setMessages(prev => {
        const u = [...prev]
        u[u.length - 1] = {
          role: 'assistant',
          lines,
          visibleLines: 0,
          ...(data.has_stl ? { cadUrls } : {}),
        } as AssistantMessage
        return u
      })

      for (let i = 0; i < lines.length; i++) {
        if (abortRef.current) break
        await new Promise(r => setTimeout(r, i === 0 ? 280 : 380))
        setMessages(prev => {
          const u = [...prev]
          const l = { ...u[u.length - 1] }
          l.visibleLines = i + 1
          u[u.length - 1] = l
          return u
        })
      }

    } catch (err) {
      console.error('[MecAI] /chat error:', err)
      setMessages(prev => {
        const u = [...prev]
        u[u.length - 1] = { role: 'assistant', lines: ['Something went wrong connecting to MecAI. Please try again.'], visibleLines: 1 } as AssistantMessage
        return u
      })
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming, session, currentConversationId])

  const stopStreaming = useCallback(() => { abortRef.current = true; setIsStreaming(false) }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }, [input, sendMessage])

  const handleNavigate = useCallback((p: 'home' | 'projects') => {
    abortRef.current = true
    setIsStreaming(false)
    setPage(p)
    setMessages([])
    setInput('')
    setViewerOpen(false)
    setActiveModel('empty')
    setPendingModel('empty')
    setIsGenerating(false)
    setCurrentConversationId(null)
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
    darkMode: dm, textareaRef: textareaRef as React.RefObject<HTMLTextAreaElement>, placeholder: '',
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
        @keyframes statusPulse { 0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        * { font-family: ${F}; }
        ::placeholder { color: ${dm ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.32)'}; font-weight: 300; }
        .mecai-markdown p { margin: 0 0 14px 0; }
        .mecai-markdown p:last-child { margin-bottom: 0; }
        .mecai-markdown strong { font-weight: 600; }
        .mecai-markdown em { font-style: italic; }
        .mecai-markdown ul, .mecai-markdown ol { margin: 4px 0 14px 0; padding-left: 22px; }
        .mecai-markdown ul:last-child, .mecai-markdown ol:last-child { margin-bottom: 0; }
        .mecai-markdown li { margin-bottom: 6px; line-height: 1.7; }
        .mecai-markdown li:last-child { margin-bottom: 0; }
        .mecai-markdown ol { list-style-type: decimal; }
        .mecai-markdown ul { list-style-type: disc; }
        .mecai-markdown h1 { font-weight: 600; font-size: 1.35em; margin: 18px 0 8px 0; text-transform: none; letter-spacing: -0.01em; }
        .mecai-markdown h1:first-child { margin-top: 0; }
        .mecai-markdown h2 { font-weight: 600; font-size: 1.18em; margin: 16px 0 8px 0; text-transform: none; letter-spacing: -0.01em; }
        .mecai-markdown h2:first-child { margin-top: 0; }
        .mecai-markdown h3 { font-weight: 600; font-size: 1.05em; margin: 14px 0 6px 0; text-transform: none; }
        .mecai-markdown h3:first-child { margin-top: 0; }
        .mecai-markdown code { background: ${dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}; padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
        .mecai-markdown a { color: #1739E5; text-decoration: underline; }
        .mecai-markdown blockquote { border-left: 2px solid ${dm ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}; padding-left: 14px; margin: 8px 0 14px 0; color: ${textMuted}; }
      `}</style>

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        onNavigate={handleNavigate}
        onSearchOpen={() => { setSearchOpen(true); setSearchQuery('') }}
        darkMode={dm}
        onThemeChange={handleThemeChange}
        themePreference={themePreference}
        conversations={conversations.length > 0 ? conversations : EMPTY_CHATS}
        onSelectChat={loadConversation}
      />

      <SearchPanel
        open={searchOpen} query={searchQuery} onChange={setSearchQuery}
        onClose={() => { setSearchOpen(false); setSearchQuery('') }}
        chats={conversations.length > 0 ? conversations : EMPTY_CHATS}
        surface={surface} border={border}
        textPrimary={textPrimary} textMuted={textMuted} darkMode={dm}
        inputRef={searchInputRef as React.RefObject<HTMLInputElement>} sidebarWidth={sidebarWidth}
        viewerWidth={viewerWidth} viewerOpen={viewerOpen}
        onSelectChat={loadConversation}
      />

      <div style={{ position: 'fixed', top: 0, right: viewerOpen ? 0 : -(viewerWidth + 10), width: viewerWidth, height: '100vh', zIndex: 100, transition: isDragging ? 'none' : 'right 0.45s cubic-bezier(0.16,1,0.3,1)', willChange: 'right', display: 'flex' }}>
        {viewerOpen && (
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
        )}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <ModelViewer
            onClose={() => { setViewerOpen(false); setActiveModel('empty'); setPendingModel('empty') }}
            darkMode={dm}
            modelType={activeModel}
            pendingModel={pendingModel}
            isGenerating={isGenerating}
            shapeDims={shapeDims}
            cadUrls={currentCadUrls}
            stlUrl={currentStlUrl}
            realSpecs={realSpecs}
          />
        </div>
      </div>

      <main style={{ height: '100vh', backgroundColor: bg, display: 'flex', flexDirection: 'column', fontFamily: F, marginLeft: sidebarWidth, marginRight: viewerOpen ? viewerWidth : 0, transition: isDragging ? 'none' : 'margin-left 0.35s cubic-bezier(0.25,0.46,0.45,0.94), margin-right 0.4s cubic-bezier(0.25,0.46,0.45,0.94)', willChange: 'margin-left, margin-right', boxSizing: 'border-box', overflow: 'hidden' }}>

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

        {page === 'home' && (
          <div key={chatKey} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {isLoadingChat ? (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: '#63b3ed', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '12px', color: textMuted, fontFamily: F }}>Loading conversation...</span>
    </div>
  </div>
) : inChat ? (
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
                              {msg.visibleLines === 0 && isStreaming && i === messages.length - 1 ? (
                                <span style={{ fontSize: '13px', fontWeight: 400, color: textMuted, fontFamily: F, letterSpacing: '0.01em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  {statusWord}
                                  <span style={{ display: 'inline-flex', gap: '2px' }}>
                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: textMuted, animation: 'statusPulse 1.2s ease-in-out infinite', animationDelay: '0s' }} />
                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: textMuted, animation: 'statusPulse 1.2s ease-in-out infinite', animationDelay: '0.2s' }} />
                                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: textMuted, animation: 'statusPulse 1.2s ease-in-out infinite', animationDelay: '0.4s' }} />
                                  </span>
                                </span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {msg.lines.slice(0, msg.visibleLines).map((line, li) => (
                                    <div key={li} className="mecai-markdown" style={{ fontSize: '16px', fontWeight: 300, lineHeight: '1.8', color: textPrimary, fontFamily: F, animation: 'fadeSlideIn 0.35s ease forwards' }}>
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{line}</ReactMarkdown>
                                    </div>
                                  ))}
                                  {isStreaming && i === messages.length - 1 && msg.visibleLines < msg.lines.length && (
                                    <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0a1628', marginTop: '6px', animation: 'blink 0.8s infinite' }} />
                                  )}
                                </div>
                              )}
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
                    <InputBar {...inputBarProps} placeholder="Ask a follow-up..." />
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

      </main>
    </>
  )
}