'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface AmbientVideoProps {
  /** Chemin public du MP4 (muet, en boucle) */
  src: string
  /** Classes du conteneur (positionnement). Par défaut : couvre le parent. */
  className?: string
  /** Marge de pré-déclenchement avant l'entrée dans le viewport */
  rootMargin?: string
}

/**
 * Vidéo d'ambiance décorative, optimisée réseau lent :
 *  - ne se charge QUE quand la section approche du viewport (IntersectionObserver)
 *  - jamais chargée si l'utilisateur préfère réduire les animations
 *  - jamais chargée si le conteneur est masqué en CSS (display:none = pas
 *    d'intersection) → un wrapper `hidden md:block` suffit à exclure le mobile
 *  - muette, en boucle, playsInline (iOS), preload="none"
 *
 * Purement décorative : aria-hidden + pointer-events-none. Le fond visuel
 * (image/dégradé) du parent sert de repli pendant et sans chargement.
 */
export function AmbientVideo({
  src,
  className,
  rootMargin = '200px',
}: AmbientVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {shouldLoad && (
        <video
          src={src}
          muted
          loop
          autoPlay
          playsInline
          preload="none"
          className="size-full object-cover"
        />
      )}
    </div>
  )
}