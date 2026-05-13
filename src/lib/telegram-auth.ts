import crypto from 'crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
}

/**
 * Validates Telegram Mini App initData using HMAC-SHA256.
 * Returns parsed user data if valid, throws if invalid.
 */
export function validateTelegramInitData(initData: string, botToken: string): TelegramUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')

  if (!hash) throw new Error('Missing hash in initData')

  // Build data-check-string: sorted key=value pairs (excluding hash), joined by \n
  const entries: string[] = []
  params.forEach((value, key) => {
    if (key !== 'hash') entries.push(`${key}=${value}`)
  })
  entries.sort()
  const dataCheckString = entries.join('\n')

  // HMAC key = HMAC-SHA256("WebAppData", botToken)
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (expectedHash !== hash) throw new Error('Invalid initData signature')

  // Check auth_date is not older than 24 hours
  const authDate = parseInt(params.get('auth_date') || '0', 10)
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 86400) throw new Error('initData expired')

  const userRaw = params.get('user')
  if (!userRaw) throw new Error('No user in initData')

  return JSON.parse(userRaw) as TelegramUser
}

export function formatFullName(user: TelegramUser): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ')
}

export interface TelegramWidgetUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

/**
 * Validates data from the Telegram Login Widget (web, not Mini App).
 * Widget uses SHA256(botToken) as the HMAC key — different from initData.
 */
export function validateTelegramWidgetData(
  data: Record<string, string>,
  botToken: string
): TelegramWidgetUser {
  const { hash, ...rest } = data

  if (!hash) throw new Error('Missing hash')

  const checkString = Object.entries(rest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  if (expectedHash !== hash) throw new Error('Invalid signature')

  const authDate = parseInt(rest.auth_date ?? '0', 10)
  if (Math.floor(Date.now() / 1000) - authDate > 86400) throw new Error('Auth data expired')

  return {
    id: parseInt(rest.id, 10),
    first_name: rest.first_name ?? '',
    last_name: rest.last_name,
    username: rest.username,
    photo_url: rest.photo_url,
  }
}
