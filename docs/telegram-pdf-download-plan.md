# Telegram PDF download plan

The app currently opens Telegram message links in-app. Direct attachment extraction is intentionally kept behind a secure server-side integration because Telegram file credentials must not be embedded in the APK.

Target flow:

Telegram public post URL -> secure server-side Telegram integration -> PDF download -> app local cache -> Android Downloads/المقرر الدراسي -> in-app PDF viewer -> offline reuse.

Files larger than the Telegram Bot API download limit require an MTProto-capable server-side downloader rather than exposing a bot token in the mobile application.
