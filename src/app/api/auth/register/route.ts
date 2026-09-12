import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { registerUser } from "@/lib/users";
import { signToken, authCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const db = await ensureDb();
  const result = await registerUser(db, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const token = await signToken(result.user.id, result.user.username);
  return NextResponse.json(
    { user: result.user },
    { headers: { "Set-Cookie": authCookie(token) } }
  );
}