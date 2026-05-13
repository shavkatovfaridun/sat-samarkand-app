'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        ready: () => void
        expand: () => void
      }
    }
  }
}

const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
  student: '/student/dashboard',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sat-samarkand-app.vercel.app'

function generateToken() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function AuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'widget' | 'waiting' | 'error'>('loading')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  // Mini App auth (inside Telegram)
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData

    if (!initData) {
      // Browser — generate token and show bot login
      const t = generateToken()
      setToken(t)
      // Pre-create the token row in DB
      fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      })
      setStatus('widget')
      return
    }

    tg.ready()
    tg.expand()

    fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
      .then((res) => res.ok ? res.json() : res.json().then((b) => Promise.reject(b.error)))
      .then(({ role }) => router.replace(ROLE_REDIRECTS[role] || '/student/dashboard'))
      .catch((msg) => { setError(String(msg)); setStatus('error') })
  }, [router])

  // Poll for bot login completion
  const startPolling = useCallback((t: string) => {
    setStatus('waiting')
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/poll?token=${t}`)
        const data = await res.json()
        if (data.status === 'ok') {
          clearInterval(interval)
          router.replace(data.redirect)
        } else if (data.status === 'expired') {
          clearInterval(interval)
          setError('Login link expired. Please try again.')
          setStatus('error')
        }
      } catch {
        // ignore network errors, keep polling
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [router])

  const handleLoginClick = () => {
    startPolling(token)
  }

  const handleRetry = () => {
    const t = generateToken()
    setToken(t)
    fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
    setError('')
    setStatus('widget')
  }

  const botLink = `https://t.me/SATSamarkandBot?start=auth_${token}`

  if (status === 'widget') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4FD8] p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl">
              📚
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SAT Samarkand</h1>
            <p className="text-white/60 text-sm">1500+ Score Guaranteed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-4">
            <p className="text-[#1A2340] font-bold text-center mb-1">Sign in with Telegram</p>
            <p className="text-[#6B7B9C] text-xs text-center mb-5">
              Click the button below — it opens Telegram, you tap once to confirm, done.
            </p>
            <a
              href={botLink}
              onClick={handleLoginClick}
              className="flex items-center justify-center gap-2 w-full bg-[#0088cc] text-white rounded-xl py-3.5 font-bold text-sm active:scale-95 transition-transform"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.012 9.483c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.875.738z"/>
              </svg>
              Open Telegram to Sign In
            </a>
          </div>

          <p className="text-white/40 text-xs text-center">
            You'll be redirected automatically after confirming in Telegram
          </p>
        </div>
      </div>
    )
  }

  if (status === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4FD8] p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl animate-pulse">
              📚
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Waiting for confirmation</h1>
            <p className="text-white/60 text-sm">Confirm the login in Telegram, then come back here</p>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-4 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 border-2 border-[#1B4FD8] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[#6B7B9C] text-sm">Waiting for Telegram...</p>
            <a
              href={botLink}
              className="block mt-4 text-[#1B4FD8] text-sm font-semibold underline"
            >
              Didn't open? Click here
            </a>
          </div>

          <button
            onClick={handleRetry}
            className="w-full text-white/50 text-sm py-2"
          >
            Start over
          </button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FF] p-6">
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full border border-[#E2E8F5]">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-[#1A2340] font-semibold mb-1">Sign-in failed</p>
          <p className="text-[#6B7B9C] text-sm mb-5">{error}</p>
          <button
            onClick={handleRetry}
            className="w-full bg-[#1B4FD8] text-white rounded-xl py-3 font-semibold text-sm active:scale-95 transition-transform"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4FD8]">
      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl animate-pulse">
        📚
      </div>
    </div>
  )
}
