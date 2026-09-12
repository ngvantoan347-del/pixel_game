import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  return NextResponse.json({ user: { id: user.userId, username: user.username } });
}