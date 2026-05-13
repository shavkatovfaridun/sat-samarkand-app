'use client'

import { useEffect, useRef } from 'react'

interface Props {
  botUsername: string
  callbackUrl: string
}

export default function TelegramLoginButton({ botUsername, callbackUrl }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-auth-url', callbackUrl)
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-radius', '12')

    ref.current.appendChild(script)

    return () => {
      if (ref.current) ref.current.innerHTML = ''
    }
  }, [botUsername, callbackUrl])

  return <div ref={ref} className="flex justify-center" />
}
