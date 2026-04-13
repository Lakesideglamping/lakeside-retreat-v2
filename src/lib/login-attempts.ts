// Shared in-memory store for failed login attempts (exponential backoff)
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function getFailedAttempt(ip: string) {
  return failedAttempts.get(ip);
}

export function deleteFailedAttempt(ip: string) {
  failedAttempts.delete(ip);
}

export function clearAllFailedAttempts() {
  failedAttempts.clear();
}

export function recordFailedAttempt(ip: string): void {
  const current = failedAttempts.get(ip);
  const count = (current?.count ?? 0) + 1;

  if (count >= 3) {
    // Exponential backoff: 1min, 2min, 4min... max 30min
    const lockMinutes = Math.min(Math.pow(2, count - 3), 30);
    failedAttempts.set(ip, {
      count,
      lockedUntil: Date.now() + lockMinutes * 60 * 1000,
    });
  } else {
    failedAttempts.set(ip, { count, lockedUntil: 0 });
  }
}
