import type { SVGProps } from 'react'

/**
 * Silver / Argent — rang 2 (51-150 pts).
 * Médaille argent avec étoile centrale et 2 petites étoiles latérales.
 */
export function SilverIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rang Argent"
      role="img"
      {...props}
    >
      <circle cx="12" cy="12" r="9" fill="#c0c0c0" />
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="0.7"
      />
      <path
        d="M12 8L13.3 10.7L16.2 11.05L14.05 12.95L14.7 15.85L12 14.4L9.3 15.85L9.95 12.95L7.8 11.05L10.7 10.7Z"
        fill="#ffffff"
      />
      <circle cx="6.5" cy="7" r="0.9" fill="#ffffff" fillOpacity="0.8" />
      <circle cx="17.5" cy="7" r="0.9" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  )
}