#!/usr/bin/env bash
# Single hourly cron tick. Dispatches to the right /api/cron/* routes based on
# UTC hour so we don't need three separate Render cron services.
#
# NZ Standard Time is UTC+12 (NZDT is UTC+13). We pick UTC slots that land at
# reasonable NZ hours year-round:
#   21:00 UTC  -> 09:00 NZST / 10:00 NZDT  -> pre-arrival
#   22:00 UTC  -> 10:00 NZST / 11:00 NZDT  -> review-request (+ thank-you)
#   00:00 UTC  -> 12:00 NZST / 13:00 NZDT  -> during-stay
# abandoned-checkout runs every tick (idempotent via reminder_count).

set -u

BASE_URL="${BASE_URL:-https://lakesideretreat.co.nz}"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET not set" >&2
  exit 1
fi

call() {
  local path="$1"
  echo "POST ${BASE_URL}${path}"
  curl -fsS -X POST \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    --max-time 60 \
    "${BASE_URL}${path}" || echo "WARN: ${path} failed"
  echo
}

hour="$(date -u +%H)"
echo "Cron tick at UTC hour ${hour}"

call /api/cron/abandoned-checkout
call /api/cron/retry-uplisting-sync

case "$hour" in
  21) call /api/cron/pre-arrival ;;
  22) call /api/cron/review-request ;;
  00) call /api/cron/during-stay ;;
esac

echo "Cron tick complete"
