import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getLeaderboardRows, submitScore } from "@/lib/leaderboard";

export async function GET() {
  const db = await ensureDb();
  const entries = await getLeaderboardRows(db);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const db = await ensureDb();
  const result = await submitScore(db, user.userId, user.username, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}