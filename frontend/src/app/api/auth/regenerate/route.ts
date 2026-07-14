import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/auth/regenerate-recovery-codes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Failed to regenerate codes" }, { status: res.status });
    }

    // Reset the remaining codes count in session
    session.remainingRecoveryCodes = 10;
    await session.save();

    return NextResponse.json({ success: true, recoveryCodes: data.recoveryCodes });
  } catch (err) {
    console.error("Frontend Auth Regenerate Error:", err);
    return NextResponse.json({ error: "Server connection failed" }, { status: 500 });
  }
}
