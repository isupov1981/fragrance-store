"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

export type AdminTableRow = {
  /** Values shown and used for filtering — one per column. */
  cells: string[];
  /** When set, the first cell renders as an external product link. */
  href?: string;
  /** Stable list key. */
  key?: string;
};

export function AdminFilterableTable({
  caption,
  columns,
  rows,
  empty,
  filterPlaceholder,
  clearFilters,
  resultsLabel,
  renderCell,
}: {
  caption: string;
  columns: string[];
  rows: AdminTableRow[];
  empty: string;
  filterPlaceholder: string;
  clearFilters: string;
  resultsLabel: (visible: number, total: number) => string;
  renderCell?: (args: {
    row: AdminTableRow;
    cell: string;
    columnIndex: number;
  }) => ReactNode;
}) {
  const [filters, setFilters] = useState<string[]>(() => columns.map(() => ""));

  const visibleRows = useMemo(() => {
    return rows.filter((row) =>
      columns.every((_, index) => {
        const needle = filters[index]?.trim().toLowerCase() ?? "";
        if (!needle) return true;
        return (row.cells[index] ?? "").toLowerCase().includes(needle);
      }),
    );
  }, [columns, filters, rows]);

  const hasActiveFilters = filters.some((value) => value.trim());

  return (
    <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
        <p>{resultsLabel(visibleRows.length, rows.length)}</p>
        {hasActiveFilters ? (
          <button
            type="button"
            className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600"
            onClick={() => setFilters(columns.map(() => ""))}
          >
            {clearFilters}
          </button>
        ) : null}
      </div>
      <table className="w-full border-collapse text-start">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 text-sm">
                {column}
              </th>
            ))}
          </tr>
          <tr>
            {columns.map((column, index) => (
              <th key={`${column}-filter`} scope="col" className="px-4 pb-3">
                <label className="sr-only" htmlFor={`admin-filter-${index}`}>
                  {filterPlaceholder.replace("{column}", column)}
                </label>
                <input
                  id={`admin-filter-${index}`}
                  className="w-full min-w-[6rem] rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-slate-900 outline-none focus:border-slate-400"
                  type="search"
                  value={filters[index] ?? ""}
                  placeholder={filterPlaceholder.replace("{column}", column)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilters((current) => current.map((item, i) => (i === index ? value : item)));
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length ? (
            visibleRows.map((row, index) => (
              <tr key={row.key ?? `${row.cells.join("|")}-${index}`} className="border-t border-slate-200">
                {row.cells.map((cell, columnIndex) => {
                  const custom = renderCell?.({ row, cell, columnIndex });
                  return (
                    <td
                      key={`${index}-${columnIndex}`}
                      className={`px-4 py-3 ${cell.includes("\n") ? "max-w-xs whitespace-pre-line" : ""}`}
                    >
                      {custom !== undefined ? (
                        custom
                      ) : columnIndex === 0 && row.href ? (
                        <Link
                          href={row.href}
                          className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {cell}
                        </Link>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-slate-500" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
