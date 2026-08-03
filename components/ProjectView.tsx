'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, MessageSquare, FolderOpen } from 'lucide-react'

const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const API = 'https://web-production-9f493.up.railway.app'

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface Project {
  id: string
  name: string
  owner_id: string
  share_token: string
  link_permission: string
}

interface Props {
  project: Project
  darkMode: boolean
  textPrimary: string
  textMuted: string
  border: string
  bg: string
  onBack: () => void
  onSelectChat: (conversationId: string) => void
  onNewChat: (projectId: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  if (hours < 24) return hours + 'h ago'
  return days + 'd ago'
}

export default function ProjectView({ project, darkMode, textPrimary, textMuted, border, bg, onBack, onSelectChat, onNewChat }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [project.id])

  async function fetchConversations() {
    setLoading(true)
    try {
      const res = await fetch(API + '/projects/' + project.id + '/conversations')
      const data = await res.json()
      setConversations(data.conversations ?? [])
    } catch {}
    setLoading(false)
  }

  const card = darkMode ? '#161b22' : '#fafafa'
  const cardH = darkMode ? '#1c2128' : '#ffffff'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 40px 60px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontFamily: F, fontSize: 13, padding: '6px 0' }}>
            <ArrowLeft size={15} /> Projects
          </button>
          <span style={{ color: textMuted }}>›</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={16} color='#1739E5' />
            <span style={{ fontSize: 15, fontWeight: 500, color: textPrimary, fontFamily: F }}>{project.name}</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => onNewChat(project.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, background: '#0a1628', border: 'none', color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <Plus size={15} /> New chat
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid ' + border, borderTopColor: '#63b3ed', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', border: '1.5px dashed ' + border, borderRadius: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MessageSquare size={22} color={textMuted} />
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: textPrimary, fontFamily: F }}>No chats yet</p>
            <p style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 300, color: textMuted, fontFamily: F, maxWidth: 280, lineHeight: 1.6 }}>Start a new chat in this project to get going.</p>
            <button onClick={() => onNewChat(project.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, background: '#0a1628', border: 'none', color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <Plus size={14} /> Start first chat
            </button>
          </div>
        )}

        {conversations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conversations.map(c => (
              <div key={c.id} onClick={() => onSelectChat(c.id)}
                style={{ background: card, border: '1px solid ' + border, borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = cardH}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MessageSquare size={15} color={textMuted} />
                  <span style={{ fontSize: 14, fontWeight: 400, color: textPrimary, fontFamily: F }}>{c.title ?? 'Untitled chat'}</span>
                </div>
                <span style={{ fontSize: 12, color: textMuted, fontFamily: F }}>{timeAgo(c.updated_at)}</span>
              </div>
            ))}
          </div>
        )}

        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </div>
    </div>
  )
}
