import { notFound } from "next/navigation";
import { getAdminSectionRows } from "@/lib/admin/queries";
import { requireAdminPage } from "@/lib/auth/server";
import { CsvPanel } from "./csv-panel";
import { OrderStatusForm } from "./order-status-form";
import { ResourceForm } from "./resource-form";
import { UploadPanel } from "./upload-panel";

const sections = {
  products: {
    title: "Товары",
    columns: ["Название", "SKU", "Цена", "Статус"],
    fields: [["name", "Название"], ["slug", "Slug"], ["description", "Описание"], ["sku", "SKU"], ["price", "Цена в агоротах (ILS)"], ["stock", "Остаток"], ["imageUrl", "URL изображения"]],
  },
  categories: {
    title: "Категории",
    columns: ["Название", "Slug", "Товаров", "Статус"],
    fields: [["name", "Название"], ["slug", "Slug"], ["description", "Описание"]],
  },
  brands: {
    title: "Бренды",
    columns: ["Название", "Slug", "Описание", "Статус"],
    fields: [["name", "Название"], ["slug", "Slug"], ["description", "Описание"]],
  },
  orders: {
    title: "Заказы",
    columns: ["Номер", "Клиент", "Сумма", "Статус"],
    fields: [["number", "Номер"], ["email", "Email"], ["status", "Статус"]],
  },
  customers: {
    title: "Клиенты",
    columns: ["Имя", "Email", "Заказов", "Регистрация"],
    fields: [["name", "Имя"], ["email", "Email"], ["phone", "Телефон"]],
  },
  content: {
    title: "Контент",
    columns: ["Заголовок", "Slug", "Обновлено", "Статус"],
    fields: [["title", "Заголовок"], ["slug", "Slug"], ["content", "Содержимое"]],
  },
  shipping: {
    title: "Доставка",
    columns: ["Название", "Код", "Цена", "Статус"],
    fields: [["name", "Название"], ["code", "Код"], ["description", "Описание"], ["price", "Цена в агоротах (ILS)"]],
  },
} as const;

type Section = keyof typeof sections;

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdminPage();
  const { section } = await params;
  if (!(section in sections)) notFound();
  const data = sections[section as Section];
  const rows = await getAdminSectionRows(section);

  return (
    <>
      <p className="text-sm font-medium text-slate-500">Записи из PostgreSQL</p>
      <h1 className="text-3xl font-bold">{data.title}</h1>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{data.title}: записи из базы данных</caption>
          <thead className="bg-slate-50">
            <tr>{data.columns.map((column) => <th key={column} scope="col" className="px-4 py-3 text-sm">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} className="border-t border-slate-200">
                {section === "orders" ? (
                  <>
                    <td className="px-4 py-3">{row[0]}</td>
                    <td className="px-4 py-3">{row[1]}</td>
                    <td className="px-4 py-3">{row[2]}</td>
                    <td className="px-4 py-3"><OrderStatusForm id={row[4]} status={row[3]} /></td>
                  </>
                ) : row.map((cell) => <td key={`${index}-${cell}`} className="px-4 py-3">{cell}</td>)}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={data.columns.length}>
                  Пока нет записей.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <section className="mt-8 rounded-xl bg-white p-5 shadow-sm" aria-labelledby="editor-heading">
        <h2 id="editor-heading" className="text-xl font-semibold">Форма редактора</h2>
        <p className="mb-4 text-sm text-slate-600">Записи сохраняются через защищённый API и проверяются на сервере.</p>
        <ResourceForm section={section} fields={data.fields} />
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
