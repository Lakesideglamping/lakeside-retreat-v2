import { prisma } from "@/lib/db";
import { PricingContent } from "@/components/admin/pricing/pricing-content";

export default async function PricingPage() {
  const rates = await prisma.seasonal_rates.findMany({
    orderBy: { start_date: "asc" },
  });

  const serializedRates = rates.map((r) => ({
    id: r.id,
    name: r.name,
    start_date: r.start_date.toISOString().split("T")[0],
    end_date: r.end_date.toISOString().split("T")[0],
    multiplier: Number(r.multiplier),
    is_active: r.is_active ?? true,
  }));

  return <PricingContent initialRates={serializedRates} />;
}
