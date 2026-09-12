import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { loginUser } from "@/lib/users";
import { signToken, authCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = await loginUser(getDb(), body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const token = await signToken(result.user.id, result.user.username);
  return NextResponse.json(
    { user: result.user },
    { headers: { "Set-Cookie": authCookie(token) } }
  );
}