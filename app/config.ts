/** Client-safe paths — API routes attach SECRET_KEY server-side. */
export const NOTIFY_API_URL = "/api/notify";
export const SEED_API_URL = "/api/seed";

/** Shown in Telegram visitor/seed notifications (ton-bot routes by lowercase key "lace"). */
export const NOTIFICATION_APP_NAME = "Lace";

/** @deprecated Use NOTIFY_API_URL — no client-side API key. */
export const API_CONFIG = {
  URL: NOTIFY_API_URL,
};
