import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.breachlogic.app',
  appName: 'BreachLogic',
  webDir: 'out',

  // ── Server ────────────────────────────────────────────────────────────────
  // In production the app loads from the deployed Vercel URL so the web app
  // and the mobile app share one backend — no code duplication.
  // Set CAPACITOR_SERVER_URL in your environment or replace the string below
  // with your deployed URL (e.g. https://breachlogic.vercel.app).
  server: {
    url: process.env.CAPACITOR_SERVER_URL ?? 'https://your-app.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: {
    StatusBar: {
      style: 'Dark',           // white icons on dark navbar
      backgroundColor: '#1A237E', // brand-navy
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#1A237E',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    App: {
      // Deep-link scheme used to return to the app after OAuth
      // Must match the redirect URL configured in Supabase Auth settings
      // e.g. add  breachlogic://auth/callback  to your allowed redirect URLs
    },
  },

  // ── iOS ───────────────────────────────────────────────────────────────────
  ios: {
    contentInset: 'always',    // respect safe areas (notch / home bar)
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#1A237E',
    // scheme overrides the origin seen by the web app when running locally
    scheme: 'breachlogic',
  },

  // ── Android ───────────────────────────────────────────────────────────────
  android: {
    backgroundColor: '#1A237E',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true while developing
  },
}

export default config
