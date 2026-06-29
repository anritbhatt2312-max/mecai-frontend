// app/page.tsx — Landing page, matched exactly to atherion.co/mecai source
'use client'
import { useRouter } from 'next/navigation'

const F = "'Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif"
const DARK_BLUE = '#02195C'
const ELECTRIC  = '#1739E5'
const MOON      = '#CCDEFF'
const GRAY      = 'rgba(204,222,255,0.45)'
const BORDER    = 'rgba(204,222,255,0.1)'

const features = [
  {
    label: 'Generate',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    title: 'Describe. Generate.',
    desc: 'Type what you need — spur gear, bearing, shaft. MecAI generates it instantly.',
  },
  {
    label: 'Design',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>
      </svg>
    ),
    title: '2D → 3D Workflow.',
    desc: 'Every model starts as a technical drawing, then becomes a fully rotatable 3D part.',
  },
  {
    label: 'Engineer',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    title: 'Real Calculations.',
    desc: 'Von Mises stress, torque analysis, material comparison — verified engineering math.',
  },
]

export default function LandingPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Neue+Montreal:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: ${DARK_BLUE}; color: #fff; font-family: ${F}; -webkit-font-smoothing: antialiased; }

        /* exact shimmer from source */
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        .hero-content { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.2) both; }
        .ai-text {
          background: linear-gradient(135deg, ${ELECTRIC}, ${MOON}, ${ELECTRIC});
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s ease infinite;
        }
        .pulse-dot { width:6px; height:6px; border-radius:50%; background:${MOON}; display:inline-block; animation:pulse 2s ease infinite; }
        .feat-card { transition: background 0.25s, border-color 0.25s, transform 0.2s; }
        .feat-card:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(204,222,255,0.25) !important; transform: translateY(-2px); }
        .btn-primary { transition: background 0.2s, transform 0.15s; }
        .btn-primary:hover { background: #e0ecff !important; transform: translateY(-1px); }
        .btn-secondary { transition: background 0.2s, border-color 0.2s; }
        .btn-secondary:hover { background: rgba(204,222,255,0.08) !important; border-color: rgba(204,222,255,0.3) !important; }
      `}</style>

      {/* ── Background — exact from source ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: DARK_BLUE }} />
      {/* hero glow */}
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 30%, rgba(23,57,229,0.5) 0%, transparent 65%)' }} />
      {/* bottom glow */}
      <div style={{ position: 'fixed', bottom: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse, rgba(2,25,92,0.8) 0%, transparent 70%)' }} />
      {/* grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(204,222,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(204,222,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
      }} />

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 60,
        background: 'rgba(2,25,92,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: `0.5px solid ${BORDER}`,
      }}>
        {/* Wordmark — same style as hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: F, fontSize: 22, fontWeight: 300, lineHeight: 1, letterSpacing: '-0.04em' }}>
            <span style={{ color: '#ffffff' }}>Mec</span>
            <span className="ai-text">AI</span>
          </span>
          <span style={{ fontSize: 13, color: GRAY, fontFamily: F }}>by Atherion</span>
        </div>
        {/* Get started */}
        <button onClick={() => router.push('/auth?tab=signup')} style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: DARK_BLUE, background: MOON, border: 'none', borderRadius: 4, padding: '8px 18px', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background='#e0ecff')}
          onMouseLeave={e => (e.currentTarget.style.background=MOON)}>
          Get started
        </button>
      </nav>

      {/* ── Hero — exact from source ── */}
      <section className="hero-content" style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        minHeight: '100vh', padding: '60px 24px 40px',
        boxSizing: 'border-box',
      }}>
        {/* h1 — exact from source: weight 300, -0.04em, shimmer AI */}
        <h1 style={{ fontFamily: F, fontSize: 'clamp(56px, 8vw, 108px)', fontWeight: 300, lineHeight: 0.92, letterSpacing: '-0.04em', marginBottom: 10, position: 'relative', zIndex: 1 }}>
          <span style={{ color: '#ffffff' }}>Mec</span>
          <span className="ai-text">AI</span>
        </h1>

        {/* Tagline */}
        <p style={{ fontSize: 14, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: MOON, opacity: 0.5, fontFamily: F, marginBottom: 20 }}>
          Generate · Design · Engineer
        </p>

        {/* Sub */}
        <p style={{ maxWidth: 480, fontSize: 16, lineHeight: 1.75, color: GRAY, marginBottom: 44, fontFamily: F, fontWeight: 300 }}>
          The first AI built specifically for mechanical engineering component generation. Describe what you need — MecAI generates it.
        </p>

        {/* Actions — exact from source */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60 }}>
          <button className="btn-primary" onClick={() => router.push('/auth?tab=signup')} style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: DARK_BLUE, background: MOON, border: 'none', borderRadius: 4, padding: '13px 28px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Start Generating →
          </button>
        </div>

        {/* Feature cards */}
        <div style={{ width: '100%', maxWidth: 1000, boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {features.map(f => (
              <div key={f.label} className="feat-card" style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: MOON, opacity: 0.55, marginBottom: 14, fontFamily: F }}>{f.label}</div>
                <div style={{ opacity: 0.45, marginBottom: 12, color: '#fff' }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.90)', marginBottom: 8, lineHeight: 1.3, fontFamily: F }}>{f.title}</div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: GRAY, fontFamily: F, fontWeight: 300, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}