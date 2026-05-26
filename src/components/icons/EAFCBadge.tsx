import type { SVGProps } from 'react'

/**
 * EA Sports FC — badge stylisé "EA FC".
 * Fond sombre + texte hérité de currentColor.
 *
 * ⚠️ Représentation stylisée, NON le logo officiel EA Sports.
 */
export function EAFCBadge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EA Sports FC"
      role="img"
      {...props}
    >
      <rect width="48" height="32" rx="6" fill="#0a0a14" />
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="31"
        rx="5.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <text
        x="24"
        y="20.5"
        fontSize="10"
        fontWeight="900"
        fill="currentColor"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
        letterSpacing="0.5"
      >
        EA FC
      </text>
    </svg>
  )
}