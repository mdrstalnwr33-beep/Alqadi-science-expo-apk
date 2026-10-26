import { Platform } from 'react-native';

/**
 * Optional secure bridge for Telegram document extraction.
 * The bridge URL must point to a backend that keeps the Telegram Bot Token
 * server-side. Never put the bot token in the APK.
 */
const TELEGRAM_BRIDGE_URL = process.env.EXPO_PUBLIC_TELEGRAM_BRIDGE_URL?.trim() || '';

export function isTelegramMessageUrl(raw: string) {
  return /^https?:\/\/(?:www\.)?t\.me\/(?:s\/)?[^/]+\/\d+(?:[?#].*)?$/i.test(raw.trim());
}

export async function resolveTelegramPdf(messageUrl: string): Promise<string> {
  if (!TELEGRAM_BRIDGE_URL) {
    throw new Error('telegram-bridge-not-configured');
  }
  if (!isTelegramMessageUrl(messageUrl)) {
    throw new Error('invalid-telegram-url');
  }

  const response = await fetch(TELEGRAM_BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageUrl: messageUrl.trim(), platform: Platform.OS }),
  });

  if (!response.ok) throw new Error(`telegram-bridge-${response.status}`);
  const data = (await response.json()) as { downloadUrl?: string };
  if (!data.downloadUrl) throw new Error('telegram-file-not-found');
  return data.downloadUrl;
}
