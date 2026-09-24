import { notFound } from "next/navigation";

import type { AdminTableRow } from "@/components/admin/admin-filterable-table";
import {
  formatAdminMessage,
  getAdminDictionary,
  type AdminDictionary,
} from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { getAdminSectionRows } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/auth/server";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import { CsvPanel } from "./csv-panel";
import { ResourceForm } from "./resource-form";
import { AdminSectionTable } from "./section-table";
import { UploadPanel } from "./upload-panel";

const sectionFieldKeys = {
  products: ["name", "slug", "description", "sku", "price", "stock", "imageUrl", "newArrival"],
  categories: ["name", "slug", "description"],
  brands: ["name", "slug", "description"],
  orders: ["number", "email", "status"],
  customers: ["name", "email", "phone"],
  content: ["title", "slug", "content"],
  shipping: ["name", "code", "description", "price"],
} as const;

type Section = keyof typeof sectionFieldKeys;

function sectionFields(dict: AdminDictionary, section: Section) {
  const labels = dict.sections[section].fields as Record<string, string>;
  return sectionFieldKeys[section].map((key) => [key, labels[key]] as const);
}

function toTableRows(section: Section, rows: string[][], locale: Locale): AdminTableRow[] {
  if (section === "products") {
    return rows.map((row) => ({
      cells: row.slice(0, 6),
      href: localizedPath(locale, `/products/${row[6]}`),
      key: row[6],
    }));
  }
  if (section === "orders") {
    return rows.map((row) => ({
      cells: row.slice(0, 4),
      key: row[4],
    }));
  }
  return rows.map((row, index) => ({
    cells: row,
    key: `${row[0]}-${row[1] ?? index}`,
  }));
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdminPage();
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const { section } = await params;
  if (!(section in sectionFieldKeys)) notFound();
  const key = section as Section;
  const data = dict.sections[key];
  const fields = sectionFields(dict, key);
  const rawRows = await getAdminSectionRows(section);
  const tableRows = toTableRows(key, rawRows, locale);

  return (
    <>
      <p className="text-sm font-medium text-slate-500">{dict.section.eyebrow}</p>
      <h1 className="text-3xl font-bold">{data.title}</h1>
      <AdminSectionTable
        section={key}
        caption={formatAdminMessage(dict.section.caption, { title: data.title })}
        columns={[...data.columns]}
        rows={tableRows}
        empty={dict.section.empty}
        filterPlaceholder={dict.section.filterPlaceholder}
        clearFilters={dict.section.clearFilters}
        resultsLabel={dict.section.results}
      />
      <section className="mt-8 rounded-xl bg-white p-5 shadow-sm" aria-labelledby="editor-heading">
        <h2 id="editor-heading" className="text-xl font-semibold">
          {dict.section.editorTitle}
        </h2>
        <p className="mb-4 text-sm text-slate-600">{dict.section.editorHelp}</p>
        <ResourceForm section={section} fields={fields} />
      </section>
      {section === "products" ? (
        <>
          <UploadPanel />
          <CsvPanel />
        </>
      ) : null}
    </>
  );
}
