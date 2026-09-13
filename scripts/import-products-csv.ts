import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseProductCsv, importProducts } from "../src/lib/import/products";
import { createPrismaProductRepository } from "../src/lib/import/prisma-products";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  const file = process.argv[2];
  if (!file) {
    throw new Error("Usage: tsx scripts/import-products-csv.ts <file.csv> [--confirm]");
  }

  const parsed = parseProductCsv(await readFile(resolve(file), "utf8"));
  console.log(`Rows: ${parsed.total}; valid: ${parsed.rows.length}; errors: ${parsed.errors.length}`);
  for (const error of parsed.errors) {
    console.error(`Row ${error.row}: ${error.issues.join("; ")}`);
  }
  if (parsed.errors.length) process.exitCode = 1;
  if (parsed.errors.length || !process.argv.includes("--confirm")) {
    console.log("Dry run only. Add --confirm to write valid rows.");
    return;
  }

  const result = await importProducts(
    parsed.rows,
    await createPrismaProductRepository(),
  );
  console.log(`Created: ${result.created}; updated: ${result.updated}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
