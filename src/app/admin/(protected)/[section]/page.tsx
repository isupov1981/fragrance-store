import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/server";
import { CsvPanel } from "./csv-panel";
import { ResourceForm } from "./resource-form";

const sections = {
  products: {
    title: "Товары",
    columns: ["Название", "SKU", "Цена", "Статус"],
    rows: [
      ["Santal 33", "LEL-S33-50", "$230.00", "Активен"],
      ["Baccarat Rouge 540", "MFK-BR540-70", "$325.00", "Черновик"],
    ],
    fields: [["name", "Название"], ["slug", "Slug"], ["description", "Описание"], ["sku", "SKU"], ["price", "Цена в центах"], ["stock", "Остаток"]],
  },
  categories: {
    title: "Категории",
    columns: ["Название", "Slug", "Товаров", "Статус"],
    rows: [["Нишевые", "niche", "46", "Активна"], ["Новинки", "new", "18", "Активна"]],
    fields: [["name", "Название"], ["slug", "Slug"], ["description", "Описание"]],
  },
  orders: {
    title: "Заказы",
    columns: ["Номер", "Клиент", "Сумма", "Статус"],
    rows: [["#1042", "Анна Смирнова", "$285.00", "Оплачен"], ["#1041", "Иван Петров", "$170.00", "В обработке"]],
    fields: [["number", "Номер"], ["email", "Email"], ["status", "Статус"]],
  },
  customers: {
    title: "Клиенты",
    columns: ["Имя", "Email", "Заказов", "Регистрация"],
    rows: [["Анна Смирнова", "anna@example.test", "4", "12.09.2026"], ["Иван Петров", "ivan@example.test", "2", "08.09.2026"]],
    fields: [["name", "Имя"], ["email", "Email"], ["phone", "Телефон"]],
  },
  content: {
    title: "Контент",
    columns: ["Заголовок", "Slug", "Обновлено", "Статус"],
    rows: [["О нас", "about", "10.09.2026", "Опубликовано"], ["Доставка", "shipping", "01.09.2026", "Черновик"]],
    fields: [["title", "Заголовок"], ["slug", "Slug"], ["content", "Содержимое"]],
  },
  shipping: {
    title: "Доставка",
    columns: ["Название", "Код", "Цена", "Статус"],
    rows: [["Стандартная", "standard", "$12.00", "Активна"], ["Экспресс", "express", "$25.00", "Активна"]],
    fields: [["name", "Название"], ["code", "Код"], ["description", "Описание"], ["price", "Цена в центах"]],
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

  return (
    <>
      <p className="text-sm font-medium text-slate-500">Демонстрационный список</p>
      <h1 className="text-3xl font-bold">{data.title}</h1>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{data.title}: демонстрационные записи</caption>
          <thead className="bg-slate-50">
            <tr>{data.columns.map((column) => <th key={column} scope="col" className="px-4 py-3 text-sm">{column}</th>)}</tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={index} className="border-t border-slate-200">
                {row.map((cell) => <td key={cell} className="px-4 py-3">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="mt-8 rounded-xl bg-white p-5 shadow-sm" aria-labelledby="editor-heading">
        <h2 id="editor-heading" className="text-xl font-semibold">Форма редактора</h2>
        <p className="mb-4 text-sm text-slate-600">Записи сохраняются через защищённый API и проверяются на сервере.</p>
        <ResourceForm section={section} fields={data.fields} />
      </section>
      {section === "products" ? <CsvPanel /> : null}
    </>
  );
}
