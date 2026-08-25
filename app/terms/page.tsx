// app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — MecAI",
  description: "Terms governing your use of MecAI by Atherion Private Limited.",
};

const F = "'DM Sans', system-ui, sans-serif";

export default function TermsPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #02195C; }
        @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .legal-panel { animation: fadeUp 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        .legal-section h2 {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(204,222,255,0.4);
          margin: 0 0 0.75rem; font-family: ${F};
        }
        .legal-section p {
          font-size: 14px; line-height: 1.75; color: rgba(204,222,255,0.65);
          margin: 0 0 0.75rem; font-family: ${F};
        }
        .legal-section ul { margin: 0.25rem 0 0.75rem 1.1rem; padding: 0; }
        .legal-section ul li {
          font-size: 14px; line-height: 1.75; color: rgba(204,222,255,0.65);
          margin-bottom: 0.3rem; font-family: ${F};
        }
        .legal-section ul li strong { color: rgba(204,222,255,0.88); font-weight: 500; }
        .legal-section a { color: rgba(100,160,255,0.9); text-decoration: underline; text-underline-offset: 3px; }
        .legal-section a:hover { color: #fff; }
        .legal-divider { border: none; border-top: 0.5px solid rgba(204,222,255,0.08); margin: 1.75rem 0; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#02195C' }} />
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 30%, rgba(23,57,229,0.5) 0%, transparent 65%)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(204,222,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(204,222,255,0.04) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
      } as React.CSSProperties} />

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 60,
        background: 'rgba(2,25,92,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '0.5px solid rgba(204,222,255,0.1)',
      }}>
        <a href="/" style={{ textDecoration: 'none', fontFamily: F, fontSize: 20, letterSpacing: '-0.04em' }}>
          <span style={{ fontWeight: 300, color: '#fff' }}>Mec</span>
          <span style={{ fontWeight: 300, background: 'linear-gradient(135deg, #5b7fff, #CCDEFF, #5b7fff)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s ease infinite' }}>AI</span>
        </a>
        <span style={{ fontSize: 13, color: 'rgba(204,222,255,0.45)', fontFamily: F }}>by Atherion</span>
      </nav>

      <main style={{
        position: 'relative', zIndex: 1,
        display: 'flex', justifyContent: 'center',
        minHeight: '100vh', padding: '100px 24px 80px',
      }}>
        <div className="legal-panel" style={{
          width: '100%', maxWidth: 680,
          background: 'rgba(2,15,70,0.85)',
          border: '0.5px solid rgba(204,222,255,0.12)',
          borderRadius: 16, padding: '48px 48px 52px',
          backdropFilter: 'blur(12px)',
          height: 'fit-content',
        }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(204,222,255,0.35)', marginBottom: '0.75rem', fontFamily: F }}>Legal</p>
          <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: '#fff', marginBottom: '0.5rem', lineHeight: 1.15 }}>Terms of Use</h1>
          <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(204,222,255,0.35)', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '0.5px solid rgba(204,222,255,0.08)' }}>
            Atherion Private Limited &nbsp;·&nbsp; Last updated: June 2026
          </p>

          <div className="legal-section">
            <h2>01 — Acceptance</h2>
            <p>By creating an account or using MecAI ("the App"), you agree to these Terms of Use. If you do not agree, do not use the App. These Terms form a binding agreement between you and Atherion Private Limited ("Atherion", "we", "us").</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>02 — Who Can Use MecAI</h2>
            <p>You must be at least 18 years old to use MecAI. By using the App, you confirm you meet this requirement. MecAI is currently in beta and available by invitation or waitlist only.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>03 — Your Account</h2>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>Notify us immediately at <a href="mailto:info@atherion.co">info@atherion.co</a> if you suspect unauthorised access</li>
              <li>You may not share, transfer, or sell access to your account</li>
            </ul>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>04 — Permitted Use</h2>
            <p>MecAI is provided for lawful engineering, design, and manufacturing purposes. You agree not to:</p>
            <ul>
              <li>Use the App to generate content for illegal, harmful, or weapons-related purposes</li>
              <li>Attempt to reverse-engineer, scrape, or extract the underlying models or systems</li>
              <li>Use automated means to access the App beyond normal use</li>
              <li>Resell or sublicense access to MecAI without written permission from Atherion</li>
              <li>Upload prompts containing confidential third-party information without authorisation</li>
            </ul>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>05 — Your Content & Outputs</h2>
            <p>You retain ownership of the prompts you submit and the CAD files (STEP, STL, DXF) generated from them, subject to these Terms.</p>
            <p>By submitting prompts, you grant Atherion a limited licence to process them for the purpose of delivering the service and improving MecAI. We will not sell your prompts or outputs to third parties.</p>
            <p>You are responsible for verifying that generated CAD files are accurate and suitable for your intended use. Outputs must be reviewed by a qualified engineer before use in production or safety-critical applications.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>06 — Intellectual Property</h2>
            <p>All rights in MecAI — including the platform, interface, AI models, CAD generation logic, and brand — are owned by Atherion Private Limited. Nothing in these Terms transfers any such rights to you.</p>
            <p>"MecAI" and "Atherion" are trademarks of Atherion Private Limited. You may not use them without prior written consent.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>07 — Beta Disclaimer</h2>
            <p>MecAI is currently in beta and provided <strong style={{ color: 'rgba(204,222,255,0.88)', fontWeight: 500 }}>as-is</strong>, without warranties of any kind — express or implied — including fitness for a particular purpose or uninterrupted availability. Features may change or behave unexpectedly during the beta period.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>08 — Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Atherion shall not be liable for any indirect, incidental, or consequential damages arising from your use of MecAI — including losses from reliance on generated CAD outputs. Our total liability shall not exceed the amount you paid us in the 3 months preceding the claim (or ₹0 during free beta access).</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>09 — Termination</h2>
            <p>We may suspend or terminate your access if you breach these Terms or misuse the App. You may delete your account at any time. On termination, your right to use MecAI ceases immediately.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>10 — Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Maharashtra, India.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>11 — Changes to These Terms</h2>
            <p>We may update these Terms as MecAI evolves. The "Last updated" date above reflects any changes. Continued use of MecAI after changes constitutes acceptance of the updated Terms.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>12 — Contact</h2>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:info@atherion.co">info@atherion.co</a></li>
              <li><strong>Company:</strong> Atherion Private Limited, Thane, Maharashtra, India</li>
            </ul>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)', marginTop: '2.5rem', paddingTop: '1.75rem', borderTop: '0.5px solid rgba(204,222,255,0.08)', fontFamily: F }}>
            © 2026 Atherion Private Limited. All rights reserved.
          </p>
        </div>
      </main>
    </>
  );
}