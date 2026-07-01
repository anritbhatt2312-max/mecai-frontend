// app/auth/page.tsx — Auth page, served at /auth
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'

const F = "'DM Sans', system-ui, sans-serif"

function Nav() {
  const router = useRouter()
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: 60,
      background: 'rgba(2,25,92,0.9)', backdropFilter: 'blur(16px)',
      borderBottom: '0.5px solid rgba(204,222,255,0.1)',
    }}>
      <span onClick={() => router.push('/')} style={{
        fontFamily: F, fontSize: 20, lineHeight: 1,
        letterSpacing: '-0.04em', userSelect: 'none', cursor: 'pointer',
      }}>
        <span style={{ fontWeight: 300, color: '#ffffff' }}>Mec</span>
        <span style={{ fontWeight: 300, background: 'linear-gradient(135deg, #5b7fff, #CCDEFF, #5b7fff)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s ease infinite' }}>AI</span>
      </span>
      <span style={{ fontSize: 13, color: 'rgba(204,222,255,0.45)', fontFamily: F }}>
        by Atherion
      </span>
    </nav>
  )
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function AuthContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [tab, setTab] = useState<'signup' | 'login'>('signup')

  useEffect(() => {
    const t = params.get('tab')
    if (t === 'login' || t === 'signup') setTab(t)
  }, [params])

  function socialAuth(provider: 'google') {
    if (provider === 'google') {
      signIn('google', { callbackUrl: '/chat' })
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #02195C; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .social-btn { transition: opacity 0.15s, transform 0.1s; }
        .social-btn:hover { opacity: 0.88 !important; transform: translateY(-1px); }
        .tab-btn { transition: background 0.15s, color 0.15s; }
        .panel { animation: fadeUp 0.4s cubic-bezier(.22,.68,0,1.2) both; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#02195C' }} />
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 30%, rgba(23,57,229,0.5) 0%, transparent 65%)' }} />
      <div style={{ position: 'fixed', bottom: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse, rgba(2,25,92,0.8) 0%, transparent 70%)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(204,222,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(204,222,255,0.04) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
      }} />

      <Nav />

      <main style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '80px 24px 60px',
      }}>
        <div className="panel" style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(2,15,70,0.85)',
          border: '0.5px solid rgba(204,222,255,0.12)',
          borderRadius: 16, padding: '40px 36px',
          backdropFilter: 'blur(12px)',
        }}>

          <button onClick={() => router.push('/')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none',
            border: 'none', cursor: 'pointer', marginBottom: 28, fontFamily: F,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to home
          </button>

          <div style={{ textAlign: 'center', marginBottom: 4, fontFamily: F, fontSize: 32, lineHeight: 1, letterSpacing: '-0.04em' }}>
            <span style={{ fontWeight: 300, color: '#ffffff' }}>Mec</span>
            <span style={{ fontWeight: 300, background: 'linear-gradient(135deg, #5b7fff, #CCDEFF, #5b7fff)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s ease infinite' }}>AI</span>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(204,222,255,0.45)', marginBottom: 36, fontFamily: F }}>
            {tab === 'signup' ? 'Create your account' : 'Welcome back'}
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
            background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 4, marginBottom: 24,
          }}>
            {(['signup', 'login'] as const).map(t => (
              <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
                padding: 8, border: 'none', borderRadius: 6,
                background: tab === t ? 'rgba(255,255,255,0.11)' : 'transparent',
                color: tab === t ? 'rgba(255,255,255,0.93)' : 'rgba(255,255,255,0.40)',
                fontFamily: F, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                {t === 'signup' ? 'Sign up' : 'Sign in'}
              </button>
            ))}
          </div>

          <button className="social-btn" onClick={() => socialAuth('google')} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '14px 20px', borderRadius: 8, border: 'none',
            background: '#fff', color: '#1f2937', fontFamily: F, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', marginBottom: 28,
          }}>
            <GoogleIcon /> Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.22)', lineHeight: 1.65, fontFamily: F }}>
            By continuing you agree to our{' '}
            <a href="/terms" style={{ color: 'rgba(100,160,255,0.7)', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: 'rgba(100,160,255,0.7)', textDecoration: 'underline' }}>Privacy Policy</a>.<br/>
            Beta access — no credit card required.
          </p>
        </div>
      </main>
    </>
  )
}

export default function AuthPage() {
  return <Suspense><AuthContent /></Suspense>
}