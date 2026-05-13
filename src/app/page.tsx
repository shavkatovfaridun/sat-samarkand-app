'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TelegramLoginButton from '@/components/TelegramLoginButton'

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
const BOT_USERNAME = 'SATSamarkandBot'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'widget' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
      setStatus('error')
      return
    }

    const tg = window.Telegram?.WebApp
    const initData = tg?.initData

    if (!initData) {
      setStatus('widget')
      return
    }

    tg.ready()
    tg.expand()

    async function authenticate() {
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error || 'Auth failed')
        }

        const { role } = await res.json()
        router.replace(ROLE_REDIRECTS[role] || '/student/dashboard')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        setStatus('error')
      }
    }

    authenticate()
  }, [router, searchParams])

  if (status === 'widget') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4FD8] p-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl">
              📚
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SAT Samarkand</h1>
            <p className="text-white/60 text-sm">1500+ Score Guaranteed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-4">
            <p className="text-[#1A2340] font-semibold text-center mb-1">Sign in to your account</p>
            <p className="text-[#6B7B9C] text-xs text-center mb-5">
              Use your Telegram account — no password needed
            </p>
            <TelegramLoginButton
              botUsername={BOT_USERNAME}
              callbackUrl={`${APP_URL}/api/auth/telegram/callback`}
            />
          </div>

          <p className="text-white/40 text-xs text-center">
            Your data is safe. We only access your name and username.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FF] p-6">
        <div className="bg-white rounded-2xl p-6 text-center shadow-card max-w-sm w-full border border-[#E2E8F5]">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-[#1A2340] font-semibold mb-1">Sign-in failed</p>
          <p className="text-[#6B7B9C] text-sm mb-5">{error}</p>
          <button
            onClick={() => { setError(''); setStatus('widget') }}
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
      <div className="text-center">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl animate-pulse">
          📚
        </div>
        <p className="text-white/70 text-sm font-medium">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#1B4FD8]">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl animate-pulse">📚</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
