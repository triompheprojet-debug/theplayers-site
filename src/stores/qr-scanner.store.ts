import { create } from 'zustand'

import type { ScanResult } from '@/lib/qr/verify'

/**
 * Etat de la session de scan (jour J). `ScanResult` est importe en type-only
 * (le module `@/lib/qr/verify` est server-only ; le type est efface a la compil).
 *
 * Convention Zustand du projet (1er store reel) : un seul `create`, etat + actions
 * dans la meme interface, pas de middleware (etat ephemere, non persiste).
 */
type ScannerStatus = 'idle' | 'scanning' | 'paused'

interface QrScannerState {
  status: ScannerStatus
  lastResult: ScanResult | null
  validCount: number
  refusedCount: number

  start: () => void
  pause: () => void
  setResult: (result: ScanResult) => void
  reset: () => void
}

export const useQrScannerStore = create<QrScannerState>((set) => ({
  status: 'idle',
  lastResult: null,
  validCount: 0,
  refusedCount: 0,

  start: () => set({ status: 'scanning', lastResult: null }),
  pause: () => set({ status: 'paused' }),

  setResult: (result) =>
    set((state) => ({
      status: 'paused',
      lastResult: result,
      validCount: state.validCount + (result.valid ? 1 : 0),
      refusedCount: state.refusedCount + (result.valid ? 0 : 1),
    })),

  reset: () =>
    set({ status: 'idle', lastResult: null, validCount: 0, refusedCount: 0 }),
}))