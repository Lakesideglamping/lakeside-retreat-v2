import * as Sentry from "@sentry/nextjs";
import { scrub } from "@/lib/logger";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    enabled: process.env.NODE_ENV === "production",
    beforeSend(event) {
      return scrub(event) as typeof event;
    },
    beforeBreadcrumb(breadcrumb) {
      return scrub(breadcrumb) as typeof breadcrumb;
    },
  });
}
