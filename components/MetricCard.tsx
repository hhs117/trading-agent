import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export default function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "blue" | "green" | "orange" | "red" | "gray";
  hint?: string;
}) {
  const accentMap = {
    blue: "bg-apple-blue/10 text-apple-blue",
    green: "bg-apple-green/10 text-apple-green",
    orange: "bg-apple-orange/10 text-apple-orange",
    red: "bg-apple-red/10 text-apple-red",
    gray: "bg-apple-gray-100 text-apple-gray-300",
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] text-apple-gray-300 mb-2">{label}</div>
          <div className="text-[28px] font-semibold tracking-tight text-apple-gray-900 leading-none">
            {value}
          </div>
          {hint && <div className="text-[12px] text-apple-gray-300 mt-2">{hint}</div>}
        </div>
        <div className={["w-9 h-9 rounded-xl flex items-center justify-center", accentMap[accent]].join(" ")}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
}
