"use client";

// components/CookieBanner.tsx
// MecAI Cookie Consent Banner — DPDP Act 2023 compliant
// Usage: Import and place in your root layout.tsx

import { useState, useEffect } from "react";

type ConsentState = {
  essential: true;     // always true, non-negotiable
  analytics: boolean;
};

const CONSENT_KEY = "mecai_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Slight delay so it doesn't flash on first paint
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (consent: ConsentState) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    } catch {
      // localStorage unavailable — continue silently
    }
    setVisible(false);

    // Fire your analytics init here if analytics === true
    // e.g. if (consent.analytics) { initPostHog(); }
  };

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true });
  };

  const acceptSelected = () => {
    saveConsent({ essential: true, analytics });
  };

  const rejectAll = () => {
    saveConsent({ essential: true, analytics: false });
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        .cb-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
        }

        .cb-banner {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 3rem);
          max-width: 640px;
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 1.5rem;
          z-index: 9999;
          pointer-events: all;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          animation: cb-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cb-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .cb-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .cb-title {
          font-family: 'Neue Montreal', 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
          margin: 0 0 0.35rem;
          letter-spacing: -0.01em;
        }

        .cb-body {
          font-family: 'Neue Montreal', 'Inter', sans-serif;
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .cb-body a {
          color: #94a3b8;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .cb-body a:hover {
          color: #e2e8f0;
        }

        .cb-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #1e293b;
          animation: cb-fade 0.2s ease;
        }

        @keyframes cb-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .cb-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
        }

        .cb-toggle-label {
          font-family: 'Neue Montreal', 'Inter', sans-serif;
          font-size: 13px;
          color: #94a3b8;
        }

        .cb-toggle-label span {
          display: block;
          font-size: 11px;
          color: #475569;
          margin-top: 2px;
        }

        .cb-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          flex-shrink: 0;
        }

        .cb-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .cb-track {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: #1e293b;
          transition: background 0.2s;
          cursor: pointer;
        }

        .cb-toggle input:checked + .cb-track {
          background: #3b82f6;
        }

        .cb-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #475569;
          transition: transform 0.2s, background 0.2s;
          pointer-events: none;
        }

        .cb-toggle input:checked ~ .cb-thumb {
          transform: translateX(16px);
          background: #fff;
        }

        .cb-toggle-disabled .cb-track {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cb-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1.25rem;
          flex-wrap: wrap;
        }

        .cb-btn {
          font-family: 'Neue Montreal', 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border: none;
          transition: opacity 0.15s, background 0.15s;
          white-space: nowrap;
        }

        .cb-btn:hover { opacity: 0.85; }

        .cb-btn-primary {
          background: #f8fafc;
          color: #0a0a0a;
        }

        .cb-btn-secondary {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #1e293b;
        }

        .cb-btn-ghost {
          background: transparent;
          color: #475569;
          padding-left: 0.25rem;
          padding-right: 0.25rem;
          font-size: 11px;
        }

        @media (max-width: 480px) {
          .cb-banner {
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            transform: none;
            border-radius: 12px 12px 0 0;
          }
        }
      `}</style>

      <div className="cb-banner" role="dialog" aria-label="Cookie preferences">
        <div className="cb-top">
          <div>
            <p className="cb-title">Cookie preferences</p>
            <p className="cb-body">
              We use cookies to keep MecAI working and to understand how it's used.
              See our <a href="/privacy">Privacy Policy</a> for details.
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="cb-details">
            {/* Essential — always on */}
            <div className="cb-toggle-row">
              <div className="cb-toggle-label">
                Essential cookies
                <span>Required for login and core functionality. Always on.</span>
              </div>
              <div className={`cb-toggle cb-toggle-disabled`}>
                <input type="checkbox" checked readOnly disabled />
                <div className="cb-track" />
                <div className="cb-thumb" style={{ transform: "translateX(16px)", background: "#fff", opacity: 0.4 }} />
              </div>
            </div>

            {/* Analytics — toggleable */}
            <div className="cb-toggle-row">
              <div className="cb-toggle-label">
                Analytics cookies
                <span>Help us improve MecAI. No advertising or cross-site tracking.</span>
              </div>
              <label className="cb-toggle">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <div className="cb-track" />
                <div className="cb-thumb" />
              </label>
            </div>
          </div>
        )}

        <div className="cb-actions">
          <button className="cb-btn cb-btn-primary" onClick={acceptAll}>
            Accept all
          </button>

          {showDetails ? (
            <button className="cb-btn cb-btn-secondary" onClick={acceptSelected}>
              Save preferences
            </button>
          ) : (
            <button className="cb-btn cb-btn-secondary" onClick={() => setShowDetails(true)}>
              Manage
            </button>
          )}

          <button className="cb-btn cb-btn-ghost" onClick={rejectAll}>
            Reject non-essential
          </button>
        </div>
      </div>
    </>
  );
}