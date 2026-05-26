import type { SVGProps } from 'react'

/**
 * Legend / Légende — rang 5 (601+ pts).
 * Couronne royale 5 pointes avec gemmes.
 */
export function LegendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rang Légende"
      role="img"
      {...props}
    >
      {/* Corps de la couronne */}
      <path
        d="M3 9L5 17H19L21 9L17 12L14 7L12 11L10 7L7 12Z"
        fill="#a855f7"
        stroke="#6b21a8"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Base */}
      <rect x="4.5" y="17" width="15" height="2.2" rx="0.5" fill="#7c3aed" />
      {/* Gemmes (pointes) */}
      <circle cx="3" cy="9" r="1" fill="#fde047" />
      <circle cx="12" cy="11" r="1.1" fill="#fde047" />
      <circle cx="21" cy="9" r="1" fill="#fde047" />
      <circle cx="7" cy="12" r="0.8" fill="#fff" fillOpacity="0.9" />
      <circle cx="17" cy="12" r="0.8" fill="#fff" fillOpacity="0.9" />
      {/* Gemme centrale grande (légende) */}
      <circle cx="12" cy="18.2" r="0.9" fill="#fde047" />
    </svg>
  )
}