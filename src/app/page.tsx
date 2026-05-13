'use client'

import { useEffect, useState } from 'react'
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

export default function AuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error' | 'no-telegram'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData

    if (!initData) {
      setStatus('no-telegram')
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
        const dest = ROLE_REDIRECTS[role] || '/student/dashboard'
        router.replace(dest)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        setStatus('error')
      }
    }

    authenticate()
  }, [router])

  if (status === 'no-telegram') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1B4FD8] p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">
            📚
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SAT Samarkand</h1>
          <p className="text-white/60 text-sm mb-10">
            1500+ Score Guaranteed
          </p>
          <a
            href="https://t.me/SATSamarkandBot/app"
            className="block w-full bg-white text-[#1B4FD8] rounded-2xl py-4 font-bold text-base text-center shadow-lg active:scale-95 transition-transform"
          >
            Open in Telegram
          </a>
          <p className="text-white/40 text-xs mt-6">
            Open via Telegram to access your account
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
          <p className="text-[#1A2340] font-semibold mb-1">Authentication Error</p>
          <p className="text-[#6B7B9C] text-sm mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
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
