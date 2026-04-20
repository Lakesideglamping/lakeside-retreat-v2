/**
 * Admin skeleton loader — shown by Next.js while any admin page is loading.
 * Applies to all /admin/* routes unless a more specific loading.tsx exists.
 * Mirrors the admin shell layout (sidebar + main content area) so there's
 * no layout shift when the real page arrives.
 */
export default function AdminLoading() {
  return (
    <div className="flex-1 p-6 md:p-8 animate-pulse">
      {/* Page title placeholder */}
      <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-72 bg-slate-100 rounded mb-8" />

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-24" />
        ))}
      </div>

      {/* Content panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-9 w-48 bg-slate-100 rounded-lg" />
          <div className="h-9 w-28 bg-slate-100 rounded-lg ml-auto" />
        </div>
        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-0"
          >
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded ml-auto" />
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
