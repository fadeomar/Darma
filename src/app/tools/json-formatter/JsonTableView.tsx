import type { JsonTableData } from "./utils";

export default function JsonTableView({ table }: { table: JsonTableData }) {
  if (table.reason) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[calc(var(--radius-lg)-6px)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-6 text-center">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">No table available</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">{table.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[calc(var(--radius-lg)-6px)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-inner">
      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-full divide-y divide-[var(--color-border-subtle)] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface-base)] shadow-[0_1px_0_var(--color-border-subtle)]">
            <tr>
              {table.columns.map((column) => (
                <th key={column} scope="col" className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {table.rows.map((row, index) => (
              <tr key={index} className="hover:bg-[var(--color-surface-subtle)]">
                {table.columns.map((column) => (
                  <td key={column} className="max-w-[280px] truncate px-3 py-2.5 font-mono text-xs text-[var(--color-text-secondary)]" title={row[column]}>
                    {row[column] || <span className="text-[var(--color-text-tertiary)]">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(table.truncatedRows > 0 || table.truncatedColumns > 0) ? (
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-text-tertiary)]">
          Showing a preview. {table.truncatedRows > 0 ? `${table.truncatedRows} rows hidden. ` : ""}
          {table.truncatedColumns > 0 ? `${table.truncatedColumns} columns hidden.` : ""}
        </div>
      ) : null}
    </div>
  );
}
