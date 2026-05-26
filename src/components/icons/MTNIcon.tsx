import type { SVGProps } from 'react'

/**
 * MTN Mobile Money — logo simplifié (rond jaune, lettres "MTN" sombres).
 *
 * ⚠️ Représentation stylisée, NON le logo officiel MTN.
 * Couleur dominante #FFCB05 (token --color-mtn-yellow).
 */
export function MTNIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MTN Mobile Money"
      role="img"
      {...props}
    >
      <circle cx="16" cy="16" r="16" fill="#FFCB05" />
      <text
        x="16"
        y="20"
        fontSize="9"
        fontWeight="900"
        fill="#0a0a14"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
        letterSpacing="0.5"
      >
        MTN
      </text>
    </svg>
  )
}