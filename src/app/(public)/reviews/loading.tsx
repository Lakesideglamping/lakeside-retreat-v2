export default function ReviewsLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="relative min-h-[50vh] flex items-center justify-center text-center bg-gray-300 animate-pulse">
        <div className="pt-20 px-5">
          <div className="h-12 bg-gray-400/40 rounded-xl w-64 mx-auto mb-4" />
          <div className="h-6 bg-gray-400/30 rounded-lg w-80 mx-auto" />
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded-lg w-20 mx-auto mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24 mx-auto mb-1" />
              <div className="h-3 bg-gray-100 rounded w-20 mx-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* Reviews grid skeleton */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="h-10 bg-gray-200 rounded-xl w-64 mx-auto mb-4 animate-pulse" />
          <div className="h-5 bg-gray-100 rounded w-96 mx-auto mb-8 animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-16" />
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
