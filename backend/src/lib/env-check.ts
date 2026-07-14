export function checkEnv() {
  const hardMissing: string[] = [];
  const softMissing: string[] = [];

  // 1. Hard requirements
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    hardMissing.push("SESSION_SECRET (must be set, min 32 characters)");
  } else if (sessionSecret.length < 32) {
    hardMissing.push("SESSION_SECRET (must be at least 32 characters)");
  }

  if (!process.env.DATABASE_URL) {
    hardMissing.push("DATABASE_URL (must be set to a valid Postgres connection string)");
  }

  if (!process.env.CRON_SECRET) {
    hardMissing.push("CRON_SECRET (must be set to authorize scheduled jobs)");
  }

  if (!process.env.ALLOWED_ORIGINS) {
    hardMissing.push("ALLOWED_ORIGINS (must be set to authorize CORS requests)");
  }

  if (!process.env.OPENROUTER_API_KEY) {
    hardMissing.push("OPENROUTER_API_KEY (must be set for AI digest generation)");
  }

  // 2. Soft requirements / graceful degradation
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    softMissing.push("SUPABASE_URL / SUPABASE_SERVICE_KEY (file uploads will use local disk storage instead of permanent cloud storage)");
  }

  // 3. Evaluate and output
  if (hardMissing.length > 0) {
    console.error("\n\x1b[31m✗ Server cannot start — missing required environment variables:\x1b[0m");
    hardMissing.forEach(msg => console.error(`  - ${msg}`));
    console.error(""); // Newline
    process.exit(1);
  }

  if (softMissing.length > 0) {
    console.warn("\n\x1b[33m⚠ Running in degraded mode — missing optional environment variables:\x1b[0m");
    softMissing.forEach(msg => console.warn(`  - ${msg}`));
    console.warn(""); // Newline
  }
}
