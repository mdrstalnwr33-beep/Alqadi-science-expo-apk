# Telegram implementation status

- Bot added as channel administrator: done by channel owner.
- Telegram message opening inside app: already implemented.
- Secure Telegram PDF extraction client: added in `src/telegramDownload.ts`.
- Local PDF caching and Downloads/المقرر الدراسي storage: already implemented.
- Remaining required piece: deploy a secure bridge backend with the Telegram credential stored as a server secret, then configure `EXPO_PUBLIC_TELEGRAM_BRIDGE_URL` and wire the Books screen to resolve the Telegram attachment before calling the existing PDF downloader.

This avoids exposing the bot token inside the APK.