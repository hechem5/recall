import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function POST(request: Request) {
  const { password, deviceId, action } = await request.json();

  if (!password || !deviceId) {
    return NextResponse.json({ error: "Password and Device ID are required" }, { status: 400 });
  }

  try {
    const endpoint = action === 'create' ? '/auth/create-safe' : '/auth/unlock';
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, deviceId })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Authentication failed" }, { status: res.status });
    }

    const session = await getSession();
    session.isLoggedIn = true;
    session.token = data.token;
    session.safeId = data.safeId;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server connection failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ success: true });
}
