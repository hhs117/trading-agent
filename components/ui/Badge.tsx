import type { ReactNode } from "react";

type Tone = "blue" | "green" | "orange" | "red" | "gray" | "purple";

const TONE: Record<Tone, string> = {
  blue: "bg-apple-blue/10 text-apple-blue",
  green: "bg-apple-green/10 text-apple-green",
  orange: "bg-apple-orange/10 text-apple-orange",
  red: "bg-apple-red/10 text-apple-red",
  gray: "bg-apple-gray-100 text-apple-gray-300",
  purple: "bg-purple-100 text-purple-600",
};

export default function Badge({
  children,
  tone = "gray",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeCls = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-[12px] px-2.5 py-1";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium",
        TONE[tone],
        sizeCls,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
