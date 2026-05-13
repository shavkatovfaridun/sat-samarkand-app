'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    Telegram?: { WebApp: { initData: string; ready: () => void; expand: () => void } }
  }
}

const ROLE_REDIRECTS: Record<string, string> = {
  admin:   '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent:  '/parent/dashboard',
  student: '/student/dashboard',
}

function generateToken() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

type Status = 'loading' | 'ready' | 'waiting' | 'error'

export default function AuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [token, setToken]   = useState('')
  const [error, setError]   = useState('')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg?.initData) {
      tg.ready(); tg.expand()
      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      })
        .then(r => r.ok ? r.json() : r.json().then(b => Promise.reject(b.error)))
        .then(({ role }) => router.replace(ROLE_REDIRECTS[role] || '/student/dashboard'))
        .catch(msg => { setError(String(msg)); setStatus('error') })
      return
    }
    const t = generateToken()
    setToken(t)
    fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
    setStatus('ready')
  }, [router])

  const startPolling = useCallback((t: string) => {
    setStatus('waiting')
    const id = setInterval(async () => {
      try {
        const res  = await fetch(`/api/auth/poll?token=${t}`)
        const data = await res.json()
        if (data.status === 'ok') {
          clearInterval(id)
          router.replace(data.redirect)
        } else if (data.status === 'expired') {
          clearInterval(id)
          setError('Login link expired.')
          setStatus('error')
        }
      } catch { /* keep polling */ }
    }, 2000)
  }, [router])

  const handleRetry = () => {
    const t = generateToken()
    setToken(t)
    fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
    setError('')
    setStatus('ready')
  }

  const botLink = `https://t.me/SATSamarkandBot?start=auth_${token}`

  /* ─── Loading ─── */
  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1B4FD8' }}>
      <div className="w-14 h-14 rounded-3xl bg-white/15 flex items-center justify-center animate-pulse">
        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
          <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
        </svg>
      </div>
    </div>
  )

  /* ─── Ready ─── */
  if (status === 'ready') return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #1340B0 0%, #1B4FD8 50%, #2563EB 100%)' }}>
      {/* Top decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -left-24 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
              <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
            </svg>
          </div>
          <h1 className="text-[32px] font-bold text-white tracking-tight mb-1">SAT Samarkand</h1>
          <p className="text-white/50 text-[15px] font-medium">Your path to 1500+</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm"
          style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.20), 0 1px 0 rgba(255,255,255,0.6) inset' }}>
          <div className="p-7">
            <h2 className="text-[19px] font-bold text-[#1C1C1E] mb-1 text-center">Sign in</h2>
            <p className="text-[13px] text-center mb-7" style={{ color: 'rgba(60,60,67,0.55)' }}>
              Opens Telegram — tap once to confirm
            </p>

            <a
              href={botLink}
              onClick={() => startPolling(token)}
              className="flex items-center justify-center gap-3 w-full text-white rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.97]"
              style={{ background: '#0088cc', padding: '15px', boxShadow: '0 4px 16px rgba(0,136,204,0.35)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.483c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.875.738z"/>
              </svg>
              Continue with Telegram
            </a>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(60,60,67,0.12)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'rgba(60,60,67,0.35)' }}>How it works</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(60,60,67,0.12)' }} />
            </div>

            <div className="space-y-3">
              {[
                ['1', 'Tap the button above'],
                ['2', 'Tap Start in the Telegram bot'],
                ['3', 'Tap Open SAT Samarkand — done!'],
              ].map(([n, t]) => (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: '#1B4FD8' }}>{n}</span>
                  <span className="text-[13px]" style={{ color: 'rgba(60,60,67,0.65)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-white/30 text-[12px] text-center mt-6 max-w-xs">
          No password. No email. Your Telegram account is your identity.
        </p>
      </div>
    </div>
  )

  /* ─── Waiting ─── */
  if (status === 'waiting') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #1340B0 0%, #1B4FD8 50%, #2563EB 100%)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-8"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.20)' }}>
          <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Confirm in Telegram</h2>
        <p className="text-white/50 text-[14px] mb-8">Tap <b className="text-white/80">Start</b> in the bot — then tap <b className="text-white/80">Open SAT Samarkand</b></p>

        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '20px' }} className="mb-4">
          <a href={botLink} className="text-white font-semibold text-[14px] underline underline-offset-2 opacity-80">
            Didn't open? Tap here to retry →
          </a>
        </div>

        <button onClick={handleRetry} className="text-white/40 text-[13px] py-2">
          Start over
        </button>
      </div>
    </div>
  )

  /* ─── Error ─── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F2F2F7' }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-7 text-center" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-red-500" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-[17px] font-bold text-[#1C1C1E] mb-1">Sign-in failed</h2>
          <p className="text-[13px] mb-6" style={{ color: 'rgba(60,60,67,0.55)' }}>{error || 'Something went wrong'}</p>
          <button onClick={handleRetry}
            className="w-full text-white rounded-2xl text-[15px] font-semibold py-4 transition-all active:scale-[0.97]"
            style={{ background: '#1B4FD8' }}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
