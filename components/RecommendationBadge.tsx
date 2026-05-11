import type { Recommendation } from "@/lib/types";
import { RECOMMENDATION_META } from "@/lib/scoring";

export default function RecommendationBadge({
  recommendation,
  size = "md",
}: {
  recommendation: Recommendation;
  size?: "sm" | "md";
}) {
  const meta = RECOMMENDATION_META[recommendation];
  const sizeCls = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-[12px] px-2.5 py-1";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium",
        meta.bg,
        meta.color,
        sizeCls,
      ].join(" ")}
    >
      {meta.label}
    </span>
  );
}
