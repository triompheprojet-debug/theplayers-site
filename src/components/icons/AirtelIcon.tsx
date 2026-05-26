import type { SVGProps } from 'react'

/**
 * Airtel Money — logo simplifié (carré arrondi rouge, texte "airtel" blanc).
 *
 * ⚠️ Représentation stylisée, NON le logo officiel Airtel.
 * Couleur dominante #ED1B24 (token --color-airtel-red).
 */
export function AirtelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Airtel Money"
      role="img"
      {...props}
    >
      <rect width="32" height="32" rx="7" fill="#ED1B24" />
      <text
        x="16"
        y="20"
        fontSize="7.5"
        fontWeight="800"
        fill="#ffffff"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
        letterSpacing="-0.2"
      >
        airtel
      </text>
    </svg>
  )
}