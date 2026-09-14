import { describe, expect, it } from "vitest";
import { buildDailyBriefing } from "@/lib/agent/reports";

describe("buildDailyBriefing", () => {
  it("summarises orders, drafts and restock actions", () => {
    const text = buildDailyBriefing(
      {
        generatedAt: "2026-09-14T08:00:00.000Z",
        windowHours: 24,
        orders: { count: 3, revenueIls: 21900, byStatus: { PAID: 2 }, recent: [] },
        customers: { new: 1 },
        catalog: { products: 7, drafts: 2, draftsWithoutImages: [], lowStock: [] },
      },
      {
        generatedAt: "2026-09-14T08:00:00.000Z",
        publish: [{ slug: "new-oud", name: "New Oud" }],
        restock: [{ sku: "FS-ND-1", product: "Notre-Dame", variant: "1 ml", stock: 2 }],
        topSellers: [{ sku: "FS-ND-5", name: "Notre-Dame 5 ml", quantity: 4, total: 47600 }],
        missingPhotos: [],
        emptyCategories: [],
        incompleteDrafts: [],
      },
    );
    expect(text).toContain("Orders (24h): 3");
    expect(text).toContain("Ready to publish: New Oud");
    expect(text).toContain("Notre-Dame 1 ml (2)");
  });
});
