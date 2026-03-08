import { prisma } from "@/lib/db";
import { PricingContent } from "@/components/admin/pricing/pricing-content";

export default async function PricingPage() {
  const [rates, settings] = await Promise.all([
    prisma.seasonal_rates.findMany({
      orderBy: { start_date: "asc" },
    }),
    prisma.system_settings.findMany({
      where: {
        setting_key: {
          in: [
            "pricing_dome_pinot_base",
            "pricing_dome_pinot_weekend",
            "pricing_dome_pinot_cleaning",
            "pricing_dome_pinot_min_nights",
            "pricing_dome_rose_base",
            "pricing_dome_rose_weekend",
            "pricing_dome_rose_cleaning",
            "pricing_dome_rose_min_nights",
            "pricing_lakeside_cottage_base",
            "pricing_lakeside_cottage_weekend",
            "pricing_lakeside_cottage_cleaning",
            "pricing_lakeside_cottage_min_nights",
          ],
        },
      },
    }),
  ]);

  const serializedRates = rates.map((r) => ({
    id: r.id,
    name: r.name,
    start_date: r.start_date.toISOString().split("T")[0],
    end_date: r.end_date.toISOString().split("T")[0],
    multiplier: Number(r.multiplier),
    is_active: r.is_active ?? true,
  }));

  const pricingSettings: Record<string, string> = {};
  for (const s of settings) {
    pricingSettings[s.setting_key] = s.setting_value ?? "";
  }

  return (
    <PricingContent
      initialRates={serializedRates}
      initialSettings={pricingSettings}
    />
  );
}
