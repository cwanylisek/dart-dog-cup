import { useEffect } from 'react'
import NoSleep from 'nosleep.js'

/** Keeps the screen on while `enabled`. Uses the Wake Lock API, with a video-based fallback for older iOS. */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let sentinel: WakeLockSentinel | null = null
    let noSleep: NoSleep | null = null
    let disposed = false

    const requestNative = async () => {
      if (!('wakeLock' in navigator)) return false
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (disposed) void sentinel.release()
        return true
      } catch {
        return false
      }
    }

    // The fallback has to start from a user gesture.
    const onGesture = () => {
      if (sentinel && !sentinel.released) return
      if (!noSleep) noSleep = new NoSleep()
      if (!noSleep.isEnabled) void noSleep.enable().catch(() => undefined)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void requestNative()
    }

    void requestNative()
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pointerdown', onGesture, { once: true })

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('pointerdown', onGesture)
      void sentinel?.release().catch(() => undefined)
      noSleep?.disable()
    }
  }, [enabled])
}
