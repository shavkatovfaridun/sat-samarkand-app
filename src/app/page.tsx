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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-2xl font-bold mb-2">SAT Samarkand</h1>
          <p className="text-gray-500 mb-8 text-sm">
            Open this app via Telegram to continue.
          </p>
          <a
            href="https://t.me/SATSamarkandBot/app"
            className="block w-full bg-[#0088cc] text-white rounded-xl py-3.5 font-semibold text-center"
          >
            Open in Telegram
          </a>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-red-500 text-sm text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">📚</div>
        <p className="text-gray-500 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}
