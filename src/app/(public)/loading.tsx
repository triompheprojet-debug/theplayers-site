/**
 * Loader global (refonte). 100% SVG + CSS, sans image ni JS :
 *  - hexagone-badge (cadre violet discret)
 *  - manette qui tourne au centre
 *  - flux lumineux vert qui trace l'hexagone (chargement)
 * Léger pour réseau lent ; animations coupées si prefers-reduced-motion.
 */
const STYLES = `
@keyframes tp-spin { to { transform: rotate(360deg); } }
@keyframes tp-trace { to { stroke-dashoffset: -480; } }
@keyframes tp-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }

.tp-hex { stroke: var(--color-surface-3); }
.tp-flux {
  stroke: var(--color-success-neon);
  stroke-dasharray: 64 416;
  stroke-dashoffset: 0;
  filter: drop-shadow(0 0 5px var(--color-success-neon));
  animation: tp-trace 2.4s linear infinite;
}
.tp-pad {
  transform-box: fill-box;
  transform-origin: center;
  animation: tp-spin 5s linear infinite;
}
.tp-pad path {
  stroke: var(--color-accent-violet);
  filter: drop-shadow(0 0 3px rgba(139, 92, 246, .65));
}
.tp-dot { animation: tp-pulse 1.4s ease-in-out infinite; }
.tp-dot:nth-child(2) { animation-delay: .2s; }
.tp-dot:nth-child(3) { animation-delay: .4s; }

@media (prefers-reduced-motion: reduce) {
  .tp-flux, .tp-pad, .tp-dot { animation: none; }
}
`

export default function Loading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-background p-4">
      <style>{STYLES}</style>

      {/* Halo d'ambiance */}
      <div
        aria-hidden
        className="absolute size-72 rounded-full bg-accent-violet/10 blur-[120px]"
      />

      <div
        role="status"
        aria-label="Chargement"
        className="relative size-40 md:size-48"
      >
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full"
          fill="none"
        >
          {/* Hexagone cadre (discret) */}
          <path
            className="tp-hex"
            d="M100 20 L169.28 60 L169.28 140 L100 180 L30.72 140 L30.72 60 Z"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Flux lumineux vert (chargement) */}
          <path
            className="tp-flux"
            d="M100 20 L169.28 60 L169.28 140 L100 180 L30.72 140 L30.72 60 Z"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Manette (tourne) */}
          <g className="tp-pad">
            <g
              transform="translate(58 58) scale(3.5)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            >
              <path d="M6 11h4" />
              <path d="M8 9v4" />
              <path d="M15 12h.01" />
              <path d="M18 10h.01" />
              <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
            </g>
          </g>
        </svg>
      </div>

      <p className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.3em] text-text-secondary">
        Chargement
        <span className="tp-dot">.</span>
        <span className="tp-dot">.</span>
        <span className="tp-dot">.</span>
      </p>
    </div>
  )
}