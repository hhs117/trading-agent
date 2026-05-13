import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  /** when omitted, falls back to `(row as any)[key]` */
  render?: (row: T, index: number) => ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  emptyState,
  rowKey,
  className = "",
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyState?: ReactNode;
  rowKey?: (row: T, index: number) => string | number;
  className?: string;
}) {
  if (data.length === 0 && emptyState) {
    return (
      <div className={["bg-white rounded-2xl border border-apple-gray-100", className].join(" ")}>
        {emptyState}
      </div>
    );
  }

  return (
    <div
      className={[
        "bg-white rounded-2xl border border-apple-gray-100 overflow-hidden",
        className,
      ].join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-apple-gray-50/60 text-apple-gray-300">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={[
                    "font-medium text-[12px] uppercase tracking-wider px-4 py-3 whitespace-nowrap",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left",
                    col.className ?? "",
                  ].join(" ")}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-gray-100">
            {data.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                className="hover:bg-apple-gray-50/40 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      "px-4 py-3 text-apple-gray-900",
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left",
                      col.className ?? "",
                    ].join(" ")}
                  >
                    {col.render
                      ? col.render(row, i)
                      : ((row as unknown) as Record<string, ReactNode>)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
