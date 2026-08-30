'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { FolderOpen, Plus, Trash2, Edit2, Check, X, Copy, Users, Link } from 'lucide-react'

const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const API = 'https://web-production-9f493.up.railway.app'

interface Project {
  id: string
  name: string
  owner_id: string
  share_token: string
  link_permission: string
  created_at: string
  updated_at: string
}

interface Props {
  darkMode: boolean
  textPrimary: string
  textMuted: string
  border: string
  bg: string
  onSelectProject: (project: Project) => void
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

export default function ProjectsPage({ darkMode, textPrimary, textMuted, border, bg, onSelectProject }: Props) {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [membersProject, setMembersProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    fetchProjects()
  }, [userId])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch(API + '/projects/user/' + userId)
      const data = await res.json()
      setProjects(data.projects ?? [])
    } catch {}
    setLoading(false)
  }

  async function createProject() {
    if (!newName.trim() || !userId) return
    setCreating(true)
    try {
      const res = await fetch(API + '/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), owner_id: userId })
      })
      const project = await res.json()
      setProjects(prev => [project, ...prev])
      setNewName('')
      setShowModal(false)
    } catch {}
    setCreating(false)
  }

  async function deleteProject(id: string) {
    try {
      await fetch(API + '/projects/' + id + '?owner_id=' + userId, { method: 'DELETE' })
      setProjects(prev => prev.filter(p => p.id !== id))
      setDeleteId(null)
    } catch {}
  }

  async function renameProject(id: string) {
    if (!editingName.trim()) { setEditingId(null); return }
    try {
      await fetch(API + '/projects/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim(), owner_id: userId })
      })
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editingName.trim() } : p))
    } catch {}
    setEditingId(null)
  }

  function copyLink(project: Project) {
    const link = window.location.origin + '/project/' + project.share_token
    navigator.clipboard.writeText(link)
    setCopiedId(project.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function openMembers(project: Project) {
    setMembersProject(project)
    try {
      const res = await fetch(API + '/projects/' + project.id + '/members')
      const data = await res.json()
      setMembers(data.members ?? [])
    } catch {}
  }

  const card = darkMode ? '#161b22' : '#fafafa'
  const cardH = darkMode ? '#1c2128' : '#ffffff'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 40px 60px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 300, color: textPrimary, fontFamily: F, letterSpacing: '-0.01em' }}>Projects</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 300, color: textMuted, fontFamily: F }}>
              {loading ? 'Loading...' : projects.length === 0 ? 'No projects yet' : projects.length + ' project' + (projects.length === 1 ? '' : 's')}
            </p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, background: '#0a1628', border: 'none', color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={15} /> New project
          </button>
        </div>

        {!loading && projects.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', border: '1.5px dashed ' + border, borderRadius: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <FolderOpen size={22} color={textMuted} />
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: textPrimary, fontFamily: F }}>No projects yet</p>
            <p style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 300, color: textMuted, fontFamily: F, maxWidth: 280, lineHeight: 1.6 }}>Create a project to organise your chats and collaborate with others.</p>
            <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, background: '#0a1628', border: 'none', color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <Plus size={14} /> Create your first project
            </button>
          </div>
        )}

        {projects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {projects.map(project => (
              <div key={project.id} onClick={() => onSelectProject(project)} style={{ background: card, border: '1px solid ' + border, borderRadius: 12, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'background 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = cardH}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(23,57,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderOpen size={18} color='#1739E5' />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => copyLink(project)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: copiedId === project.id ? '#10b981' : textMuted, display: 'flex', alignItems: 'center' }} title="Copy share link">
                      {copiedId === project.id ? <Check size={13} /> : <Link size={13} />}
                    </button>
                    <button onClick={() => openMembers(project)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: textMuted, display: 'flex', alignItems: 'center' }} title="View members">
                      <Users size={13} />
                    </button>
                    <button onClick={() => { setEditingId(project.id); setEditingName(project.name); setTimeout(() => inputRef.current?.focus(), 50) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: textMuted, display: 'flex', alignItems: 'center' }} title="Rename">
                      <Edit2 size={13} />
                    </button>
                    {project.owner_id === userId && (
                      <button onClick={() => setDeleteId(project.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: textMuted, display: 'flex', alignItems: 'center' }} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === project.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input ref={inputRef} value={editingName} onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') renameProject(project.id); if (e.key === 'Escape') setEditingId(null) }}
                      style={{ flex: 1, fontSize: 14, fontWeight: 500, fontFamily: F, background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)', border: '1px solid #1739E5', borderRadius: 6, color: textPrimary, padding: '4px 8px', outline: 'none' }} />
                    <button onClick={() => renameProject(project.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 3 }}><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 3 }}><X size={14} /></button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: textPrimary, fontFamily: F }}>{project.name}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontSize: 11, color: textMuted, fontFamily: F }}>{project.owner_id === userId ? 'Owner' : 'Member'}</span>
                  <span style={{ fontSize: 11, color: textMuted, fontFamily: F }}>{timeAgo(project.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: darkMode ? '#161b22' : '#fff', border: '1px solid ' + border, borderRadius: 14, padding: '32px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: F, letterSpacing: '0.04em', textTransform: 'uppercase' }}>New Project</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: textMuted, fontFamily: F }}>Project name</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createProject() }}
                  placeholder="e.g. Gearbox Rev B"
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid ' + border, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8f8f8', color: textPrimary, fontFamily: F, fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: textMuted, fontFamily: F, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={createProject} disabled={!newName.trim() || creating}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: newName.trim() ? '#0a1628' : (darkMode ? '#2a2f35' : '#e0e0e0'), color: newName.trim() ? 'white' : textMuted, fontFamily: F, fontSize: 13, fontWeight: 500, cursor: newName.trim() ? 'pointer' : 'not-allowed' }}>
                  {creating ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div onClick={() => setDeleteId(null)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: darkMode ? '#161b22' : '#fff', border: '1px solid ' + border, borderRadius: 14, padding: '28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: textPrimary, fontFamily: F }}>Delete project?</p>
            <p style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 300, color: textMuted, fontFamily: F, lineHeight: 1.6 }}>This will permanently delete this project. Chats will not be deleted.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: textMuted, fontFamily: F, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deleteProject(deleteId)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {membersProject && (
        <div onClick={() => setMembersProject(null)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: darkMode ? '#161b22' : '#fff', border: '1px solid ' + border, borderRadius: 14, padding: '28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: F, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Members</h3>
              <button onClick={() => setMembersProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8f8f8' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: F }}>{m.user?.name ?? 'Unknown'}</p>
                    <p style={{ margin: 0, fontSize: 11, color: textMuted, fontFamily: F }}>{m.user?.email ?? ''}</p>
                  </div>
                  <span style={{ fontSize: 11, color: textMuted, fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.permission}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px', borderRadius: 8, background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: textMuted, fontFamily: F }}>Share link ({membersProject.link_permission})</span>
              <button onClick={() => copyLink(membersProject)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0a1628', border: 'none', borderRadius: 6, padding: '6px 12px', color: 'white', fontSize: 12, fontFamily: F, cursor: 'pointer' }}>
                {copiedId === membersProject.id ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy link</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
