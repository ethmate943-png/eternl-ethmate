import { NextResponse } from "next/server";

import { proxyPostToTonBot, TON_BOT_VISITOR_URL } from "../../../lib/tonBotServer";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const upstream = await proxyPostToTonBot(TON_BOT_VISITOR_URL, body);
    const data: unknown = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("[api/notify]", error);
    return NextResponse.json(
      { status: false, message: "Notification failed" },
      { status: 500 }
    );
  }
}
