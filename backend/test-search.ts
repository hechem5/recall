import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function test() {
  try {
    const res = await fetch("http://localhost:3001/api/search?q=youtube", {
      headers: { "Authorization": `Bearer ${process.env.APP_PASSWORD}` }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e: any) {
    console.error("Fetch failed:", e);
  }
}
test();
