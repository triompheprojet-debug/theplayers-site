import type { SVGProps } from 'react'

/**
 * Bronze — rang 1 (0-50 pts).
 * Médaille bronze avec une étoile centrale.
 */
export function BronzeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rang Bronze"
      role="img"
      {...props}
    >
      <circle cx="12" cy="12" r="9" fill="#cd7f32" />
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="0.6"
      />
      <path
        d="M12 8.2L13.25 10.85L16.1 11.2L13.95 13.05L14.55 15.85L12 14.45L9.45 15.85L10.05 13.05L7.9 11.2L10.75 10.85Z"
        fill="#ffffff"
        fillOpacity="0.92"
      />
    </svg>
  )
}