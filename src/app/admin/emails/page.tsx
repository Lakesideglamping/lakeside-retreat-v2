import Link from "next/link";
import { emailPreviews, sampleBooking } from "@/lib/email-previews";
import { TestSendButton } from "@/components/admin/emails/test-send-button";

type PageProps = { searchParams: Promise<{ template?: string }> };

export default async function AdminEmailsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedId = params.template ?? emailPreviews[0].id;
  const selected = emailPreviews.find((t) => t.id === selectedId) ?? emailPreviews[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-gray-900">
          Email Templates
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Every email the system sends, rendered with sample data. To change
          wording, tell your developer which template and what to change.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Template list */}
        <aside className="rounded-xl border border-gray-200 bg-white p-3">
          <ul className="space-y-1">
            {emailPreviews.map((t) => {
              const active = t.id === selected.id;
              return (
                <li key={t.id}>
                  <Link
                    href={`/admin/emails?template=${t.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-[#2d5a5a] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Preview panel */}
        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {selected.label}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{selected.description}</p>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  When it sends
                </dt>
                <dd className="text-gray-800">{selected.whenSent}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  Sample recipient
                </dt>
                <dd className="text-gray-800">{sampleBooking.guest_email}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <TestSendButton templateId={selected.id} />
              <p className="mt-2 text-xs text-gray-500">
                Sends this template to your own address, so you can see how it
                renders in a real mail client. Subject is prefixed [TEST].
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
              <span>Preview</span>
              <span className="text-gray-400">Rendered with sample booking</span>
            </div>
            <iframe
              title={`${selected.label} preview`}
              srcDoc={selected.html()}
              className="h-[800px] w-full border-0 bg-white"
              sandbox=""
            />
          </div>
        </section>
      </div>
    </div>
  );
}
