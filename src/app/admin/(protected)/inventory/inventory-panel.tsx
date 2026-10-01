"use client";

import { useCallback, useMemo, useState } from "react";

import {
  AdminFilterableTable,
  type AdminTableRow,
} from "@/components/admin/admin-filterable-table";
import type { AdminDictionary } from "@/lib/admin/i18n";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";

type Variant = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productStatus: string;
  brand: string;
  name: string;
  sku: string;
  stock: number;
  updatedAt: string;
};

type Movement = {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  delta: number;
  reason: string;
  actorName: string | null;
  note: string | null;
  createdAt: string;
};

type InventoryData = {
  variants: Variant[];
  movements: Movement[];
  summary: {
    totalUnits: number;
    lowStock: number;
    outOfStock: number;
    activeReservations: number;
  };
};

type Filter = "all" | "low" | "out";
type BulkMode = "add" | "subtract" | "set";

export function InventoryPanel({
  initialData,
  labels,
  tableLabels,
  locale,
}: {
  initialData: InventoryData;
  labels: AdminDictionary["inventory"];
  tableLabels: AdminDictionary["section"];
  locale: Locale;
}) {
  const [data, setData] = useState(initialData);
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialData.variants.map((variant) => [variant.id, variant.stock])),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [bulkMode, setBulkMode] = useState<BulkMode>("add");
  const [bulkAmount, setBulkAmount] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  const [visibleIds, setVisibleIds] = useState<string[]>([]);

  const variantsById = useMemo(
    () => new Map(data.variants.map((variant) => [variant.id, variant])),
    [data.variants],
  );

  const rows = useMemo<AdminTableRow[]>(() => {
    const needle = query.trim().toLowerCase();
    return data.variants
      .filter((variant) => {
        if (filter === "low" && !(variant.stock > 0 && variant.stock <= 5)) return false;
        if (filter === "out" && variant.stock !== 0) return false;
        return (
          !needle ||
          `${variant.productName} ${variant.brand} ${variant.name} ${variant.sku}`
            .toLowerCase()
            .includes(needle)
        );
      })
      .map((variant) => ({
        key: variant.id,
        href: localizedPath(locale, `/products/${variant.productSlug}`),
        cells: [
          variant.productName,
          variant.brand || "—",
          variant.productStatus,
          variant.name,
          variant.sku,
          String(variant.stock),
        ],
      }));
  }, [data.variants, filter, locale, query]);

  const onVisibleRowsChange = useCallback((visible: AdminTableRow[]) => {
    setVisibleIds(visible.flatMap((row) => (row.key ? [row.key] : [])));
  }, []);

  const dirty = data.variants.filter(
    (variant) => values[variant.id] !== variant.stock,
  );

  function setStock(id: string, stock: number) {
    setValues((current) => ({ ...current, [id]: Math.max(0, stock) }));
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulk() {
    setValues((current) => {
      const next = { ...current };
      for (const id of selected) {
        const old = next[id] ?? 0;
        next[id] =
          bulkMode === "set"
            ? Math.max(0, bulkAmount)
            : Math.max(0, old + (bulkMode === "add" ? bulkAmount : -bulkAmount));
      }
      return next;
    });
  }

  async function reload() {
    const response = await fetch("/api/admin/inventory", { cache: "no-store" });
    if (!response.ok) return;
    const result = (await response.json()) as { data: InventoryData };
    setData(result.data);
    setValues(
      Object.fromEntries(result.data.variants.map((variant) => [variant.id, variant.stock])),
    );
    setSelected(new Set());
  }

  async function save() {
    if (!dirty.length) return;
    setSaving(true);
    setMessage(undefined);
    const response = await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        changes: dirty.map((variant) => ({
          variantId: variant.id,
          mode: "set",
          value: values[variant.id],
          expectedUpdatedAt: variant.updatedAt,
        })),
        note: note.trim() || undefined,
      }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(response.status === 409 ? labels.conflict : result.error ?? labels.failed);
      if (response.status === 409) await reload();
      return;
    }
    await reload();
    setNote("");
    setMessage(labels.saved);
  }

  const summary = [
    [labels.totalUnits, data.summary.totalUnits],
    [labels.lowStock, data.summary.lowStock],
    [labels.outOfStock, data.summary.outOfStock],
    [labels.activeReservations, data.summary.activeReservations],
  ] as const;

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1 text-sm font-medium">
            <span className="sr-only">{labels.search}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="flex rounded-lg border border-slate-300 p-1">
            {(["all", "low", "out"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  filter === value ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                }`}
              >
                {labels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3">
          <p className="self-center text-sm font-medium">
            {labels.selected.replace("{count}", String(selected.size))}
          </p>
          <button
            type="button"
            disabled={!visibleIds.length}
            onClick={() => setSelected(new Set(visibleIds))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          >
            {labels.selectVisible.replace("{count}", String(visibleIds.length))}
          </button>
          <button
            type="button"
            disabled={!selected.size}
            onClick={() => setSelected(new Set())}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          >
            {labels.clearSelection}
          </button>
          <select
            value={bulkMode}
            onChange={(event) => setBulkMode(event.target.value as BulkMode)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="add">{labels.add}</option>
            <option value="subtract">{labels.subtract}</option>
            <option value="set">{labels.set}</option>
          </select>
          <label className="text-sm">
            <span className="mb-1 block">{labels.amount}</span>
            <input
              type="number"
              min={0}
              value={bulkAmount}
              onChange={(event) => setBulkAmount(Math.max(0, Number(event.target.value)))}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={!selected.size}
            onClick={applyBulk}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {labels.apply}
          </button>
        </div>

        <AdminFilterableTable
          caption={labels.caption}
          columns={[
            labels.product,
            labels.brand,
            labels.status,
            labels.variant,
            labels.sku,
            labels.stock,
          ]}
          rows={rows}
          empty={labels.empty}
          filterColumn={tableLabels.filterColumn}
          selectAll={tableLabels.selectAll}
          searchValues={tableLabels.searchValues}
          clearFilters={tableLabels.clearFilters}
          resultsLabel={(visible, total) =>
            tableLabels.results
              .replace("{visible}", String(visible))
              .replace("{total}", String(total))
          }
          onVisibleRowsChange={onVisibleRowsChange}
          renderCell={({ row, cell, columnIndex }) => {
            const variant = row.key ? variantsById.get(row.key) : undefined;
            if (!variant) return undefined;
            if (columnIndex === 3) {
              return (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(variant.id)}
                    onChange={() => toggleSelected(variant.id)}
                    aria-label={`${variant.productName} ${variant.name}`}
                  />
                  <span className="font-medium">{cell}</span>
                </label>
              );
            }
            if (columnIndex !== 5) return undefined;
            const stock = values[variant.id] ?? variant.stock;
            const tone =
              stock === 0
                ? "border-red-300 text-red-700"
                : stock <= 5
                  ? "border-amber-300 text-amber-700"
                  : "border-slate-300 text-emerald-700";
            return (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStock(variant.id, stock - 1)}
                  className="grid size-8 place-items-center rounded-lg border border-slate-300"
                  aria-label={`−1 ${variant.sku}`}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(event) => setStock(variant.id, Number(event.target.value))}
                  className={`w-20 rounded-lg border px-2 py-1.5 text-center font-medium ${tone}`}
                  aria-label={`${labels.stock} ${variant.sku}`}
                />
                <button
                  type="button"
                  onClick={() => setStock(variant.id, stock + 1)}
                  className="grid size-8 place-items-center rounded-lg border border-slate-300"
                  aria-label={`+1 ${variant.sku}`}
                >
                  +
                </button>
              </div>
            );
          }}
        />

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="text-sm font-medium">
            {labels.note}
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={labels.notePlaceholder}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={!dirty.length || saving}
            onClick={save}
            className="self-end rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? labels.saving : `${labels.save} (${dirty.length})`}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <h2 className="px-4 pt-4 text-xl font-semibold">{labels.history}</h2>
        {data.movements.length ? (
          <div className="overflow-x-auto">
            <table className="mt-3 w-full text-sm">
              <thead className="bg-slate-50 text-start">
                <tr>
                  <th className="px-4 py-2 text-start">{labels.time}</th>
                  <th className="px-4 py-2 text-start">{labels.product}</th>
                  <th className="px-4 py-2 text-start">{labels.sku}</th>
                  <th className="px-4 py-2 text-start">{labels.change}</th>
                  <th className="px-4 py-2 text-start">{labels.reason}</th>
                  <th className="px-4 py-2 text-start">{labels.actor}</th>
                </tr>
              </thead>
              <tbody>
                {data.movements.map((movement) => (
                  <tr key={movement.id} className="border-t border-slate-200">
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(movement.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      {movement.productName} — {movement.variantName}
                      {movement.note ? <p className="text-xs text-slate-500">{movement.note}</p> : null}
                    </td>
                    <td className="px-4 py-3">{movement.sku}</td>
                    <td className={`px-4 py-3 font-semibold ${movement.delta > 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {movement.delta > 0 ? "+" : ""}{movement.delta}
                    </td>
                    <td className="px-4 py-3">{movement.reason}</td>
                    <td className="px-4 py-3">{movement.actorName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-slate-500">{labels.historyEmpty}</p>
        )}
      </section>
    </div>
  );
}
