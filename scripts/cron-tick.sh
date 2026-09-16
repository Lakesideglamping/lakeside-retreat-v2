#!/usr/bin/env bash
# Single hourly cron tick. Dispatches to the right /api/cron/* routes based on
# UTC hour so we don't need three separate Render cron services.
#
# NZ Standard Time is UTC+12 (NZDT is UTC+13). We pick UTC slots that land at
# reasonable NZ hours year-round:
#   20:00 UTC  -> 08:00 NZST / 09:00 NZDT  -> pre-arrival
#   22:00 UTC  -> 10:00 NZST / 11:00 NZDT  -> review-request (+ thank-you)
#   03:00 UTC  -> 15:00 NZST / 16:00 NZDT  -> reconcile-calendar
#
# during-stay was removed. It fired at 00:00 UTC, which is midday in Cromwell
# on the arrival day — three hours before the 3pm check-in — while telling the
# guest "we hope you've settled in" and "enjoy your evening". It had also never
# sent a single email.
#
# No single UTC hour is 08:00 in NZ all year, because the offset moves between
# +12 and +13. 20:00 UTC is 08:00 in winter and 09:00 in summer; the
# alternative, 19:00 UTC, would be 07:00 in winter. Landing slightly later in
# summer is the better miss of the two.
#
# Pre-arrival is sent three days before check-in — see PRE_ARRIVAL_LEAD_DAYS
# in lib/marketing-automation.ts. That constant and this slot decide between
# them when a guest hears from us, so the email's wording must match both.
# retry-uplisting-sync runs every tick — it is idempotent and time-sensitive,
# since an unsynced booking is a double-booking risk until it lands.
#
# abandoned-checkout is deliberately absent. Nothing records an abandoned
# checkout: booking rows are only written after payment succeeds, and the
# webhook does not handle checkout.session.expired. The job fell back to
# querying payment_status = 'pending', which in practice only ever matches
# manual bookings paid offline — so it emailed a guest whose stay had
# finished five months earlier. Restoring it needs that expired-session
# handler first.

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

call /api/cron/retry-uplisting-sync

case "$hour" in
  20) call /api/cron/pre-arrival ;;
  22) call /api/cron/review-request ;;
  # Read-only Uplisting reachability check — it fetches blocked dates and
  # logs the counts, writing nothing. Its value is the CRON_FAILURE alert
  # when Uplisting is unreachable, so once a day is plenty.
  03) call /api/cron/reconcile-calendar ;;
esac

echo "Cron tick complete"
