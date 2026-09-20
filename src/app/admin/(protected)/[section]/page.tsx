import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatAdminMessage,
  getAdminDictionary,
  type AdminDictionary,
} from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { getAdminSectionRows } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/auth/server";
import { localizedPath } from "@/lib/i18n/path";
import { CsvPanel } from "./csv-panel";
import { OrderStatusForm } from "./order-status-form";
import { ResourceForm } from "./resource-form";
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
  const rows = await getAdminSectionRows(section);

  return (
    <>
      <p className="text-sm font-medium text-slate-500">{dict.section.eyebrow}</p>
      <h1 className="text-3xl font-bold">{data.title}</h1>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full border-collapse text-start">
          <caption className="sr-only">
            {formatAdminMessage(dict.section.caption, { title: data.title })}
          </caption>
          <thead className="bg-slate-50">
            <tr>
              {data.columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 text-sm">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={index} className="border-t border-slate-200">
                  {section === "products" ? (
                    <>
                      <td className="px-4 py-3">
                        <Link
                          href={localizedPath(locale, `/products/${row[5]}`)}
                          className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {row[0]}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row[1]}</td>
                      <td className="max-w-xs px-4 py-3 whitespace-pre-line">{row[2]}</td>
                      <td className="px-4 py-3">{row[3]}</td>
                      <td className="px-4 py-3">{row[4]}</td>
                    </>
                  ) : section === "orders" ? (
                    <>
                      <td className="px-4 py-3">{row[0]}</td>
                      <td className="px-4 py-3">{row[1]}</td>
                      <td className="px-4 py-3">{row[2]}</td>
                      <td className="px-4 py-3">
                        <OrderStatusForm id={row[4]} status={row[3]} />
                      </td>
                    </>
                  ) : (
                    row.map((cell) => (
                      <td key={`${index}-${cell}`} className="px-4 py-3">
                        {cell}
                      </td>
                    ))
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={data.columns.length}>
                  {dict.section.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
