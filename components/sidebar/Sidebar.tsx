'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, Search, Settings, HelpCircle, Keyboard, ChevronDown, ChevronUp, Check, Star, Trash2, FolderPlus, Pencil, MoreHorizontal, FolderOpen, Zap, LogOut, BookMarked } from 'lucide-react'

export const SIDEBAR_EXPANDED = 284
export const SIDEBAR_COLLAPSED = 58
const ICON_AREA = 58
const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"

export type ThemePreference = 'light' | 'dark' | 'system'

export interface SidebarSettings {
  language: string
  units: string
  autoSave: boolean
  notifications: boolean
  reducedMotion: boolean
  compactMode: boolean
  sendWithEnter: boolean
  showTimestamps: boolean
  codeHighlighting: boolean
  dataCollection: boolean
  systemPrompt: string
  responseStyle: 'concise' | 'detailed' | 'educational'
}

interface ConversationSummary {
  id: string
  title: string
  time: string
  starred?: boolean
}

interface Props {
  open: boolean
  onToggle: () => void
  onNavigate: (page: 'home' | 'projects') => void
  onSearchOpen: () => void
  onLibraryOpen: () => void
  darkMode: boolean
  onThemeChange: (theme: ThemePreference) => void
  themePreference: ThemePreference
  conversations: ConversationSummary[]
  onSelectChat: (id: string) => void
  onRenameChat?: (id: string, title: string) => void
  onDeleteChat?: (id: string) => void
  onStarChat?: (id: string) => void
  onWidthChange?: (width: number) => void
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', width: wide ? '560px' : '440px', maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', fontFamily: F, color: '#0a0a0a', textTransform: 'uppercase' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Custom Select ──────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: '8px', border: '1px solid #e8e8e8', backgroundColor: '#fafafa', cursor: 'pointer', fontFamily: F, fontSize: '13px', color: '#333', minWidth: '160px', justifyContent: 'space-between' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.backgroundColor = '#f5f5f5' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.backgroundColor = '#fafafa' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <ChevronDown size={13} color="#999" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 500 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, backgroundColor: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 501, minWidth: '180px', maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderRadius: '7px', border: 'none', backgroundColor: opt === value ? '#f0f4ff' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: F, fontSize: '13px', color: opt === value ? '#0a1628' : '#444', fontWeight: opt === value ? 500 : 400 }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.backgroundColor = '#f8f8f8' }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.backgroundColor = 'transparent' }}>
                <span>{opt}</span>
                {opt === value && <Check size={12} color="#0a1628" style={{ flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Upgrade Modal ──────────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
  const plans = [
    { name: 'Free', price: '₹0', period: '/month', current: true, color: '#0a1628', features: ['Full access during beta', 'Component generation', '3D viewer & exports', 'Conversation history'] },
    { name: 'Pro', price: '₹999', period: '/month', current: false, soon: true, color: '#1739E5', features: ['Everything in Free', 'Stress & Strain FEA', 'Priority generation queue', 'Unlimited exports', 'API access'] },
    { name: 'Max', price: '₹2,499', period: '/month', current: false, soon: true, color: '#7c3aed', features: ['Everything in Pro', 'Assembly simulation', 'Multi-body analysis', 'Dedicated compute', 'Early access to features'] },
    { name: 'Enterprise', price: 'Custom', period: '', current: false, soon: true, color: '#0a1628', features: ['Everything in Max', 'Team workspace', 'Custom integrations', 'SLA support', 'On-premise deployment'] },
  ]
  return (
    <Modal title="Plans & Pricing" onClose={onClose} wide>
      <p style={{ margin: '-8px 0 20px', fontSize: '12px', color: '#999', fontFamily: F }}>All paid plans are coming soon. You're on the free beta — enjoy full access.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {plans.map(plan => (
          <div key={plan.name} style={{ border: `1.5px solid ${plan.current ? plan.color : '#e8e8e8'}`, borderRadius: '12px', padding: '18px', backgroundColor: plan.current ? '#f8f9ff' : '#fafafa', opacity: (plan as any).soon ? 0.75 : 1, position: 'relative' }}>
            {(plan as any).soon && <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '9px', fontWeight: 700, color: '#fff', backgroundColor: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>COMING SOON</div>}
            {plan.current && <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '9px', fontWeight: 700, color: '#fff', backgroundColor: plan.color, padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>CURRENT</div>}
            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: plan.color, fontFamily: F }}>{plan.name}</p>
            <p style={{ margin: '0 0 14px', fontSize: '22px', fontWeight: 700, color: '#0a0a0a', fontFamily: F }}>{plan.price}<span style={{ fontSize: '12px', fontWeight: 400, color: '#999' }}>{plan.period}</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: plan.color, marginTop: '2px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '11.5px', color: '#555', fontFamily: F, lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <button disabled={(plan as any).soon || plan.current} style={{ width: '100%', marginTop: '16px', padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: plan.current ? '#e8eeff' : (plan as any).soon ? '#f0f0f0' : plan.color, color: plan.current ? plan.color : (plan as any).soon ? '#aaa' : 'white', fontFamily: F, fontSize: '12px', fontWeight: 600, cursor: (plan as any).soon || plan.current ? 'not-allowed' : 'pointer' }}>
              {plan.current ? 'Current plan' : (plan as any).soon ? 'Coming soon' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ── Settings Modal ─────────────────────────────────────────────────────────
function SettingsModal({ onClose, darkMode, themePreference, onThemeChange }: { onClose: () => void; darkMode: boolean; themePreference: ThemePreference; onThemeChange: (t: ThemePreference) => void }) {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<SidebarSettings>(() => {
    try {
      const s = localStorage.getItem('mecai_settings')
      return s ? JSON.parse(s) : { language: 'English', units: 'Metric (mm, MPa)', autoSave: true, notifications: true, reducedMotion: false, compactMode: false, sendWithEnter: true, showTimestamps: false, codeHighlighting: true, dataCollection: false, systemPrompt: '', responseStyle: 'detailed' }
    } catch {
      return { language: 'English', units: 'Metric (mm, MPa)', autoSave: true, notifications: true, reducedMotion: false, compactMode: false, sendWithEnter: true, showTimestamps: false, codeHighlighting: true, dataCollection: false, systemPrompt: '', responseStyle: 'detailed' }
    }
  })

  function update<K extends keyof SidebarSettings>(key: K, value: SidebarSettings[K]) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem('mecai_settings', JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('mecai-settings-change', { detail: next }))
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'chat', label: 'Chat' },
    { id: 'ai', label: 'AI' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'about', label: 'About' },
  ]

  const row = (label: string, desc: string, child: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div>
        <p style={{ margin: 0, fontSize: '13px', color: '#111', fontFamily: F, fontWeight: 500 }}>{label}</p>
        {desc && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999', fontFamily: F }}>{desc}</p>}
      </div>
      {child}
    </div>
  )

  const toggle = (active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{ width: '38px', height: '22px', borderRadius: '99px', backgroundColor: active ? '#0a1628' : '#e0e0e0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: active ? '18px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{ fontSize: '12px', color: active ? '#fff' : '#777', backgroundColor: active ? '#0a1628' : '#f0f0f0', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: F, fontWeight: active ? 500 : 400 }}>{label}</button>
  )

  const section = (title: string) => (
    <p style={{ margin: '20px 0 4px', fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: F }}>{title}</p>
  )

  return (
    <Modal title="Settings" onClose={onClose} wide>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px', padding: '4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '7px 4px', borderRadius: '7px', border: 'none', backgroundColor: activeTab === t.id ? 'white' : 'transparent', color: activeTab === t.id ? '#0a1628' : '#888', fontFamily: F, fontSize: '11px', fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'general' && <div>
        {section('Language & Units')}
        {row('Language', 'Interface and response language', <CustomSelect value={settings.language} onChange={v => update('language', v)} options={['English', 'French', 'German', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Turkish']} />)}
        {row('Units', 'Default engineering units', <div style={{ display: 'flex', gap: 6 }}>{pill('Metric (mm)', settings.units === 'Metric (mm, MPa)', () => update('units', 'Metric (mm, MPa)'))}{pill('Imperial (in)', settings.units === 'Imperial (in, psi)', () => update('units', 'Imperial (in, psi)'))}</div>)}
        {section('Data')}
        {row('Auto-save chats', 'Automatically save conversations', toggle(settings.autoSave, () => update('autoSave', !settings.autoSave)))}
      </div>}

      {activeTab === 'appearance' && <div>
        {section('Theme')}
        {row('Color theme', 'Choose your preferred theme', <CustomSelect value={themePreference === 'light' ? 'Light' : themePreference === 'dark' ? 'Dark' : 'System'} onChange={v => onThemeChange(v.toLowerCase() as ThemePreference)} options={['Light', 'Dark', 'System']} />)}
        {section('Layout')}
        {row('Compact mode', 'Reduce spacing for more content', toggle(settings.compactMode, () => update('compactMode', !settings.compactMode)))}
        {row('Reduced motion', 'Minimize animations and transitions', toggle(settings.reducedMotion, () => update('reducedMotion', !settings.reducedMotion)))}
        {section('Code')}
        {row('Syntax highlighting', 'Colorize code in responses', toggle(settings.codeHighlighting, () => update('codeHighlighting', !settings.codeHighlighting)))}
      </div>}

      {activeTab === 'chat' && <div>
        {section('Input')}
        {row('Send with Enter', 'Press Enter to send, Shift+Enter for new line', toggle(settings.sendWithEnter, () => update('sendWithEnter', !settings.sendWithEnter)))}
        {section('Display')}
        {row('Show timestamps', 'Show time on each message', toggle(settings.showTimestamps, () => update('showTimestamps', !settings.showTimestamps)))}
        {section('Keyboard Shortcuts')}
        {[{ keys: '⌘ + Enter', action: 'Send prompt' }, { keys: '⌘ + K', action: 'New chat' }, { keys: '⌘ + B', action: 'Toggle sidebar' }, { keys: '⌘ + E', action: 'Export model' }, { keys: 'Esc', action: 'Close panel' }].map(s => (
          <div key={s.action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '13px', color: '#444', fontFamily: F }}>{s.action}</span>
            <kbd style={{ fontSize: '11px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', padding: '2px 8px', fontFamily: 'monospace', color: '#555' }}>{s.keys}</kbd>
          </div>
        ))}
      </div>}

      {activeTab === 'ai' && <div>
        {section('Response Style')}
        <div style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#111', fontFamily: F, fontWeight: 500 }}>Persona</p>
          <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#999', fontFamily: F }}>How MecAI structures its responses</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['concise', 'detailed', 'educational'] as const).map(style => (
              <button key={style} onClick={() => update('responseStyle', style)} style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: `1.5px solid ${settings.responseStyle === style ? '#0a1628' : '#e8e8e8'}`, backgroundColor: settings.responseStyle === style ? '#f0f4ff' : '#fafafa', cursor: 'pointer', fontFamily: F, fontSize: '12px', fontWeight: settings.responseStyle === style ? 600 : 400, color: settings.responseStyle === style ? '#0a1628' : '#666', transition: 'all 0.15s', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>{style === 'concise' ? '⚡' : style === 'detailed' ? '📐' : '🎓'}</div>
                {style.charAt(0).toUpperCase() + style.slice(1)}
                <div style={{ fontSize: '10px', color: '#999', marginTop: '3px', fontWeight: 400 }}>
                  {style === 'concise' ? 'Short & direct' : style === 'detailed' ? 'Full specs & math' : 'Step-by-step'}
                </div>
              </button>
            ))}
          </div>
        </div>
        {section('System Prompt')}
        <div style={{ padding: '14px 0' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#111', fontFamily: F, fontWeight: 500 }}>Custom instructions</p>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#999', fontFamily: F }}>Tell MecAI about your role, preferences, or constraints. Applied to every conversation.</p>
          <textarea
            value={settings.systemPrompt}
            onChange={e => update('systemPrompt', e.target.value.slice(0, 1000))}
            placeholder={"Examples:\n\"I'm a pharma engineer — always follow GMP/cGMP standards\"\n\"Default to stainless steel 316L for all components\"\n\"I work in the automotive industry, use DIN standards\""}
            rows={6}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e8e8e8', fontFamily: F, fontSize: '12px', color: '#333', outline: 'none', resize: 'vertical', lineHeight: '1.6', boxSizing: 'border-box', backgroundColor: '#fafafa' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '11px', color: '#bbb', fontFamily: F }}>{settings.systemPrompt.length} / 1000 characters</span>
            {settings.systemPrompt && <button onClick={() => update('systemPrompt', '')} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F }}>Clear</button>}
          </div>
        </div>
      </div>}

      {activeTab === 'notifications' && <div>
        {section('Alerts')}
        {row('Enable notifications', 'Get notified about generation status', toggle(settings.notifications, () => update('notifications', !settings.notifications)))}
        {row('Generation complete', 'Alert when a model is ready', toggle(settings.notifications, () => {}))}
        {row('Error alerts', 'Notify on generation failures', toggle(true, () => {}))}
      </div>}

      {activeTab === 'privacy' && <div>
        {section('Data Usage')}
        {row('Usage analytics', 'Help improve MecAI by sharing anonymised usage data', toggle(settings.dataCollection, () => update('dataCollection', !settings.dataCollection)))}
        {section('Account')}
        <div style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#111', fontFamily: F, fontWeight: 500 }}>Delete all conversations</p>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#999', fontFamily: F }}>Permanently remove all your chat history</p>
          <button style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid #fca5a5', backgroundColor: '#fff', color: '#dc2626', fontFamily: F, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Delete all chats</button>
        </div>
        <div style={{ padding: '14px 0' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#111', fontFamily: F, fontWeight: 500 }}>Delete account</p>
          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#999', fontFamily: F }}>Permanently delete your account and all data</p>
          <button style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', backgroundColor: '#dc2626', color: 'white', fontFamily: F, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Delete account</button>
        </div>
      </div>}

      {activeTab === 'about' && <div>
        {section('MecAI')}
        {[{ label: 'Version', value: 'v2.0 Beta' }, { label: 'Build', value: 'August 2026' }, { label: 'Made by', value: 'Atherion Private Limited' }, { label: 'Website', value: 'atherion.co' }].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: '13px', color: '#444', fontFamily: F }}>{item.label}</span>
            <span style={{ fontSize: '13px', color: '#888', fontFamily: F }}>{item.value}</span>
          </div>
        ))}
        {section('Legal')}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map(l => (
            <a key={l} href="#" style={{ fontSize: '12px', color: '#1739E5', fontFamily: F, textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </div>}
    </Modal>
  )
}

// ── Help Modal ─────────────────────────────────────────────────────────────
function HelpModal({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const faqs = [
    { q: 'How do I generate a 3D model?', a: 'Type a description in the prompt box — e.g. "generate a 20-tooth spur gear, module 2.0 mm, 4140 steel". MecAI will generate the 3D model automatically.' },
    { q: 'What file formats can I export?', a: 'STL, STEP, and DXF export are available from the 3D viewer toolbar.' },
    { q: 'How accurate are the calculations?', a: 'MecAI uses standard engineering formulas. Always verify critical dimensions before manufacturing.' },
    { q: 'What units does MecAI use?', a: 'Metric by default (mm, MPa, Nm). Switch to Imperial in Settings.' },
  ]

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #e8e8e8', fontFamily: F, fontSize: '13px', color: '#333', outline: 'none', boxSizing: 'border-box' }

  return (
    <Modal title="Help & Support" onClose={onClose} wide>
      {faqs.map(item => (
        <div key={item.q} style={{ borderBottom: '1px solid #f0f0f0' }}>
          <button onClick={() => setExpanded(expanded === item.q ? null : item.q)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111', fontFamily: F }}>{item.q}</span>
            {expanded === item.q ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
          </button>
          {expanded === item.q && <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#666', lineHeight: '1.65', fontFamily: F }}>{item.a}</p>}
        </div>
      ))}
      <p style={{ margin: '20px 0 12px', fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: F }}>Send Feedback</p>
      {sent ? (
        <div style={{ padding: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: '#15803d', fontFamily: F }}>✓ Thanks for your feedback!</span>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); setSent(true); setTimeout(() => setSent(false), 3000); setFeedback({ name: '', email: '', message: '' }) }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input value={feedback.name} onChange={e => setFeedback(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={inputStyle} />
            <input type="email" value={feedback.email} onChange={e => setFeedback(f => ({ ...f, email: e.target.value }))} placeholder="Email address" style={inputStyle} />
          </div>
          <textarea value={feedback.message} onChange={e => setFeedback(f => ({ ...f, message: e.target.value }))} placeholder="Tell us what you think..." rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          <button type="submit" disabled={!feedback.message.trim()} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: feedback.message.trim() ? '#0a1628' : '#e8e8e8', color: feedback.message.trim() ? 'white' : '#aaa', fontFamily: F, fontSize: '13px', fontWeight: 500, cursor: feedback.message.trim() ? 'pointer' : 'not-allowed' }}>Send feedback</button>
        </form>
      )}
    </Modal>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  return (
    <div style={{ width: size, height: size, borderRadius: size > 32 ? '10px' : '7px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size > 32 ? '14px' : '10px', fontWeight: 600, color: 'white', fontFamily: F, letterSpacing: '0.04em' }}>{initials}</span>
    </div>
  )
}

// ── Profile Popover ────────────────────────────────────────────────────────
function ProfilePopover({ userName, userEmail, onClose, onUpgrade, onSettings, onHelp, onShortcuts }: {
  userName: string; userEmail: string; onClose: () => void
  onUpgrade: () => void; onSettings: () => void; onHelp: () => void; onShortcuts: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const profileBtn = document.getElementById('profile-toggle-btn')
        if (profileBtn && profileBtn.contains(e.target as Node)) return
        onClose()
      }
    }
    setTimeout(() => document.addEventListener('mousedown', fn), 10)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const menuItem = (icon: React.ReactNode, label: string, onClick: () => void, highlight?: boolean, danger?: boolean) => (
    <button onClick={() => { onClick(); onClose() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: F, fontSize: '13px', color: danger ? '#f87171' : highlight ? '#4a7fff' : 'rgba(255,255,255,0.8)', textAlign: 'left', borderRadius: '7px', transition: 'background 0.1s' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
      <span style={{ color: danger ? '#f87171' : highlight ? '#4a7fff' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  )

  return (
    <div ref={ref} style={{ position: 'absolute', bottom: '100%', left: '8px', right: '8px', marginBottom: '8px', backgroundColor: '#0f1d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', zIndex: 700, overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '9px', backgroundColor: '#1739E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', fontFamily: F }}>{initials}</span>
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, color: '#4a7fff', backgroundColor: 'rgba(74,127,255,0.15)', padding: '2px 7px', borderRadius: '4px', fontFamily: F, flexShrink: 0 }}>FREE</span>
        </div>
      </div>
      <div style={{ padding: '6px' }}>
        <button onClick={() => { onUpgrade(); onClose() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', border: 'none', background: 'linear-gradient(135deg, rgba(23,57,229,0.3), rgba(74,127,255,0.2))', cursor: 'pointer', fontFamily: F, fontSize: '13px', color: '#4a7fff', textAlign: 'left', borderRadius: '7px', marginBottom: '2px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23,57,229,0.45), rgba(74,127,255,0.35))' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23,57,229,0.3), rgba(74,127,255,0.2))' }}>
          <Zap size={14} fill="#4a7fff" color="#4a7fff" />
          Upgrade Plan
        </button>
        {menuItem(<Settings size={14} />, 'Settings', onSettings)}
        {menuItem(<HelpCircle size={14} />, 'Help & Support', onHelp)}
        {menuItem(<Keyboard size={14} />, 'Keyboard Shortcuts', onShortcuts)}
      </div>
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.07)', margin: '0 8px' }} />
      <div style={{ padding: '6px' }}>
        {menuItem(<LogOut size={14} />, 'Sign out', () => signOut({ callbackUrl: '/' }), false, true)}
      </div>
    </div>
  )
}

// ── Conversation Item ──────────────────────────────────────────────────────
function ConversationItem({ chat, isActive, onSelect, onRename, onDelete, onToggleStar }: {
  chat: ConversationSummary; isActive: boolean; onSelect: () => void
  onRename?: (title: string) => void; onDelete?: () => void; onToggleStar?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(chat.title)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [menuOpen])

  const menuItems = [
    { icon: <Star size={13} fill={chat.starred ? 'currentColor' : 'none'} />, label: chat.starred ? 'Unstar' : 'Star', action: () => { onToggleStar?.(); setMenuOpen(false) } },
    { icon: <FolderPlus size={13} />, label: 'Add to project', action: () => { alert('Add to project — coming soon'); setMenuOpen(false) } },
    { icon: <Pencil size={13} />, label: 'Rename', action: () => { setIsRenaming(true); setMenuOpen(false) } },
    { icon: <Trash2 size={13} />, label: 'Delete', action: () => { onDelete?.(); setMenuOpen(false) }, danger: true },
  ]

  if (isRenaming) {
    return (
      <div style={{ padding: '4px 8px', margin: '2px 8px' }}>
        <input
          autoFocus
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { onRename?.(renameValue); setIsRenaming(false) }
            if (e.key === 'Escape') { setRenameValue(chat.title); setIsRenaming(false) }
          }}
          onBlur={() => { onRename?.(renameValue); setIsRenaming(false) }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: 'white', fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', margin: '2px 8px' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onSelect} style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '9px 10px 9px 16px', borderRadius: '8px', border: 'none', textAlign: 'left', backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : hovered ? 'rgba(255,255,255,0.07)' : 'transparent', cursor: 'pointer', transition: 'background-color 0.15s', boxSizing: 'border-box', gap: '6px' }}>
        <span style={{ fontSize: '13px', color: isActive ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: isActive ? 500 : 400, fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: (hovered || menuOpen) ? '20px' : '0' }}>
          {chat.title}
        </span>
      </button>
      {(hovered || menuOpen) && (
        <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '22px', height: '22px', borderRadius: '5px', border: 'none', backgroundColor: menuOpen ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}>
          <MoreHorizontal size={13} />
        </button>
      )}
      {menuOpen && (
        <div ref={menuRef} style={{ position: 'absolute', right: 0, top: '100%', zIndex: 600, backgroundColor: '#1a2332', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '4px', minWidth: '170px', marginTop: '4px' }}>
          {menuItems.map(item => (
            <button key={item.label} onClick={item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '7px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: F, fontSize: '13px', color: (item as any).danger ? '#f87171' : 'rgba(255,255,255,0.8)', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = (item as any).danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
              <span style={{ color: (item as any).danger ? '#f87171' : chat.starred && item.label === 'Unstar' ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Sidebar ───────────────────────────────────────────────────────────
export default function Sidebar({ open, onToggle, onNavigate, onSearchOpen, onLibraryOpen, darkMode, onThemeChange, themePreference, conversations, onSelectChat, onRenameChat, onDeleteChat, onStarChat, onWidthChange }: Props) {
  const { data: session } = useSession()
  const userName  = session?.user?.name  ?? 'User'
  const userEmail = session?.user?.email ?? ''
  const firstName = userName.split(' ')[0]
  const lastName  = userName.split(' ').slice(1).join(' ')
  const shortName = lastName ? `${firstName} ${lastName[0]}.` : firstName

  const [activeChat, setActiveChat]       = useState('')
  const [showSettings, setShowSettings]   = useState(false)
  const [showHelp, setShowHelp]           = useState(false)
  const [showUpgrade, setShowUpgrade]     = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showProfile, setShowProfile]     = useState(false)
  const [mounted, setMounted]             = useState(false)
  const [starredOpen, setStarredOpen]     = useState(true)
  const [recentOpen, setRecentOpen]       = useState(true)
  const [hoverOpen, setHoverOpen]         = useState(false)
  const [localConvos, setLocalConvos]     = useState<ConversationSummary[]>(
    () => conversations.map(c => ({ ...c, starred: c.starred ?? false }))
  )
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOpen = open || hoverOpen

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setLocalConvos(prev => {
      const starredIds = new Set(prev.filter(c => c.starred).map(c => c.id))
      return conversations.map(c => ({ ...c, starred: starredIds.has(c.id) }))
    })
  }, [conversations])

  useEffect(() => {
    onWidthChange?.(isOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED)
  }, [isOpen, onWidthChange])

  function handleSidebarMouseEnter() {
    if (open) return
    hoverTimeout.current = setTimeout(() => setHoverOpen(true), 180)
  }

  function handleSidebarMouseLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setHoverOpen(false)
    if (!open) setShowProfile(false)
  }

  function handleProfileClick(e: React.MouseEvent) {
    e.stopPropagation()
    setShowProfile(o => !o)
  }

  function handleSelectChat(id: string) {
    setActiveChat(id)
    onSelectChat(id)
  }

  function handleToggleStar(id: string) {
    setLocalConvos(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c))
    onStarChat?.(id)
  }

  const starred = localConvos.filter(c => c.starred)
  const recent  = localConvos.filter(c => !c.starred)

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes iconPop { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1)} }
        .sidebar-icon-btn { transition: background-color 0.15s, transform 0.15s; }
        .sidebar-icon-btn:hover { transform: scale(1.08); }
        .sidebar-icon-btn:active { animation: iconPop 0.25s ease; }
      `}</style>

      {showSettings  && <SettingsModal  onClose={() => setShowSettings(false)}  darkMode={darkMode} themePreference={themePreference} onThemeChange={onThemeChange} />}
      {showHelp      && <HelpModal      onClose={() => setShowHelp(false)} />}
      {showUpgrade   && <UpgradeModal   onClose={() => setShowUpgrade(false)} />}
      {showShortcuts && (
        <Modal title="Keyboard Shortcuts" onClose={() => setShowShortcuts(false)}>
          {[{ keys: '⌘ + Enter', action: 'Send prompt' }, { keys: '⌘ + K', action: 'New chat' }, { keys: '⌘ + B', action: 'Toggle sidebar' }, { keys: '⌘ + E', action: 'Export model' }, { keys: 'Esc', action: 'Close panel' }].map(s => (
            <div key={s.action} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '13px', color: '#444', fontFamily: F }}>{s.action}</span>
              <kbd style={{ fontSize: '11px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', padding: '2px 8px', fontFamily: 'monospace', color: '#555' }}>{s.keys}</kbd>
            </div>
          ))}
        </Modal>
      )}

      <div onMouseEnter={handleSidebarMouseEnter} onMouseLeave={handleSidebarMouseLeave} style={{ position: 'fixed', top: 0, left: 0, width: `${isOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED}px`, height: '100vh', backgroundColor: mounted ? (darkMode ? '#0a1628' : '#0f2d6e') : '#0f2d6e', zIndex: 300, display: 'flex', flexDirection: 'column', transition: 'width 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)', overflowX: 'hidden', overflowY: 'hidden', boxShadow: isOpen ? '4px 0 32px rgba(0,0,0,0.3)' : 'none' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', height: '52px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <span style={{ fontFamily: F, whiteSpace: 'nowrap', opacity: open ? 1 : 0, transition: 'opacity 0.2s ease', pointerEvents: 'none', paddingLeft: '16px', flex: 1, fontSize: '18px', lineHeight: 1, letterSpacing: '-0.04em' }}>
            <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.88)' }}>Mec</span>
            <span style={{ fontWeight: 500, background: 'linear-gradient(135deg, #1739E5, #CCDEFF, #1739E5)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s ease infinite' }}>AI</span>
          </span>
          <div style={{ position: 'absolute', left: open ? `${SIDEBAR_EXPANDED - ICON_AREA}px` : '0px', transition: 'left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)', width: `${ICON_AREA}px`, height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StableIco onClick={onToggle} tip="Toggle sidebar  ⌘B">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <rect x="3" y="3" width="6" height="18" rx="2" fill="currentColor" stroke="none" opacity={open ? 0.35 : 1} style={{ transition: 'opacity 0.3s ease' }} />
                <rect x="9" y="3" width="12" height="18" rx="2" fill="currentColor" stroke="none" opacity={open ? 1 : 0.35} style={{ transition: 'opacity 0.3s ease' }} />
              </svg>
            </StableIco>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: isOpen ? 'auto' : 'hidden', overflowX: 'hidden' }}>
          <SidebarRow open={isOpen} icon={<Plus size={18} />}        label="New chat"  tip="New chat  ⌘K"  onClick={() => onNavigate('home')}     iconAreaWidth={ICON_AREA} />
          <SidebarRow open={isOpen} icon={<Search size={18} />}      label="Search"   tip="Search chats"  onClick={onSearchOpen}                iconAreaWidth={ICON_AREA} />
          <SidebarRow open={isOpen} icon={<BookMarked size={18} />}  label="Library"  tip="Library"       onClick={onLibraryOpen}               iconAreaWidth={ICON_AREA} />
          <SidebarRow open={isOpen} icon={<FolderOpen size={18} />}  label="Projects" tip="Projects"      onClick={() => onNavigate('projects')} iconAreaWidth={ICON_AREA} />

          {isOpen && (
            <>
              {/* Starred section */}
              {starred.length > 0 && (
                <>
                  <button onClick={() => setStarredOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: F, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Star size={8} fill="rgba(255,255,255,0.2)" color="rgba(255,255,255,0.2)" /> Starred
                    </span>
                    {starredOpen ? <ChevronUp size={10} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={10} color="rgba(255,255,255,0.2)" />}
                  </button>
                  {starredOpen && starred.map(chat => (
                    <ConversationItem key={chat.id} chat={chat} isActive={activeChat === chat.id} onSelect={() => handleSelectChat(chat.id)}
                      onRename={(title) => onRenameChat?.(chat.id, title)}
                      onDelete={() => onDeleteChat?.(chat.id)}
                      onToggleStar={() => handleToggleStar(chat.id)}
                    />
                  ))}
                </>
              )}

              {/* Recent section */}
              {recent.length > 0 && (
                <>
                  <button onClick={() => setRecentOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: F }}>Recent</span>
                    {recentOpen ? <ChevronUp size={10} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={10} color="rgba(255,255,255,0.2)" />}
                  </button>
                  {recentOpen && recent.map(chat => (
                    <ConversationItem key={chat.id} chat={chat} isActive={activeChat === chat.id} onSelect={() => handleSelectChat(chat.id)}
                      onRename={(title) => onRenameChat?.(chat.id, title)}
                      onDelete={() => onDeleteChat?.(chat.id)}
                      onToggleStar={() => handleToggleStar(chat.id)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Bottom — profile only */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px', paddingBottom: '4px', flexShrink: 0, position: 'relative' }}>
          {showProfile && (
            <ProfilePopover
              userName={userName}
              userEmail={userEmail}
              onClose={() => setShowProfile(false)}
              onUpgrade={() => setShowUpgrade(true)}
              onSettings={() => setShowSettings(true)}
              onHelp={() => setShowHelp(true)}
              onShortcuts={() => setShowShortcuts(true)}
            />
          )}
          <button id="profile-toggle-btn" onClick={(e) => handleProfileClick(e)} style={{ width: '100%', display: 'flex', alignItems: 'center', border: 'none', backgroundColor: showProfile ? 'rgba(255,255,255,0.06)' : 'transparent', cursor: 'pointer', transition: 'background-color 0.15s', borderRadius: '6px', margin: '2px 0' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => { if (!showProfile) e.currentTarget.style.backgroundColor = 'transparent' }}>
            <div style={{ width: `${ICON_AREA}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
              <Avatar name={userName} size={30} />
            </div>
            <div style={{ textAlign: 'left', opacity: isOpen ? 1 : 0, transition: 'opacity 0.2s ease', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: F }}>{shortName}</p>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', fontFamily: F }}>{userEmail}</p>
            </div>
            {isOpen && <ChevronUp size={13} color="rgba(255,255,255,0.25)" style={{ marginRight: '12px', transform: showProfile ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', flexShrink: 0 }} />}
          </button>
          <div style={{ height: '6px' }} />
        </div>
      </div>
    </>
  )
}

// ── SidebarRow ─────────────────────────────────────────────────────────────
function SidebarRow({ open, icon, label, tip, onClick, iconAreaWidth }: { open: boolean; icon: React.ReactNode; label: string; tip?: string; onClick: () => void; iconAreaWidth: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onClick} className="sidebar-icon-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '8px', margin: '1px 0', padding: 0 }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
        <div style={{ width: `${iconAreaWidth}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', color: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', transition: 'color 0.15s' }}>
          {icon}
        </div>
        <span style={{ fontSize: '14.5px', fontWeight: 400, color: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)', fontFamily: F, whiteSpace: 'nowrap', opacity: open ? 1 : 0, transition: 'opacity 0.2s ease, color 0.15s', overflow: 'hidden' }}>{label}</span>
      </button>
      {!open && hovered && tip && (
        <div style={{ position: 'absolute', left: `${iconAreaWidth + 8}px`, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(15,25,50,0.96)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontFamily: F, padding: '5px 10px', borderRadius: '7px', whiteSpace: 'nowrap', zIndex: 500, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {tip}
        </div>
      )}
    </div>
  )
}

// ── StableIco ──────────────────────────────────────────────────────────────
function StableIco({ onClick, tip, children }: { onClick: () => void; tip?: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onClick} className="sidebar-icon-btn" style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: 'transparent', border: 'none', color: hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
        {children}
      </button>
      {hovered && tip && (
        <div style={{ position: 'absolute', left: '44px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(15,25,50,0.96)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontFamily: F, padding: '5px 10px', borderRadius: '7px', whiteSpace: 'nowrap', zIndex: 500, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {tip}
        </div>
      )}
    </div>
  )
}