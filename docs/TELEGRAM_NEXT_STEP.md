# Telegram PDF extraction next step

The app-side bridge is now prepared in `src/telegramDownload.ts`.

Set `EXPO_PUBLIC_TELEGRAM_BRIDGE_URL` to a secure HTTPS backend endpoint. The endpoint accepts `{ messageUrl }` and returns `{ downloadUrl }`. The Telegram token must remain server-side.

After the bridge is deployed, the Books screen can resolve a Telegram message to its attached PDF and pass that URL into the existing PDF cache/download flow.