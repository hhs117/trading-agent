import type { LucideIcon } from "lucide-react";

type Accent = "blue" | "green" | "orange" | "red" | "gray" | "purple";

const ACCENT: Record<Accent, string> = {
  blue: "bg-apple-blue/10 text-apple-blue",
  green: "bg-apple-green/10 text-apple-green",
  orange: "bg-apple-orange/10 text-apple-orange",
  red: "bg-apple-red/10 text-apple-red",
  gray: "bg-apple-gray-100 text-apple-gray-300",
  purple: "bg-purple-100 text-purple-600",
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
  trend,
  className = "",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: Accent;
  hint?: string;
  trend?: { value: number; positive?: boolean };
  className?: string;
}) {
  return (
    <div
      className={[
        "bg-white rounded-2xl shadow-card border border-black/[0.03] p-5 sm:p-6",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] sm:text-[13px] text-apple-gray-300 mb-2 truncate">
            {label}
          </div>
          <div className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-apple-gray-900 leading-none">
            {value}
          </div>
          {(hint || trend) && (
            <div className="text-[12px] mt-2 flex items-center gap-2">
              {trend && (
                <span
                  className={[
                    "tabular-nums font-medium",
                    trend.positive ? "text-apple-green" : "text-apple-red",
                  ].join(" ")}
                >
                  {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
              {hint && <span className="text-apple-gray-300">{hint}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={[
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              ACCENT[accent],
            ].join(" ")}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
