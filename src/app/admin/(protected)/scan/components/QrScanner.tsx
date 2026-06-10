'use client'

import { Camera, ImageUp, RotateCcw, ScanLine } from 'lucide-react'
import jsQR from 'jsqr'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { useQrScannerStore } from '@/stores/qr-scanner.store'

import { ScanResultBanner } from './ScanResultBanner'

import type { ScanResult } from '@/lib/qr/verify'

type Mode = 'camera' | 'upload'

// Decodage cote CLIENT via jsQR (universel : desktop + mobile, toute camera ou
// image). La chaine BRUTE est ensuite envoyee a POST /api/qr/verify : dechiffrement,
// signature, tournoi, double-scan = 100% serveur (M11). Aucune cle cote client.
const CAMERA_MAX_WIDTH = 640 // sous-echantillonnage video pour alleger le decodage
const IMAGE_MAX_DIM = 1500 // borne la taille du canvas pour une image importee
const DECODE_INTERVAL_MS = 150 // ~6-7 decodages/s en mode camera

/**
 * Console de scan (jour J). Deux modes :
 *  - Camera : flux video + decodage jsQR image par image (fonctionne aussi sur PC
 *    avec webcam).
 *  - Image : import d'une photo/capture du badge, decodee localement.
 */
export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const scanningRef = useRef(false)
  const lastDecodeRef = useRef(0)

  const [mode, setMode] = useState<Mode>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [decoding, setDecoding] = useState(false)

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

  const beginCamera = useCallback(async () => {
    setCameraError(null)
    setUploadError(null)
    start()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // `ideal` plutot que `exact` : ne casse pas sur PC (webcam frontale).
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
    } catch {
      setCameraError(
        'Camera indisponible (absente ou refusee). Utilise "Importer une image".',
      )
      return
    }

    scanningRef.current = true
    lastDecodeRef.current = 0

    const loop = async () => {
      if (!scanningRef.current) return

      const now = performance.now()
      if (now - lastDecodeRef.current >= DECODE_INTERVAL_MS) {
        lastDecodeRef.current = now
        const code = decodeFromVideo(videoRef.current, canvasRef.current)
        if (code && scanningRef.current) {
          scanningRef.current = false
          const outcome = await submit(code)
          if (outcome === 'done') {
            stopCamera()
            return
          }
          scanningRef.current = true // incident reseau : on reprend
        }
      }

      rafRef.current = requestAnimationFrame(() => void loop())
    }

    rafRef.current = requestAnimationFrame(() => void loop())
  }, [start, submit, stopCamera])

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null)
      setCameraError(null)
      setDecoding(true)
      try {
        const code = await decodeFromImageFile(file)
        if (!code) {
          setUploadError('Aucun QR code detecte dans cette image.')
          return
        }
        await submit(code)
      } catch {
        setUploadError("Impossible de lire l'image, reessaie.")
      } finally {
        setDecoding(false)
      }
    },
    [submit],
  )

  // Arret de la camera quand on quitte le mode camera ou au demontage.
  useEffect(() => {
    if (mode !== 'camera') stopCamera()
  }, [mode, stopCamera])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return (
    <div className="flex flex-col gap-4">
      {/* Selecteur de mode */}
      <div className="flex gap-2">
        <ModeButton
          active={mode === 'camera'}
          onClick={() => setMode('camera')}
          icon={<Camera className="size-4" aria-hidden />}
          label="Camera"
        />
        <ModeButton
          active={mode === 'upload'}
          onClick={() => {
            stopCamera()
            setMode('upload')
          }}
          icon={<ImageUp className="size-4" aria-hidden />}
          label="Importer une image"
        />
      </div>

      {/* Compteurs de session */}
      <div className="flex items-center justify-between rounded-xl bg-surface-1 px-4 py-3">
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

      {/* Canvas hors-ecran pour le decodage des frames camera */}
      <canvas ref={canvasRef} className="hidden" />

      {mode === 'camera' ? (
        <>
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-black">
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
                <div className="size-48 rounded-2xl ring-2 ring-accent-violet/70" />
              </div>
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-surface-1">
                <Camera className="size-8 text-text-secondary" aria-hidden />
                <p className="text-xs text-text-secondary">
                  Camera a l arret
                </p>
              </div>
            )}
          </div>

          {cameraError ? (
            <p className="rounded-xl bg-danger/15 px-4 py-2 text-center text-sm text-danger">
              {cameraError}
            </p>
          ) : null}

          {status === 'paused' && lastResult ? (
            <ScanResultBanner result={lastResult} />
          ) : null}

          {status === 'scanning' ? (
            <p className="text-center text-sm text-text-secondary">
              Vise le QR du badge...
            </p>
          ) : (
            <Button type="button" onClick={() => void beginCamera()}>
              <ScanLine className="size-4" aria-hidden />
              <span className="ml-2">
                {status === 'paused'
                  ? 'Scanner le suivant'
                  : 'Demarrer le scan'}
              </span>
            </Button>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={decoding}
            className={cn(
              'flex w-full flex-col items-center gap-3 rounded-2xl bg-surface-1 p-8 text-center',
              'transition-colors hover:bg-surface-2 disabled:opacity-50',
            )}
          >
            <ImageUp className="size-8 text-accent-violet" aria-hidden />
            <span className="text-sm font-medium text-text-primary">
              {decoding ? 'Lecture en cours...' : 'Choisir une image du badge'}
            </span>
            <span className="text-xs text-text-secondary">
              PNG ou JPG contenant le QR code
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = '' // permet de re-selectionner le meme fichier
            }}
          />

          {uploadError ? (
            <p className="rounded-xl bg-danger/15 px-4 py-2 text-center text-sm text-danger">
              {uploadError}
            </p>
          ) : null}

          {status === 'paused' && lastResult ? (
            <ScanResultBanner result={lastResult} />
          ) : null}
        </>
      )}
    </div>
  )
}

// ===========================================================================
// Helpers de decodage (client)
// ===========================================================================

function decodeFromVideo(
  video: HTMLVideoElement | null,
  canvas: HTMLCanvasElement | null,
): string | null {
  if (!video || !canvas) return null
  if (video.readyState < 2 || video.videoWidth === 0) return null

  const scale = Math.min(1, CAMERA_MAX_WIDTH / video.videoWidth)
  const w = Math.round(video.videoWidth * scale)
  const h = Math.round(video.videoHeight * scale)
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  const code = jsQR(data.data, data.width, data.height, {
    inversionAttempts: 'dontInvert',
  })
  return code?.data ?? null
}

async function decodeFromImageFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()

    const scale = Math.min(
      1,
      IMAGE_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight),
    )
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h)
    const code = jsQR(data.data, data.width, data.height, {
      inversionAttempts: 'attemptBoth',
    })
    return code?.data ?? null
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ===========================================================================
// Bouton de mode (style aligne sur ComposeMessageForm)
// ===========================================================================
function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent-violet/15 text-accent-violet'
          : 'bg-surface-2 text-text-secondary hover:text-text-primary',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}