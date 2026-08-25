'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Plus, Search, Settings, HelpCircle, Keyboard, ChevronDown, ChevronUp, Check, Star, Trash2, FolderPlus, Pencil, MoreHorizontal, FolderOpen } from 'lucide-react'

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
}

interface ConversationSummary {
  id: string
  title: string
  time: string
}

interface Props {
  open: boolean
  onToggle: () => void
  onNavigate: (page: 'home' | 'projects') => void
  onSearchOpen: () => void
  darkMode: boolean
  onThemeChange: (theme: ThemePreference) => void
  themePreference: ThemePreference
  conversations: ConversationSummary[]
  onSelectChat: (id: string) => void
  onRenameChat?: (id: string, title: string) => void
  onDeleteChat?: (id: string) => void
  onStarChat?: (id: string) => void
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 400, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '28px', width: wide ? '520px' : '420px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', fontFamily: F, color: '#0a0a0a', textTransform: 'uppercase' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

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

function SettingsModal({ onClose, themePreference, onThemeChange }: { onClose: () => void; darkMode: boolean; themePreference: ThemePreference; onThemeChange: (t: ThemePreference) => void }) {
  const [settings, setSettings] = useState<SidebarSettings>(() => {
    try { const saved = localStorage.getItem('mecai_settings'); return saved ? JSON.parse(saved) : { language: 'English', units: 'Metric (mm, MPa)', autoSave: true, notifications: true } }
    catch { return { language: 'English', units: 'Metric (mm, MPa)', autoSave: true, notifications: true } }
  })

  function update<K extends keyof SidebarSettings>(key: K, value: SidebarSettings[K]) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem('mecai_settings', JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('mecai-settings-change', { detail: next }))
  }

  const row = (label: string, child: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: '13px', color: '#444', fontFamily: F }}>{label}</span>
      {child}
    </div>
  )

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{ fontSize: '12px', color: active ? '#fff' : '#777', backgroundColor: active ? '#0a1628' : '#f0f0f0', padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: F, fontWeight: active ? 500 : 400 }}>{label}</button>
  )

  const toggle = (active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{ width: '38px', height: '22px', borderRadius: '99px', backgroundColor: active ? '#0a1628' : '#e0e0e0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: active ? '18px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )

  return (
    <Modal title="Settings" onClose={onClose}>
      <div style={{ marginBottom: '4px' }}><p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: F }}>Appearance</p></div>
      {row('Theme', <CustomSelect value={themePreference === 'light' ? 'Light' : themePreference === 'dark' ? 'Dark' : 'System'} onChange={v => onThemeChange(v.toLowerCase() as ThemePreference)} options={['Light', 'Dark', 'System']} />)}
      <p style={{ margin: '12px 0 4px', fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: F }}>Preferences</p>
      {row('Language', <CustomSelect value={settings.language} onChange={v => update('language', v)} options={['English', 'French', 'German', 'Spanish', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Turkish']} />)}
      {row('Units', <div style={{ display: 'flex', gap: 6 }}>{pill('Metric (mm)', settings.units === 'Metric (mm, MPa)', () => update('units', 'Metric (mm, MPa)'))}{pill('Imperial (in)', settings.units === 'Imperial (in, psi)', () => update('units', 'Imperial (in, psi)'))}</div>)}
      {row('Auto-save chats', toggle(settings.autoSave, () => update('autoSave', !settings.autoSave)))}
      {row('Notifications', toggle(settings.notifications, () => update('notifications', !settings.notifications)))}
      <p style={{ margin: '20px 0 0', fontSize: '11px', color: '#bbb', fontFamily: F, lineHeight: 1.6 }}>Unit changes apply to new responses.</p>
    </Modal>
  )
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const faqs = [
    { q: 'How do I generate a 3D model?', a: 'Type a description in the prompt box — e.g. "generate a 20-tooth spur gear, module 2.0 mm, 4140 steel". MecAI will generate the 3D model automatically.' },
    { q: 'What file formats can I export?', a: 'STL, STEP, and DXF export are available from the 3D viewer toolbar.' },
    { q: 'How accurate are the calculations?', a: 'MecAI uses standard engineering formulas (Von Mises, Goodman criterion, etc.). Always verify critical dimensions before manufacturing.' },
    { q: 'What units does MecAI use?', a: 'Metric by default (mm, MPa, Nm). Switch to Imperial in Settings.' },
  ]

  function sendFeedback(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    setFeedback({ name: '', email: '', message: '' })
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #e8e8e8', fontFamily: F, fontSize: '13px', color: '#333', outline: 'none', boxSizing: 'border-box' }

  return (
    <Modal title="Help & Support" onClose={onClose} wide>
      <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: F }}>FAQ</p>
      {faqs.map(item => (
        <div key={item.q} style={{ borderBottom: '1px solid #f0f0f0' }}>
          <button onClick={() => setExpanded(expanded === item.q ? null : item.q)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111', fontFamily: F }}>{item.q}</span>
            {expanded === item.q ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
          </button>
          {expanded === item.q && <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#666', lineHeight: '1.65', fontFamily: F }}>{item.a}</p>}
        </div>
      ))}
      <p style={{ margin: '24px 0 12px', fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: F }}>Send Feedback</p>
      {sent ? (
        <div style={{ padding: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', color: '#15803d', fontFamily: F }}>✓ Thanks for your feedback!</span>
        </div>
      ) : (
        <form onSubmit={sendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  return (
    <div style={{ width: size, height: size, borderRadius: size > 32 ? '10px' : '7px', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size > 32 ? '14px' : '10px', fontWeight: 600, color: 'white', fontFamily: F, letterSpacing: '0.04em' }}>{initials}</span>
    </div>
  )
}

function ConversationItem({ chat, isActive, onSelect, onRename, onDelete, onStar }: {
  chat: ConversationSummary
  isActive: boolean
  onSelect: () => void
  onRename?: (title: string) => void
  onDelete?: () => void
  onStar?: () => void
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
    { icon: <Star size={13} />, label: 'Star', action: () => { onStar?.(); setMenuOpen(false) } },
    { icon: <FolderPlus size={13} />, label: 'Add to project', action: () => { alert('Add to project — coming soon'); setMenuOpen(false) } },
    { icon: <Pencil size={13} />, label: 'Rename', action: () => { setIsRenaming(true); setMenuOpen(false) } },
    { icon: <Trash2 size={13} />, label: 'Delete', action: () => { onDelete?.(); setMenuOpen(false) }, danger: true },
  ]

  if (isRenaming) {
    return (
      <div style={{ padding: '4px 8px', margin: '2px 8px' }}>
        <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { onRename?.(renameValue); setIsRenaming(false) }
            if (e.key === 'Escape') { setRenameValue(chat.title); setIsRenaming(false) }
          }}
          onBlur={() => { onRename?.(renameValue); setIsRenaming(false) }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: 'white', fontFamily: F, outline: 'none', boxSizing: 'border-box' }} />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', margin: '2px 8px' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onSelect} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px 9px 16px', borderRadius: '8px', border: 'none', textAlign: 'left', backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : hovered ? 'rgba(255,255,255,0.07)' : 'transparent', cursor: 'pointer', transition: 'background-color 0.15s', boxSizing: 'border-box' }}>
        <span style={{ fontSize: '13px', color: isActive ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: isActive ? 500 : 400, fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: (hovered || menuOpen) ? '24px' : '0' }}>
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
            <button key={item.label} onClick={item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '7px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: F, fontSize: '13px', color: item.danger ? '#f87171' : 'rgba(255,255,255,0.8)', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = item.danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
              <span style={{ color: item.danger ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ open, onToggle, onNavigate, onSearchOpen, darkMode, onThemeChange, themePreference, conversations, onSelectChat, onRenameChat, onDeleteChat, onStarChat }: Props) {
  const { data: session } = useSession()

  const userName  = session?.user?.name  ?? 'User'
  const userEmail = session?.user?.email ?? ''
  const firstName = userName.split(' ')[0]
  const lastName  = userName.split(' ').slice(1).join(' ')
  const shortName = lastName ? `${firstName} ${lastName[0]}.` : firstName

  const [activeChat, setActiveChat]       = useState('')
  const [showSettings, setShowSettings]   = useState(false)
  const [showHelp, setShowHelp]           = useState(false)
  const [showProfile, setShowProfile]     = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [mounted, setMounted]             = useState(false)

  useEffect(() => setMounted(true), [])

  function handleSelectChat(id: string) {
    setActiveChat(id)
    onSelectChat(id)
  }

  return (
    <>
      <style>{`@keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }`}</style>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} darkMode={darkMode} themePreference={themePreference} onThemeChange={onThemeChange} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

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

      {showProfile && (
        <Modal title="Profile" onClose={() => setShowProfile(false)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '10px', backgroundColor: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'white', fontFamily: F, letterSpacing: '0.04em' }}>{userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#111', fontFamily: F }}>{userName}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#aaa', fontFamily: F }}>{userEmail}</p>
            </div>
          </div>
          {[{ label: 'Account type', value: 'Beta' }, { label: 'Signed in with', value: 'Google' }, { label: 'Models generated', value: '—' }, { label: 'Storage used', value: '—' }].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '13px', color: '#444', fontFamily: F }}>{item.label}</span>
              <span style={{ fontSize: '13px', color: '#888', fontFamily: F }}>{item.value}</span>
            </div>
          ))}

          {/* Subscription section */}
          <p style={{ margin: '20px 0 12px', fontSize: '11px', fontWeight: 600, color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: F }}>Subscription</p>

          {/* Current plan */}
          <div style={{ border: '1.5px solid #0a1628', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', backgroundColor: '#f8f9ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a1628', fontFamily: F }}>Free</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff', backgroundColor: '#0a1628', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>Current</span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#666', fontFamily: F, lineHeight: 1.5 }}>Free during beta. Includes full access to MecAI component generation, 3D viewer, and exports.</p>
          </div>

          {/* Pro plan */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', backgroundColor: '#fafafa', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a1628', fontFamily: F }}>Pro</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff', backgroundColor: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>Coming Soon</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#666', fontFamily: F, lineHeight: 1.5 }}>Advanced simulations, priority generation, unlimited exports, and stress & strain analysis.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Stress & Strain FEA', 'Priority queue', 'Unlimited exports', 'API access'].map(f => (
                <span key={f} style={{ fontSize: '10px', color: '#0a1628', backgroundColor: '#e8eeff', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Max plan */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', backgroundColor: '#fafafa', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a1628', fontFamily: F }}>Max</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff', backgroundColor: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>Coming Soon</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#666', fontFamily: F, lineHeight: 1.5 }}>Everything in Pro plus advanced assembly simulation, multi-body analysis, and dedicated compute.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Assembly simulation', 'Multi-body analysis', 'Dedicated compute', 'Early features'].map(f => (
                <span key={f} style={{ fontSize: '10px', color: '#0a1628', backgroundColor: '#e8eeff', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Enterprise plan */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', backgroundColor: '#fafafa', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a1628', fontFamily: F }}>Enterprise</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#fff', backgroundColor: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>Coming Soon</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#666', fontFamily: F, lineHeight: 1.5 }}>Custom integrations, team management, dedicated support, and on-premise deployment.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Team workspace', 'Custom integrations', 'SLA support', 'On-premise'].map(f => (
                <span key={f} style={{ fontSize: '10px', color: '#0a1628', backgroundColor: '#e8eeff', padding: '2px 8px', borderRadius: '4px', fontFamily: F }}>{f}</span>
              ))}
            </div>
          </div>

          <button onClick={() => signOut({ callbackUrl: '/' })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: '#f8f8f8', cursor: 'pointer', fontSize: '13px', color: '#e53e3e', fontFamily: F, fontWeight: 500 }}>Sign out</button>
        </Modal>
      )}

      {/* ── SIDEBAR ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: `${open ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED}px`, height: '100vh', backgroundColor: mounted ? (darkMode ? '#0a1628' : '#0f2d6e') : '#0f2d6e', zIndex: 300, display: 'flex', flexDirection: 'column', transition: 'width 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)', overflowX: 'hidden', overflowY: 'hidden', boxShadow: open ? '4px 0 32px rgba(0,0,0,0.3)' : 'none' }}>

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
                <rect x="3" y="3" width="6" height="18" rx="2" fill="currentColor" stroke="none" />
              </svg>
            </StableIco>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: open ? 'auto' : 'hidden', overflowX: 'hidden' }}>
          <SidebarRow open={open} icon={<Plus size={18} />}       label="New chat"    tip="New chat  ⌘K"  onClick={() => onNavigate('home')}    iconAreaWidth={ICON_AREA} />
          <SidebarRow open={open} icon={<Search size={18} />}     label="Search"      tip="Search chats"  onClick={onSearchOpen}               iconAreaWidth={ICON_AREA} />
          <SidebarRow open={open} icon={<FolderOpen size={18} />} label="Projects"    tip="Projects"      onClick={() => onNavigate('projects')} iconAreaWidth={ICON_AREA} />

          {open && conversations.length > 0 && (
            <>
              <div style={{ padding: '14px 18px 4px 18px' }}>
                <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: F }}>Recent</span>
              </div>
              {conversations.map(chat => (
                <ConversationItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChat === chat.id}
                  onSelect={() => handleSelectChat(chat.id)}
                  onRename={(title) => onRenameChat?.(chat.id, title)}
                  onDelete={() => onDeleteChat?.(chat.id)}
                  onStar={() => onStarChat?.(chat.id)}
                />
              ))}
            </>
          )}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px', paddingBottom: '4px', flexShrink: 0 }}>
          <SidebarRow open={open} icon={<Keyboard size={18} />}   label="Shortcuts"      tip="Shortcuts"       onClick={() => setShowShortcuts(true)} iconAreaWidth={ICON_AREA} />
          <SidebarRow open={open} icon={<HelpCircle size={18} />} label="Help & support" tip="Help & support"   onClick={() => setShowHelp(true)}      iconAreaWidth={ICON_AREA} />
          <SidebarRow open={open} icon={<Settings size={18} />}   label="Settings"       tip="Settings"        onClick={() => setShowSettings(true)}  iconAreaWidth={ICON_AREA} />

          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '4px 12px' }} />

          <button onClick={() => setShowProfile(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 0.15s', borderRadius: '6px', margin: '2px 0' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <div style={{ width: `${ICON_AREA}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
              <Avatar name={userName} size={30} />
            </div>
            <div style={{ textAlign: 'left', opacity: open ? 1 : 0, transition: 'opacity 0.2s ease', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', fontFamily: F }}>{shortName}</p>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', fontFamily: F }}>{userEmail}</p>
            </div>
          </button>
          <div style={{ height: '6px' }} />
        </div>
      </div>
    </>
  )
}

function SidebarRow({ open, icon, label, tip, onClick, iconAreaWidth }: { open: boolean; icon: React.ReactNode; label: string; tip?: string; onClick: () => void; iconAreaWidth: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '8px', margin: '1px 0', padding: 0, transition: 'background-color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
        <div style={{ width: `${iconAreaWidth}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.65)' }}>
          {icon}
        </div>
        <span style={{ fontSize: '14.5px', fontWeight: 400, color: 'rgba(255,255,255,0.85)', fontFamily: F, whiteSpace: 'nowrap', opacity: open ? 1 : 0, transition: 'opacity 0.2s ease', overflow: 'hidden' }}>{label}</span>
      </button>
      {/* Custom tooltip — shows when collapsed and hovered */}
      {!open && hovered && tip && (
        <div style={{ position: 'absolute', left: `${iconAreaWidth + 8}px`, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(15,25,50,0.96)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontFamily: F, padding: '5px 10px', borderRadius: '7px', whiteSpace: 'nowrap', zIndex: 500, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {tip}
        </div>
      )}
    </div>
  )
}

function StableIco({ onClick, tip, children }: { onClick: () => void; tip?: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onClick} title={tip} style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
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