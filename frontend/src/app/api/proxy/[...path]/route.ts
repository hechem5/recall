import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_URL}/api/${resolvedParams.path.join("/")}${url.search}`;

    console.log(`[Proxy GET] Fetching ${backendUrl}`);
    const res = await fetch(backendUrl, {
      headers: { "Authorization": `Bearer ${session.token}` }
    });
    
    // Create new headers to pass back the content type and length
    const responseHeaders = new Headers(res.headers);
    
    // Instead of forcing JSON parse, just stream the raw body back
    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("[Proxy GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const backendUrl = `${BACKEND_URL}/api/${resolvedParams.path.join("/")}`;
    
    // Copy headers and add Authorization
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${session.token}`);
    
    // Remove host header to prevent backend confusion
    headers.delete("host");

    console.log(`[Proxy POST] Buffering raw request into ArrayBuffer...`);
    const arrayBuffer = await request.arrayBuffer();

    console.log(`[Proxy POST] Forwarding ${arrayBuffer.byteLength} bytes to ${backendUrl}`);
    const res = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: arrayBuffer,
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
    console.error("[Proxy POST Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
