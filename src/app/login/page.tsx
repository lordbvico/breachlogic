'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { oauthRedirectUrl } from '@/lib/platform'
import { Shield, Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

type Mode = 'choose' | 'signin' | 'signup'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get('next') || '/home'

  const [mode, setMode] = useState<Mode>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupDone, setSignupDone] = useState(false)

  const supabase = createClient()

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: oauthRedirectUrl(next) },
    })
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(next)
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSignupDone(true)
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal bg-white placeholder:text-slate-mid'

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-navy mb-4">
            <Shield className="w-7 h-7 text-brand-teal" />
          </div>
          <h1 className="text-2xl font-semibold text-brand-navy">BreachLogic</h1>
          <p className="text-sm text-slate-mid mt-1">Train the adversarial mindset — one puzzle a day.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">

          {/* ── Mode: choose ─────────────────────────────────────────── */}
          {mode === 'choose' && (
            <>
              <div>
                <h2 className="text-base font-semibold text-brand-navy">Sign in to continue</h2>
                <p className="text-xs text-slate-mid mt-1">
                  Your streak, ATQ score, and puzzle history are saved to your account.
                </p>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate disabled:opacity-60"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-slate-300 border-t-brand-navy rounded-full animate-spin" />
                  : <GoogleIcon />
                }
                {loading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-mid font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Email options */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('signin')}
                  className="py-2.5 rounded-xl border border-brand-navy text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className="py-2.5 rounded-xl bg-brand-navy text-sm font-semibold text-white hover:bg-brand-navydk transition-colors"
                >
                  Create account
                </button>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-brand-teallite border border-brand-teal/30 px-3 py-2.5">
                <Zap className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-brand-tealdk leading-relaxed">
                  Sign in to track your ATQ score, maintain your streak, and unlock the full puzzle archive.
                </p>
              </div>
            </>
          )}

          {/* ── Mode: sign in with email ──────────────────────────────── */}
          {mode === 'signin' && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => { setMode('choose'); setError(null) }} className="text-slate-mid hover:text-brand-navy transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-semibold text-brand-navy">Sign in</h2>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate block mb-1">Email</label>
                  <input
                    type="email" required autoFocus
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" className={clsx(inputCls, 'pr-10')}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-mid hover:text-slate transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-target-red bg-target-redlite rounded-lg px-3 py-2">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navydk transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-xs text-slate-mid">
                No account?{' '}
                <button onClick={() => { setMode('signup'); setError(null) }} className="text-brand-teal hover:underline font-medium">
                  Create one
                </button>
              </p>
            </>
          )}

          {/* ── Mode: sign up ─────────────────────────────────────────── */}
          {mode === 'signup' && !signupDone && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => { setMode('choose'); setError(null) }} className="text-slate-mid hover:text-brand-navy transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-semibold text-brand-navy">Create account</h2>
              </div>

              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate block mb-1">Email</label>
                  <input
                    type="email" required autoFocus
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="8+ characters" className={clsx(inputCls, 'pr-10')}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-mid hover:text-slate transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate block mb-1">Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" className={inputCls}
                  />
                </div>

                {error && <p className="text-xs text-target-red bg-target-redlite rounded-lg px-3 py-2">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navydk transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-xs text-slate-mid">
                Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError(null) }} className="text-brand-teal hover:underline font-medium">
                  Sign in
                </button>
              </p>
            </>
          )}

          {/* ── Sign-up confirmation ──────────────────────────────────── */}
          {mode === 'signup' && signupDone && (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-success-green/10 border border-success-green/30 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-success-green" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-brand-navy">Check your email</h2>
                <p className="text-xs text-slate-mid mt-1.5 leading-relaxed">
                  We sent a confirmation link to <strong className="text-slate">{email}</strong>.
                  Click it to activate your account and start playing.
                </p>
              </div>
              <button onClick={() => { setMode('signin'); setSignupDone(false); setError(null) }}
                className="text-xs text-brand-teal hover:underline">
                Back to sign in
              </button>
            </div>
          )}
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
