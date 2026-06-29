// app/template.tsx — next to layout.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes pageFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .page-transition {
          animation: pageFadeIn 0.4s ease both;
          /* No transform here — it breaks fixed-position children like LoginTransition */
        }
      `}</style>
      <div className="page-transition" style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </>
  )
}