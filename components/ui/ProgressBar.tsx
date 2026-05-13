type Tone = "blue" | "green" | "orange" | "red";

const TONE: Record<Tone, string> = {
  blue: "bg-apple-blue",
  green: "bg-apple-green",
  orange: "bg-apple-orange",
  red: "bg-apple-red",
};

export default function ProgressBar({
  value,
  max = 100,
  tone = "blue",
  showLabel = false,
  className = "",
}: {
  value: number;
  max?: number;
  tone?: Tone;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={["w-full", className].join(" ")}>
      <div className="h-1.5 w-full bg-apple-gray-100 rounded-full overflow-hidden">
        <div
          className={["h-full rounded-full transition-[width] duration-300", TONE[tone]].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-[11px] text-apple-gray-300 tabular-nums">
          {Math.round(pct)}%
        </div>
      )}
    </div>
  );
}
