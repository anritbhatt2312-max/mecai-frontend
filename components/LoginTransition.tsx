// components/LoginTransition.tsx
'use client'

import { useEffect, useState } from 'react'

const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"

interface Props {
  userName: string
  onComplete: () => void
}

export default function LoginTransition({ userName, onComplete }: Props) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')
  const [isFirstTime, setIsFirstTime] = useState(false)
  const firstName = userName.split(' ')[0]

  useEffect(() => {
    // Check if this user has visited before
    const key = `mecai_visited_${userName}`
    const hasVisited = localStorage.getItem(key)
    if (!hasVisited) {
      setIsFirstTime(true)
      localStorage.setItem(key, 'true')
    }
  }, [userName])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 700)
    const t2 = setTimeout(() => setPhase('exit'), 2800)
    const t3 = setTimeout(() => onComplete(), 3300)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  const greeting = isFirstTime
    ? <>Welcome, <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>{firstName}</span>.</>
    : <>Good to see you again, <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>{firstName}</span>.</>

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `
        radial-gradient(ellipse 70% 55% at 50% 25%, rgba(100,160,255,0.50) 0%, rgba(40,100,240,0.20) 50%, transparent 72%),
        linear-gradient(180deg, #1030c8 0%, #0d28b8 25%, #0a20a8 55%, #081898 100%)
      `,
      opacity: phase === 'exit' ? 0 : 1,
      transition: phase === 'exit' ? 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)' : 'none',
      pointerEvents: phase === 'exit' ? 'none' : 'all',
    }}>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, black 0%, transparent 100%)',
      }} />

      {/* Logo */}
      <div style={{
        fontFamily: F,
        fontSize: 'clamp(56px, 10vw, 96px)',
        lineHeight: 1, letterSpacing: '-0.04em',
        opacity: phase === 'enter' ? 0 : 1,
        transform: phase === 'enter' ? 'translateY(16px) scale(0.96)' : 'translateY(0) scale(1)',
        transition: 'opacity 0.6s cubic-bezier(0.22,0.68,0,1.2), transform 0.6s cubic-bezier(0.22,0.68,0,1.2)',
        marginBottom: 28,
        position: 'relative',
      }}>
        {/* Mec — white */}
        <span style={{ fontWeight: 300, color: '#ffffff' }}>Mec</span>

        {/* AI — shimmering gradient, same as teaser */}
        <span style={{
          fontWeight: 300,
          background: 'linear-gradient(135deg, #1739E5, #CCDEFF, #1739E5)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'shimmer 4s ease infinite',
        }}>AI</span>
      </div>

      {/* Greeting */}
      <div style={{
        opacity: phase === 'hold' ? 1 : 0,
        transform: phase === 'hold' ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
        textAlign: 'center',
      }}>
        <p style={{
          margin: 0,
          fontFamily: F, fontSize: 18, fontWeight: 300,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.01em',
        }}>
          {greeting}
        </p>
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '2px', background: 'rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, rgba(160,200,255,0.5), rgba(255,255,255,0.95), rgba(160,200,255,0.5))',
          width: phase === 'enter' ? '0%' : phase === 'hold' ? '70%' : '100%',
          transition: phase === 'enter'
            ? 'width 0.6s cubic-bezier(0.4,0,0.2,1)'
            : phase === 'hold'
            ? 'width 2.0s cubic-bezier(0.4,0,0.2,1)'
            : 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <style>{`@keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }`}</style>
    </div>
  )
}