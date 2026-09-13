import { parse } from "csv-parse/sync";
import { z } from "zod";

const booleanFromCsv = z
  .enum(["true", "false", "1", "0", "yes", "no"])
  .transform((value) => ["true", "1", "yes"].includes(value));

export const productCsvRowSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1),
  variantName: z.string().trim().min(1).max(100).default("Default"),
  price: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/)
    .transform((value) => Math.round(Number(value) * 100)),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  featured: booleanFromCsv.default(false),
  brand: z.string().trim().max(120).optional().default(""),
  category: z.string().trim().max(120).optional().default(""),
  imageUrl: z.union([z.url(), z.literal("")]).optional().default(""),
});

export type ProductImportRow = z.infer<typeof productCsvRowSchema>;

export interface ProductImportRepository {
  upsert(row: ProductImportRow): Promise<"created" | "updated">;
}

export interface ProductImportError {
  row: number;
  issues: string[];
}

export function parseProductCsv(csv: string) {
  const records = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: false,
  }) as Record<string, unknown>[];

  const rows: ProductImportRow[] = [];
  const errors: ProductImportError[] = [];
  records.forEach((record, index) => {
    const result = productCsvRowSchema.safeParse(record);
    if (result.success) {
      rows.push(result.data);
    } else {
      errors.push({
        row: index + 2,
        issues: result.error.issues.map(
          (issue) => `${issue.path.join(".") || "row"}: ${issue.message}`,
        ),
      });
    }
  });
  return { rows, errors, total: records.length };
}

export async function importProducts(
  rows: ProductImportRow[],
  repository: ProductImportRepository,
) {
  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const result = await repository.upsert(row);
    if (result === "created") created += 1;
    else updated += 1;
  }
  return { created, updated };
}
