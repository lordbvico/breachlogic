'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2, Mail, KeyRound, User } from 'lucide-react'

interface Props {
  userId: string
  email: string
  initialUsername: string | null
}

export default function AccountSettingsForm({ userId, email, initialUsername }: Props) {
  const supabase = createClient()

  const [username, setUsername] = useState(initialUsername ?? '')
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [usernameSuccess, setUsernameSuccess] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const [resetSending, setResetSending] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault()
    setUsernameError(null)
    setUsernameSuccess(false)
    const trimmed = username.trim()
    if (trimmed.length < 2) {
      setUsernameError('Username must be at least 2 characters.')
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setUsernameError('Only letters, numbers, underscores, and hyphens allowed.')
      return
    }
    setUsernameSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', userId)
    setUsernameSaving(false)
    if (error) {
      setUsernameError(error.message)
    } else {
      setUsernameSuccess(true)
      setTimeout(() => setUsernameSuccess(false), 3000)
    }
  }

  async function handlePasswordReset() {
    setResetSending(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    })
    setResetSending(false)
    setResetSent(true)
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-6">
      <h2 className="text-sm font-semibold text-brand-navy">Account Settings</h2>

      {/* Email (read-only) */}
      <div>
        <label className="text-xs font-medium text-slate-mid flex items-center gap-1.5 mb-1.5">
          <Mail className="w-3.5 h-3.5" /> Email address
        </label>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate">
          {email}
          <span className="ml-auto text-[10px] text-slate-mid bg-slate-100 px-2 py-0.5 rounded-full">Read-only</span>
        </div>
      </div>

      {/* Username */}
      <form onSubmit={handleSaveUsername} className="space-y-2">
        <label className="text-xs font-medium text-slate-mid flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Username
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. breach_hunter"
            maxLength={30}
            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal bg-white placeholder:text-slate-mid"
          />
          <button
            type="submit"
            disabled={usernameSaving || username.trim() === (initialUsername ?? '')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-brand-navydk transition-colors disabled:opacity-50"
          >
            {usernameSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : usernameSuccess
              ? <Check className="w-4 h-4" />
              : 'Save'
            }
          </button>
        </div>
        {usernameError && (
          <p className="text-xs text-target-red">{usernameError}</p>
        )}
        {usernameSuccess && (
          <p className="text-xs text-success-green flex items-center gap-1">
            <Check className="w-3 h-3" /> Username updated.
          </p>
        )}
        <p className="text-[11px] text-slate-mid">Shown on the leaderboard. Letters, numbers, _, - only.</p>
      </form>

      {/* Password reset */}
      <div>
        <label className="text-xs font-medium text-slate-mid flex items-center gap-1.5 mb-1.5">
          <KeyRound className="w-3.5 h-3.5" /> Password
        </label>
        {resetSent ? (
          <p className="text-xs text-success-green flex items-center gap-1.5 py-2">
            <Check className="w-3.5 h-3.5" />
            Reset link sent to {email}. Check your inbox.
          </p>
        ) : (
          <button
            onClick={handlePasswordReset}
            disabled={resetSending}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {resetSending && <Loader2 className="w-4 h-4 animate-spin" />}
            Send password reset email
          </button>
        )}
        <p className="text-[11px] text-slate-mid mt-1.5">
          We&apos;ll email a secure link to reset your password.
        </p>
      </div>
    </div>
  )
}
