'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'

const API = 'https://web-production-9f493.up.railway.app'
const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"

export default function JoinProjectPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const token = params.token as string
  const router = useRouter()
  const [state, setState] = useState('loading')
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/auth?tab=login'); return }
    if (status !== 'authenticated' || !session?.user?.id) return
    const userId = session.user.id
    async function join() {
      try {
        const res = await fetch(API + '/projects/join/' + token)
        if (!res.ok) { setError('Project not found or link is invalid.'); setState('error'); return }
        const proj = await res.json()
        setProjectName(proj.name)
        setState('joining')
        const joinRes = await fetch(API + '/projects/join/' + token + '?user_id=' + userId, { method: 'POST' })
        if (!joinRes.ok) { setError('Failed to join project.'); setState('error'); return }
        setState('success')
        setTimeout(() => router.replace('/chat'), 2000)
      } catch { setError('Something went wrong.'); setState('error') }
    }
    join()
  }, [status, session, token, router])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1030c8 0%, #0a20a8 55%, #081898 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '40px 36px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {(state === 'loading' || state === 'joining') && (
          <>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: 'white', fontFamily: F, fontSize: 15 }}>{state === 'joining' ? 'Joining ' + projectName + '...' : 'Loading project...'}</p>
          </>
        )}
        {state === 'success' && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: 'white' }}>✓</div>
            <p style={{ color: 'white', fontFamily: F, fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Joined {projectName}!</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: F, fontSize: 14 }}>Redirecting...</p>
          </>
        )}
        {state === 'error' && (
          <>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24, color: 'white' }}>✕</div>
            <p style={{ color: 'white', fontFamily: F, fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Failed to join</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: F, fontSize: 14, marginBottom: 24 }}>{error}</p>
            <button onClick={() => router.replace('/chat')} style={{ padding: '10px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontFamily: F, fontSize: 14, cursor: 'pointer' }}>Go to MecAI</button>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}