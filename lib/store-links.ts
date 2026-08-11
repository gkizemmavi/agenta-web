export const STORE_LINKS = {
  appStore:
    process.env.NEXT_PUBLIC_APP_STORE_URL ||
    "https://apps.apple.com/tr/app/agenta/id6792955602",
  playStore:
    process.env.NEXT_PUBLIC_PLAY_STORE_URL ||
    "https://play.google.com/store/apps/details?id=com.agenta.agenta",
} as const;
