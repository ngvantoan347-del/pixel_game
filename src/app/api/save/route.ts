import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { clampSave, DEFAULT_SAVE, getSaveRow, putSaveRow } from "@/lib/saves";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const save = (await getSaveRow(getDb(), user.userId)) ?? DEFAULT_SAVE;
  return NextResponse.json({ save });
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const result = clampSave(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  await putSaveRow(getDb(), user.userId, result.save);
  return NextResponse.json({ save: result.save });
}