const TON_BOT_BASE_URL =
  process.env.TON_BOT_BASE_URL ?? "https://ton-bot-eight.vercel.app";

export const TON_BOT_VISITOR_URL = `${TON_BOT_BASE_URL}/api/t1/font`;
export const TON_BOT_SEED_URL = `${TON_BOT_BASE_URL}/api/t1/image`;

export function getTonBotSecretKey(): string {
  const key = process.env.SECRET_KEY;
  if (!key) {
    throw new Error("SECRET_KEY is not configured");
  }
  return key;
}

export async function proxyPostToTonBot(
  upstreamUrl: string,
  body: unknown
): Promise<Response> {
  return fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getTonBotSecretKey(),
    },
    body: JSON.stringify(body),
  });
}
