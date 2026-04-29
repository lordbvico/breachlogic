/**
 * Capacitor platform helpers.
 *
 * Safe to import in any component — falls back gracefully when Capacitor is
 * not present (i.e. regular web browser).
 */

export function isNative(): boolean {
  try {
    // Capacitor injects this global when running inside a native shell
    return typeof window !== 'undefined' &&
      !!(window as unknown as Record<string, unknown>).Capacitor &&
      (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export function isIOS(): boolean {
  try {
    return isNative() &&
      (window as unknown as { Capacitor: { getPlatform: () => string } }).Capacitor.getPlatform() === 'ios'
  } catch {
    return false
  }
}

export function isAndroid(): boolean {
  try {
    return isNative() &&
      (window as unknown as { Capacitor: { getPlatform: () => string } }).Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

/**
 * Returns the OAuth redirect URL appropriate for the current platform.
 *
 * - Web:     https://your-app.vercel.app/auth/callback   (handled by Supabase SSR route)
 * - Native:  breachlogic://auth/callback                  (deep link back into the app)
 */
export function oauthRedirectUrl(next = '/home'): string {
  if (isNative()) {
    return `breachlogic://auth/callback?next=${encodeURIComponent(next)}`
  }
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}
