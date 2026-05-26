import type { SVGProps } from 'react'

/**
 * Gold / Or — rang 3 (151-350 pts).
 * Médaille dorée avec étoile pleine et petite couronne en surplomb.
 */
export function GoldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rang Or"
      role="img"
      {...props}
    >
      {/* Petite couronne au-dessus */}
      <path
        d="M7.5 4L9 5.5L12 3.5L15 5.5L16.5 4L16 6.5L8 6.5Z"
        fill="#ffd700"
        stroke="#a87600"
        strokeWidth="0.4"
      />
      {/* Médaille */}
      <circle cx="12" cy="14" r="7.5" fill="#ffd700" />
      <circle
        cx="12"
        cy="14"
        r="5.5"
        fill="none"
        stroke="#a87600"
        strokeOpacity="0.5"
        strokeWidth="0.7"
      />
      {/* Étoile centrale */}
      <path
        d="M12 10.5L13.2 13L15.9 13.3L13.85 15.05L14.45 17.7L12 16.35L9.55 17.7L10.15 15.05L8.1 13.3L10.8 13Z"
        fill="#7a5500"
      />
    </svg>
  )
}