import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function POST(request: Request) {
  const { password, recoveryCode, action } = await request.json();

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const deviceToken = cookieStore.get("deviceToken")?.value;

    const endpoint = action === 'create' ? '/auth/create-safe' : '/auth/unlock';
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, deviceToken, recoveryCode })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Authentication failed" }, { status: res.status });
    }

    if (data.deviceToken) {
      // Explicitly set the deviceToken as an httpOnly, Secure, SameSite=Strict cookie
      cookieStore.set("deviceToken", data.deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }

    const session = await getSession();
    session.isLoggedIn = true;
    session.token = data.token;
    session.safeId = data.safeId;
    if (data.remainingRecoveryCodes !== undefined) {
      session.remainingRecoveryCodes = data.remainingRecoveryCodes;
    }
    if (data.usedRecoveryCode) {
      session.usedRecoveryCode = true;
    }
    await session.save();

    return NextResponse.json({ 
      success: true, 
      recoveryCodes: data.recoveryCodes || undefined,
      usedRecoveryCode: data.usedRecoveryCode || false
    });
  } catch (err) {
    console.error("Frontend Auth Error:", err);
    return NextResponse.json({ error: "Server connection failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ success: true });
}
