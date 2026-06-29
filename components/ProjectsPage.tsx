// components/ProjectsPage.tsx — drop this in components/
'use client'

import { useState, useEffect, useRef } from 'react'
import { FolderOpen, Plus, Trash2, Edit2, Check, X } from 'lucide-react'

const F = "'DM Sans', 'Inter', system-ui, sans-serif"

interface Project {
  id: string
  name: string
  description: string
  componentCount: number
  createdAt: string
  updatedAt: string
  color: string
}

const COLORS = [
  'rgba(37,99,235,0.15)',
  'rgba(124,58,237,0.15)',
  'rgba(5,150,105,0.15)',
  'rgba(220,38,38,0.15)',
  'rgba(217,119,6,0.15)',
  'rgba(14,116,144,0.15)',
]

const COLOR_ACCENTS: Record<string, string> = {
  'rgba(37,99,235,0.15)':  '#3b82f6',
  'rgba(124,58,237,0.15)': '#8b5cf6',
  'rgba(5,150,105,0.15)':  '#10b981',
  'rgba(220,38,38,0.15)':  '#ef4444',
  'rgba(217,119,6,0.15)':  '#f59e0b',
  'rgba(14,116,144,0.15)': '#06b6d4',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  darkMode: boolean
  textPrimary: string
  textMuted: string
  border: string
  bg: string
}

export default function ProjectsPage({ darkMode, textPrimary, textMuted, border, bg }: Props) {
  const [projects, setProjects]       = useState<Project[]>([])
  const [showModal, setShowModal]     = useState(false)
  const [newName, setNewName]         = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [newColor, setNewColor]       = useState(COLORS[0])
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [mounted, setMounted]         = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('mecai_projects')
      if (saved) setProjects(JSON.parse(saved))
    } catch {}
  }, [])

  function save(updated: Project[]) {
    setProjects(updated)
    localStorage.setItem('mecai_projects', JSON.stringify(updated))
  }

  function createProject() {
    if (!newName.trim()) return
    const now = new Date().toISOString()
    const project: Project = {
      id: `proj_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'No description',
      componentCount: 0,
      createdAt: now,
      updatedAt: now,
      color: newColor,
    }
    save([project, ...projects])
    setNewName(''); setNewDesc(''); setNewColor(COLORS[0]); setShowModal(false)
  }

  function deleteProject(id: string) {
    save(projects.filter(p => p.id !== id))
    setDeleteId(null)
  }

  function startRename(p: Project) {
    setEditingId(p.id)
    setEditingName(p.name)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function commitRename(id: string) {
    if (!editingName.trim()) { setEditingId(null); return }
    save(projects.map(p => p.id === id
      ? { ...p, name: editingName.trim(), updatedAt: new Date().toISOString() }
      : p
    ))
    setEditingId(null)
  }

  const card = darkMode ? '#161b22' : '#fafafa'
  const cardH = darkMode ? '#1c2128' : '#ffffff'

  if (!mounted) return null

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 40px 60px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 300, color: textPrimary, fontFamily: F, letterSpacing: '-0.01em' }}>
              Projects
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 300, color: textMuted, fontFamily: F }}>
              {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 8,
              background: '#0a1628', border: 'none',
              color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={15} /> New project
          </button>
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
            border: `1.5px dashed ${border}`, borderRadius: 12,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: darkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <FolderOpen size={22} color={textMuted} />
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: textPrimary, fontFamily: F }}>
              No projects yet
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 300, color: textMuted, fontFamily: F, maxWidth: 280, lineHeight: 1.6 }}>
              Create a project to organise your components and chats in one place.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 8,
                background: '#0a1628', border: 'none',
                color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Create your first project
            </button>
          </div>
        )}

        {/* Project grid */}
        {projects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {projects.map(project => {
              const accent = COLOR_ACCENTS[project.color] ?? '#3b82f6'
              return (
                <div
                  key={project.id}
                  style={{
                    background: card, border: `1px solid ${border}`,
                    borderRadius: 12, padding: '20px 20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    transition: 'background 0.15s, border-color 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = cardH; (e.currentTarget as HTMLDivElement).style.borderColor = darkMode ? '#444' : '#ccc' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = card; (e.currentTarget as HTMLDivElement).style.borderColor = border }}
                >
                  {/* Folder icon with project color */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 9,
                      background: project.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FolderOpen size={18} color={accent} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => startRename(project)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: textMuted, display: 'flex', alignItems: 'center', transition: 'color 0.15s, background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = textPrimary; e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = textMuted; e.currentTarget.style.background = 'transparent' }}
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(project.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: textMuted, display: 'flex', alignItems: 'center', transition: 'color 0.15s, background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = textMuted; e.currentTarget.style.background = 'transparent' }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Name — editable inline */}
                  {editingId === project.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        ref={inputRef}
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(project.id); if (e.key === 'Escape') setEditingId(null) }}
                        style={{
                          flex: 1, fontSize: 14, fontWeight: 500, fontFamily: F,
                          background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                          border: `1px solid ${accent}`, borderRadius: 6,
                          color: textPrimary, padding: '4px 8px', outline: 'none',
                        }}
                      />
                      <button onClick={() => commitRename(project.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 3 }}><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 3 }}><X size={14} /></button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: textPrimary, fontFamily: F, letterSpacing: '0.01em' }}>{project.name}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 300, color: textMuted, fontFamily: F, lineHeight: 1.5 }}>{project.description}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 400, color: textMuted, fontFamily: F }}>
                      {project.componentCount} component{project.componentCount !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 300, color: textMuted, fontFamily: F }} title={formatDate(project.updatedAt)}>
                      {timeAgo(project.updatedAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create project modal ── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, background: darkMode ? '#161b22' : '#fff', border: `1px solid ${border}`, borderRadius: 14, padding: '32px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
          >
            <h3 style={{ margin: '0 0 24px', fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: F, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              New Project
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: textMuted, fontFamily: F }}>Project name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createProject() }}
                  placeholder="e.g. Gearbox Rev B"
                  style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8f8f8', color: textPrimary, fontFamily: F, fontSize: 14, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: textMuted, fontFamily: F }}>Description <span style={{ color: textMuted, fontWeight: 300 }}>(optional)</span></label>
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is this project about?"
                  style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8f8f8', color: textPrimary, fontFamily: F, fontSize: 14, outline: 'none' }}
                />
              </div>

              {/* Color picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: textMuted, fontFamily: F }}>Colour</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(c => {
                    const accent = COLOR_ACCENTS[c]
                    return (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: newColor === c ? `2px solid ${accent}` : '2px solid transparent',
                          background: c, cursor: 'pointer', transition: 'border-color 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {newColor === c && <Check size={12} color={accent} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontFamily: F, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newName.trim()}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: newName.trim() ? '#0a1628' : (darkMode ? '#2a2f35' : '#e0e0e0'), color: newName.trim() ? 'white' : textMuted, fontFamily: F, fontSize: 13, fontWeight: 500, cursor: newName.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
                >
                  Create project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteId && (
        <div
          onClick={() => setDeleteId(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 360, background: darkMode ? '#161b22' : '#fff', border: `1px solid ${border}`, borderRadius: 14, padding: '28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Trash2 size={18} color="#ef4444" />
            </div>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: textPrimary, fontFamily: F }}>
              Delete project?
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 300, color: textMuted, fontFamily: F, lineHeight: 1.6 }}>
              This will permanently delete &ldquo;{projects.find(p => p.id === deleteId)?.name}&rdquo;. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontFamily: F, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => deleteProject(deleteId)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}