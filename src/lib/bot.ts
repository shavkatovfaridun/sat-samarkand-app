type InlineKeyboardButton =
  | { text: string; url: string }
  | { text: string; web_app: { url: string } }

interface SendOptions {
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][]
  }
}

/** Send a Telegram message via Bot API */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: SendOptions,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(options ?? {}),
    }),
  })
}

/** Notify all telegram_ids in a list */
export async function broadcastMessage(telegramIds: number[], text: string): Promise<void> {
  await Promise.all(telegramIds.map((id) => sendTelegramMessage(id, text)))
}
