"use client";

import {
  AdminFilterableTable,
  type AdminTableRow,
} from "@/components/admin/admin-filterable-table";
import { OrderStatusForm } from "./order-status-form";

export function AdminSectionTable({
  section,
  caption,
  columns,
  rows,
  empty,
  filterColumn,
  selectAll,
  searchValues,
  clearFilters,
  resultsLabel,
}: {
  section: string;
  caption: string;
  columns: string[];
  rows: AdminTableRow[];
  empty: string;
  filterColumn: string;
  selectAll: string;
  searchValues: string;
  clearFilters: string;
  resultsLabel: string;
}) {
  return (
    <AdminFilterableTable
      caption={caption}
      columns={columns}
      rows={rows}
      empty={empty}
      filterColumn={filterColumn}
      selectAll={selectAll}
      searchValues={searchValues}
      clearFilters={clearFilters}
      resultsLabel={(visible, total) =>
        resultsLabel.replace("{visible}", String(visible)).replace("{total}", String(total))
      }
      renderCell={
        section === "orders"
          ? ({ row, cell, columnIndex }) => {
              if (columnIndex !== 3 || !row.key) return undefined;
              return <OrderStatusForm id={row.key} status={cell} />;
            }
          : undefined
      }
    />
  );
}
