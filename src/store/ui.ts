import { create } from 'zustand'
import { uid } from '../lib/id'

export interface Toast {
  id: string
  message: string
  tone: 'info' | 'success' | 'error'
}

interface ConfirmRequest {
  message: string
  confirmLabel?: string
  danger?: boolean
  resolve: (ok: boolean) => void
}

interface UiState {
  toasts: Toast[]
  pinRequest: ((pin: string | null) => void) | null
  confirmRequest: ConfirmRequest | null
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  askPin: () => Promise<string | null>
  resolvePin: (pin: string | null) => void
  confirm: (message: string, opts?: { confirmLabel?: string; danger?: boolean }) => Promise<boolean>
  resolveConfirm: (ok: boolean) => void
}

export const useUi = create<UiState>()((set, get) => ({
  toasts: [],
  pinRequest: null,
  confirmRequest: null,

  toast: (message, tone = 'info') => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    setTimeout(() => get().dismissToast(id), 2800)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  askPin: () =>
    new Promise((resolve) => {
      get().pinRequest?.(null)
      set({ pinRequest: resolve })
    }),
  resolvePin: (pin) => {
    get().pinRequest?.(pin)
    set({ pinRequest: null })
  },

  confirm: (message, opts) =>
    new Promise((resolve) => {
      get().confirmRequest?.resolve(false)
      set({ confirmRequest: { message, ...opts, resolve } })
    }),
  resolveConfirm: (ok) => {
    get().confirmRequest?.resolve(ok)
    set({ confirmRequest: null })
  },
}))

export const toast = (message: string, tone?: Toast['tone']) => useUi.getState().toast(message, tone)
export const confirmDialog = (message: string, opts?: { confirmLabel?: string; danger?: boolean }) =>
  useUi.getState().confirm(message, opts)
