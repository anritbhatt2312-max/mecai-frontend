// app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — MecAI",
  description: "How MecAI by Atherion Private Limited collects, uses, and protects your personal data.",
};

const F = "'DM Sans', system-ui, sans-serif";

export default function PrivacyPolicyPage() {
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
        .legal-section ul {
          margin: 0.25rem 0 0.75rem 1.1rem; padding: 0;
        }
        .legal-section ul li {
          font-size: 14px; line-height: 1.75; color: rgba(204,222,255,0.65);
          margin-bottom: 0.3rem; font-family: ${F};
        }
        .legal-section ul li strong { color: rgba(204,222,255,0.88); font-weight: 500; }
        .legal-section a { color: rgba(100,160,255,0.9); text-decoration: underline; text-underline-offset: 3px; }
        .legal-section a:hover { color: #fff; }
        .legal-divider { border: none; border-top: 0.5px solid rgba(204,222,255,0.08); margin: 1.75rem 0; }
      `}</style>

      {/* Background — matches auth page exactly */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: '#02195C' }} />
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 30%, rgba(23,57,229,0.5) 0%, transparent 65%)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(204,222,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(204,222,255,0.04) 1px,transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
      } as React.CSSProperties} />

      {/* Nav */}
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
          {/* Header */}
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(204,222,255,0.35)', marginBottom: '0.75rem', fontFamily: F }}>Legal</p>
          <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: '#fff', marginBottom: '0.5rem', lineHeight: 1.15 }}>Privacy Policy</h1>
          <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(204,222,255,0.35)', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '0.5px solid rgba(204,222,255,0.08)' }}>
            Atherion Private Limited &nbsp;·&nbsp; Last updated: June 2026
          </p>

          <div className="legal-section">
            <h2>01 — Who We Are</h2>
            <p>MecAI is a product of Atherion Private Limited ("Atherion", "we", "us", or "our"), an AI-native engineering platform company incorporated in India. This policy explains how we collect, use, store, and protect your personal data when you use the MecAI application.</p>
            <p>This policy is governed by India's Digital Personal Data Protection Act, 2023 (DPDP Act). For queries, contact <a href="mailto:privacy@atherion.co">privacy@atherion.co</a>.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>02 — Data We Collect</h2>
            <ul>
              <li><strong>Account data</strong> — name, email address, and password (hashed) on registration</li>
              <li><strong>Usage data</strong> — prompts submitted, CAD files generated, session activity, and feature interactions</li>
              <li><strong>Device & technical data</strong> — IP address, browser type, OS, and referring URL</li>
              <li><strong>Analytics data</strong> — aggregated, anonymised behavioural patterns</li>
              <li><strong>Communications</strong> — messages sent to us via email or in-app support</li>
            </ul>
            <p>We do not collect payment data directly. Any future payment processing will be handled by a certified third-party provider.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>03 — Why We Collect It</h2>
            <ul>
              <li><strong>Service delivery</strong> — to run MecAI and generate CAD outputs from your prompts</li>
              <li><strong>Account management</strong> — to authenticate you and manage your profile</li>
              <li><strong>Product improvement</strong> — to understand usage and improve accuracy and features</li>
              <li><strong>Communication</strong> — service notifications and, where opted in, product updates</li>
              <li><strong>Security & compliance</strong> — to detect abuse, prevent fraud, and meet legal obligations</li>
            </ul>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>04 — Legal Basis for Processing</h2>
            <p>Under the DPDP Act 2023, we process your personal data on the basis of your <strong style={{ color: 'rgba(204,222,255,0.88)', fontWeight: 500 }}>free, specific, informed, and unambiguous consent</strong>, given at the time of registration. You may withdraw consent at any time by contacting us, which may limit your ability to use the App.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>05 — Third-Party Processors</h2>
            <ul>
              <li><strong>Cloud infrastructure</strong> — database and server hosting (Supabase, AWS)</li>
              <li><strong>AI model providers</strong> — natural language prompt processing (Anthropic Claude API)</li>
              <li><strong>Analytics</strong> — aggregated usage tracking (Vercel Analytics, PostHog)</li>
              <li><strong>Email delivery</strong> — transactional and product emails</li>
            </ul>
            <p>All processors are contractually required to protect your data and use it only as instructed by us.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>06 — Cookies</h2>
            <ul>
              <li><strong>Essential cookies</strong> — required for authentication and core functionality; cannot be disabled</li>
              <li><strong>Analytics cookies</strong> — help us understand how the App is used; you can decline via the cookie banner</li>
            </ul>
            <p>We do not use advertising, retargeting, or cross-site tracking cookies.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>07 — Data Retention</h2>
            <p>We retain account and usage data for as long as your account is active. If you delete your account, personal data is removed within 30 days except where retention is required by law. Anonymised analytics data may be retained indefinitely.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>08 — Your Rights</h2>
            <ul>
              <li><strong>Access</strong> — request a summary of the personal data we hold about you</li>
              <li><strong>Correction</strong> — ask us to correct inaccurate or incomplete data</li>
              <li><strong>Erasure</strong> — request deletion of your personal data</li>
              <li><strong>Withdraw consent</strong> — opt out of marketing at any time</li>
              <li><strong>Nominate</strong> — designate another person to exercise these rights on your behalf</li>
              <li><strong>Grievance redressal</strong> — raise a complaint with our Grievance Officer</li>
            </ul>
            <p>Email <a href="mailto:privacy@atherion.co">privacy@atherion.co</a> to exercise any right. We respond within 30 days.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>09 — Data Security</h2>
            <p>We implement encryption in transit (TLS) and at rest, access controls, and regular security reviews. No internet transmission is completely secure and we cannot guarantee absolute security.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>10 — International Transfers</h2>
            <p>Some service providers (including Anthropic and cloud infrastructure) may process data outside India. We ensure appropriate safeguards consistent with the DPDP Act 2023 are in place where this occurs.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>11 — Children's Privacy</h2>
            <p>MecAI is an engineering tool for professionals and adults. We do not knowingly collect personal data from anyone under 18. If you believe we have inadvertently collected data from a minor, contact us immediately and we will delete it.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>12 — Grievance Officer</h2>
            <ul>
              <li><strong>Name:</strong> Anrit Bhatt</li>
              <li><strong>Designation:</strong> Founder & CEO, Atherion Private Limited</li>
              <li><strong>Email:</strong> <a href="mailto:info@atherion.co">info@atherion.co</a></li>
              <li><strong>Address:</strong> Thane, Maharashtra, India</li>
            </ul>
            <p>Grievances acknowledged within 48 hours and resolved within 30 days.</p>
          </div>

          <hr className="legal-divider" />

          <div className="legal-section">
            <h2>13 — Changes to This Policy</h2>
            <p>We may update this policy as MecAI evolves. The "Last updated" date above reflects any changes. For material changes, we will notify you via email or in-app notice.</p>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)', marginTop: '2.5rem', paddingTop: '1.75rem', borderTop: '0.5px solid rgba(204,222,255,0.08)', fontFamily: F }}>
            © 2026 Atherion Private Limited. All rights reserved.
          </p>
        </div>
      </main>
    </>
  );
}