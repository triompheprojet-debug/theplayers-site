import type { SVGProps } from 'react'

/**
 * Diamond / Diamant — rang 4 (351-600 pts).
 * Cristal diamant taillé, vue de face avec facettes.
 */
export function DiamondIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rang Diamant"
      role="img"
      {...props}
    >
      {/* Contour principal du diamant */}
      <path
        d="M4 9L8 4H16L20 9L12 21Z"
        fill="#60a5fa"
        stroke="#2563eb"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Facette gauche */}
      <path d="M4 9L8 4L10 9Z" fill="#93c5fd" />
      {/* Facette droite */}
      <path d="M20 9L16 4L14 9Z" fill="#3b82f6" />
      {/* Facette centrale haute */}
      <path d="M8 4L10 9H14L16 4Z" fill="#bfdbfe" />
      {/* Lignes de facettes inférieures */}
      <path
        d="M10 9L12 21M14 9L12 21M4 9H20"
        stroke="#1d4ed8"
        strokeWidth="0.5"
        strokeOpacity="0.6"
      />
    </svg>
  )
}