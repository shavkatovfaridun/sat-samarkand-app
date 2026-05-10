/** Format UZS currency: 450000 → "450 000 UZS" */
export function formatUZS(amount: number): string {
  return amount.toLocaleString('ru-RU').replace(/,/g, ' ') + ' UZS'
}

/** Format date as DD.MM.YYYY */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU')
}

/** Days remaining until a date */
export function daysUntil(date: string): number {
  const target = new Date(date).getTime()
  const now = Date.now()
  return Math.max(0, Math.ceil((target - now) / 86400000))
}
