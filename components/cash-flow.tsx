import { formatXAF, isMoneyOut } from "@/lib/format";
import { cn } from "@/lib/cn";

type FlowRow = {
  amount: number;
  status: string;
  kind: string;
  createdAt: string;
};

export function monthlyInflow(rows: FlowRow[]) {
  const now = new Date();
  const bars: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = cursor.toLocaleString("en-GB", { month: "short" });
    const value = rows
      .filter((row) => row.status === "success" && !isMoneyOut(row.kind))
      .filter((row) => {
        const at = new Date(row.createdAt);
        return at.getFullYear() === cursor.getFullYear() && at.getMonth() === cursor.getMonth();
      })
      .reduce((sum, row) => sum + row.amount, 0);
    bars.push({ label, value });
  }
  return bars;
}

export function CashFlow({
  title = "Cash flow",
  bars,
}: {
  title?: string;
  bars: { label: string; value: number }[];
}) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const total = bars.reduce((sum, bar) => sum + bar.value, 0);
  const peak = Math.max(...bars.map((bar) => bar.value));

  return (
    <section className="flex h-full flex-col rounded-[1.25rem] border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-1 font-mono text-xl font-black tracking-tight text-ink">
            {formatXAF(total, { withCurrency: false })}
            <span className="ml-1.5 text-sm font-semibold text-muted">XAF</span>
          </p>
        </div>
        <p className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-muted">6 months</p>
      </div>
      <div className="mt-6 flex min-h-[9.5rem] flex-1 items-end gap-2.5">
        {bars.map((bar) => {
          const tall = bar.value === peak && bar.value > 0;
          const height = Math.max(10, Math.round((bar.value / max) * 100));
          return (
            <div key={bar.label} className="flex h-full min-h-[9.5rem] flex-1 flex-col items-center justify-end gap-2">
              <div
                className={cn("w-full max-w-9 rounded-t-lg", tall ? "bg-brand" : "bg-brand-soft")}
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] font-medium text-muted">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
