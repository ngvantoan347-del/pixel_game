import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getLeaderboardRows, submitScore } from "@/lib/leaderboard";

export async function GET() {
  const entries = await getLeaderboardRows(getDb());
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const result = await submitScore(getDb(), user.userId, user.username, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}