'use client'

import { Camera, RotateCcw, ScanLine } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { useQrScannerStore } from '@/stores/qr-scanner.store'

import { ScanResultBanner } from './ScanResultBanner'

import type { ScanResult } from '@/lib/qr/verify'

// `BarcodeDetector` n'est pas (encore) dans les types DOM standard.
type BarcodeDetectorCtor = new (options?: { formats: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined') return null
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector
  return ctor ?? null
}

/**
 * Console de scan (jour J), mobile/tablette. Decode le QR cote CLIENT (camera
 * arriere) puis envoie la chaine BRUTE a `POST /api/qr/verify` : la validation
 * (dechiffrement, signature, tournoi, double-scan) est 100% serveur (M11/M13).
 */
export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const scanningRef = useRef(false)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [unsupported, setUnsupported] = useState(false)

  const status = useQrScannerStore((s) => s.status)
  const lastResult = useQrScannerStore((s) => s.lastResult)
  const validCount = useQrScannerStore((s) => s.validCount)
  const refusedCount = useQrScannerStore((s) => s.refusedCount)
  const start = useQrScannerStore((s) => s.start)
  const setResult = useQrScannerStore((s) => s.setResult)
  const reset = useQrScannerStore((s) => s.reset)

  const stopCamera = useCallback(() => {
    scanningRef.current = false
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  // Envoi serveur. Renvoie 'done' (resultat obtenu) ou 'retry' (incident reseau).
  const submit = useCallback(
    async (payload: string): Promise<'done' | 'retry'> => {
      try {
        const res = await fetch(ROUTES.api.qrVerify, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload }),
        })
        if (!res.ok) {
          setCameraError('Verification impossible, reessaie.')
          return 'retry'
        }
        const result = (await res.json()) as ScanResult
        setResult(result)
        return 'done'
      } catch {
        setCameraError('Reseau indisponible, reessaie.')
        return 'retry'
      }
    },
    [setResult],
  )

  const begin = useCallback(async () => {
    const Detector = getBarcodeDetector()
    if (!Detector) {
      setUnsupported(true)
      return
    }
    setCameraError(null)
    start()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
    } catch {
      setCameraError('Acces a la camera refuse ou indisponible.')
      return
    }

    const detector = new Detector({ formats: ['qr_code'] })
    scanningRef.current = true

    const loop = async () => {
      if (!scanningRef.current) return
      const video = videoRef.current
      if (video && video.readyState >= 2) {
        try {
          const codes = await detector.detect(video)
          const raw = codes[0]?.rawValue
          if (raw && scanningRef.current) {
            scanningRef.current = false
            const outcome = await submit(raw)
            if (outcome === 'done') {
              stopCamera()
              return
            }
            scanningRef.current = true // incident reseau : on reprend
          }
        } catch {
          // frame illisible : on continue
        }
      }
      rafRef.current = requestAnimationFrame(() => void loop())
    }

    rafRef.current = requestAnimationFrame(() => void loop())
  }, [start, submit, stopCamera])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  if (unsupported) {
    return (
      <div className="rounded-xl bg-surface-1 p-6 text-center">
        <Camera className="mx-auto size-8 text-text-secondary" aria-hidden />
        <p className="mt-3 text-sm text-text-secondary">
          Le scan par camera n est pas pris en charge par ce navigateur. Utilise
          Chrome sur Android, ou verifie le badge manuellement.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Compteurs de session */}
      <div className="flex items-center justify-between rounded-lg bg-surface-1 px-4 py-3">
        <div className="flex gap-6">
          <span className="text-sm text-text-secondary">
            Valides <strong className="text-success-neon">{validCount}</strong>
          </span>
          <span className="text-sm text-text-secondary">
            Refuses <strong className="text-danger">{refusedCount}</strong>
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            stopCamera()
            reset()
          }}
        >
          <RotateCcw className="size-4" aria-hidden />
          <span className="ml-2">Session</span>
        </Button>
      </div>

      {/* Zone camera (toujours montee pour stabiliser le ref video) */}
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={
            status === 'scanning'
              ? 'block aspect-square w-full object-cover'
              : 'hidden'
          }
        />
        {status === 'scanning' ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="size-48 rounded-2xl border-2 border-accent-violet/70" />
          </div>
        ) : null}
      </div>

      {cameraError ? (
        <p className="rounded-lg bg-danger/15 px-4 py-2 text-center text-sm text-danger">
          {cameraError}
        </p>
      ) : null}

      {/* Resultat */}
      {status === 'paused' && lastResult ? (
        <ScanResultBanner result={lastResult} />
      ) : null}

      {/* Controles */}
      {status === 'scanning' ? (
        <p className="text-center text-sm text-text-secondary">
          Vise le QR du badge...
        </p>
      ) : (
        <Button type="button" onClick={() => void begin()}>
          <ScanLine className="size-4" aria-hidden />
          <span className="ml-2">
            {status === 'paused' ? 'Scanner le suivant' : 'Demarrer le scan'}
          </span>
        </Button>
      )}
    </div>
  )
}