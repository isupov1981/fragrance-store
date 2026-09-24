"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type AdminTableRow = {
  /** Values shown and used for filtering — one per column. */
  cells: string[];
  /** When set, the first cell renders as an external product link. */
  href?: string;
  /** Stable list key. */
  key?: string;
};

/** `null` means every value is selected (no filter on that column). */
type ColumnSelection = Set<string> | null;

export function AdminFilterableTable({
  caption,
  columns,
  rows,
  empty,
  filterColumn,
  selectAll,
  searchValues,
  clearFilters,
  resultsLabel,
  renderCell,
}: {
  caption: string;
  columns: string[];
  rows: AdminTableRow[];
  empty: string;
  filterColumn: string;
  selectAll: string;
  searchValues: string;
  clearFilters: string;
  resultsLabel: (visible: number, total: number) => string;
  renderCell?: (args: {
    row: AdminTableRow;
    cell: string;
    columnIndex: number;
  }) => ReactNode;
}) {
  const [selections, setSelections] = useState<ColumnSelection[]>(() => columns.map(() => null));
  const [openColumn, setOpenColumn] = useState<number | null>(null);
  const [valueQuery, setValueQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openColumn === null) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenColumn(null);
        setValueQuery("");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenColumn(null);
        setValueQuery("");
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openColumn]);

  const visibleRows = useMemo(() => {
    return rows.filter((row) =>
      columns.every((_, index) => {
        const selection = selections[index];
        if (!selection) return true;
        return selection.has(row.cells[index] ?? "");
      }),
    );
  }, [columns, rows, selections]);

  const hasActiveFilters = selections.some((selection) => selection !== null);

  function uniqueValuesFor(columnIndex: number) {
    const values = new Set<string>();
    for (const row of rows) {
      const matchesOthers = columns.every((_, index) => {
        if (index === columnIndex) return true;
        const selection = selections[index];
        if (!selection) return true;
        return selection.has(row.cells[index] ?? "");
      });
      if (!matchesOthers) continue;
      values.add(row.cells[columnIndex] ?? "");
    }
    return [...values].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
  }

  function isValueSelected(columnIndex: number, value: string) {
    const selection = selections[columnIndex];
    return selection === null || selection.has(value);
  }

  function setColumnSelection(columnIndex: number, next: ColumnSelection) {
    setSelections((current) => current.map((item, index) => (index === columnIndex ? next : item)));
  }

  function toggleValue(columnIndex: number, value: string, options: string[]) {
    const currentlySelected = new Set(
      options.filter((option) => isValueSelected(columnIndex, option)),
    );
    if (currentlySelected.has(value)) currentlySelected.delete(value);
    else currentlySelected.add(value);

    if (currentlySelected.size === options.length) {
      setColumnSelection(columnIndex, null);
      return;
    }
    setColumnSelection(columnIndex, currentlySelected);
  }

  function toggleSelectAll(columnIndex: number, options: string[], checked: boolean) {
    setColumnSelection(columnIndex, checked ? null : new Set());
  }

  return (
    <div ref={rootRef} className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
        <p>{resultsLabel(visibleRows.length, rows.length)}</p>
        {hasActiveFilters ? (
          <button
            type="button"
            className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600"
            onClick={() => {
              setSelections(columns.map(() => null));
              setOpenColumn(null);
              setValueQuery("");
            }}
          >
            {clearFilters}
          </button>
        ) : null}
      </div>
      <table className="w-full border-collapse text-start">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column, columnIndex) => {
              const active = selections[columnIndex] !== null;
              const open = openColumn === columnIndex;
              const options = open ? uniqueValuesFor(columnIndex) : [];
              const filteredOptions = valueQuery.trim()
                ? options.filter((value) =>
                    value.toLowerCase().includes(valueQuery.trim().toLowerCase()),
                  )
                : options;
              const selectedCount = options.filter((value) => isValueSelected(columnIndex, value)).length;
              const allSelected = options.length > 0 && selectedCount === options.length;

              return (
                <th key={column} scope="col" className="relative px-2 py-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="min-w-0 flex-1 px-2 py-1">{column}</span>
                    <button
                      type="button"
                      className={`grid size-7 shrink-0 place-items-center rounded border text-slate-700 transition ${
                        active || open
                          ? "border-slate-400 bg-slate-200"
                          : "border-slate-300 bg-slate-100 hover:bg-slate-200"
                      }`}
                      aria-label={filterColumn.replace("{column}", column)}
                      aria-expanded={open}
                      aria-haspopup="dialog"
                      onClick={() => {
                        setOpenColumn((current) => (current === columnIndex ? null : columnIndex));
                        setValueQuery("");
                      }}
                    >
                      <ChevronDown aria-hidden="true" size={14} strokeWidth={2.25} />
                    </button>
                  </div>
                  {open ? (
                    <div
                      className="absolute start-0 top-full z-30 mt-1 w-56 rounded-md border border-slate-200 bg-white p-2 text-start shadow-lg"
                      role="dialog"
                      aria-label={filterColumn.replace("{column}", column)}
                    >
                      <input
                        className="mb-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-normal outline-none focus:border-slate-400"
                        type="search"
                        value={valueQuery}
                        placeholder={searchValues}
                        onChange={(event) => setValueQuery(event.target.value)}
                      />
                      <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-1 py-2 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(event) =>
                            toggleSelectAll(columnIndex, options, event.target.checked)
                          }
                        />
                        <span>{selectAll}</span>
                      </label>
                      <ul className="max-h-56 overflow-y-auto py-1">
                        {filteredOptions.map((value) => {
                          const label = value || "—";
                          return (
                            <li key={`${columnIndex}-${value}`}>
                              <label className="flex cursor-pointer items-start gap-2 rounded px-1 py-1.5 text-xs font-normal hover:bg-slate-50">
                                <input
                                  className="mt-0.5"
                                  type="checkbox"
                                  checked={isValueSelected(columnIndex, value)}
                                  onChange={() => toggleValue(columnIndex, value, options)}
                                />
                                <span className="min-w-0 break-words whitespace-pre-line">{label}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </th>
              );
            })}
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
