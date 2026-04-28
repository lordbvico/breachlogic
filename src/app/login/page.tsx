'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Zap } from 'lucide-react'
import type { Metadata } from 'next'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-navy mb-4">
            <Shield className="w-7 h-7 text-brand-teal" />
          </div>
          <h1 className="text-2xl font-semibold text-brand-navy">BreachLogic</h1>
          <p className="text-sm text-slate-mid mt-1">Train the adversarial mindset — one puzzle a day.</p>
        </div>

        {/* Sign-in card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-brand-navy">Sign in to continue</h2>
            <p className="text-xs text-slate-mid mt-1">
              Your streak, ATQ score, and puzzle history are saved to your account.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-brand-navy rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-start gap-2 rounded-lg bg-brand-teallite border border-brand-teal/30 px-3 py-2.5">
            <Zap className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-brand-tealdk leading-relaxed">
              Sign in to track your ATQ score, maintain your streak, and unlock the full puzzle archive.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-mid mt-6">
          By signing in you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
