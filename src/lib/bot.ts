/** Send a Telegram message via Bot API */
export async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

/** Notify all telegram_ids in a list */
export async function broadcastMessage(telegramIds: number[], text: string): Promise<void> {
  await Promise.all(telegramIds.map((id) => sendTelegramMessage(id, text)))
}
