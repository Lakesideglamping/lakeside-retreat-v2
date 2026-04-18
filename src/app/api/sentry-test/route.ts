export async function GET() {
  throw new Error("Sentry test error — safe to ignore, confirms error tracking is live");
}
