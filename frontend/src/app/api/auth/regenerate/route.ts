import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const backendUrl = `${BACKEND_URL}/auth/regenerate-recovery-codes`;
    
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${session.token}`);

    const res = await fetch(backendUrl, {
      method: "POST",
      headers,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Backend did not return JSON. Status: ${res.status}, Body: ${text.substring(0, 50)}`);
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[Regenerate Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
