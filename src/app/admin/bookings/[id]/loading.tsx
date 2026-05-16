/**
 * Booking-detail skeleton — shown while /admin/bookings/[id] data loads.
 * Tighter shape than the admin-root skeleton (which mimics a table view),
 * so a slow detail-page load doesn't flash the wrong context.
 */
export default function BookingDetailLoading() {
  return (
    <div className="flex-1 p-6 md:p-8 animate-pulse">
      {/* Back link + title */}
      <div className="h-4 w-32 bg-slate-100 rounded mb-4" />
      <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-48 bg-slate-100 rounded mb-8" />

      {/* Two-column detail layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-40 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Side panel — status + actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-10 w-full bg-slate-100 rounded-lg" />
          <div className="h-10 w-full bg-slate-100 rounded-lg" />
          <div className="h-10 w-full bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
