"use client";

import { toCsv } from "@/lib/csv";

interface CsvExportButtonProps {
  filename: string;
  rows: Record<string, unknown>[];
  columns?: string[];
  label?: string;
}

export function CsvExportButton({ filename, rows, columns, label = "Export CSV" }: CsvExportButtonProps) {
  const onClick = () => {
    const csv = toCsv(rows, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" className="csv-btn" onClick={onClick} disabled={rows.length === 0}>
      {label}
    </button>
  );
}
