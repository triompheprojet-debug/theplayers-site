import type { SVGProps } from 'react'

/**
 * PlayStation — initiales "PS" stylisées en italique gras.
 * Hérite de currentColor (s'adapte au contexte — typiquement text-text-secondary).
 *
 * ⚠️ Représentation stylisée, NON le logo officiel PlayStation.
 */
export function PlayStationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PlayStation"
      role="img"
      fill="currentColor"
      {...props}
    >
      <text
        x="16"
        y="23"
        fontSize="22"
        fontWeight="900"
        fontStyle="italic"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
        letterSpacing="-1"
      >
        PS
      </text>
    </svg>
  )
}