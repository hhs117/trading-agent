"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({
  text,
  label = "复制",
  size = "sm",
  className = "",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore (e.g. unfocused tab); fall back silently
    }
  }

  const sizeCls = size === "sm" ? "text-[12px] px-2.5 py-1 rounded-lg gap-1" : "text-[13px] px-3 py-1.5 rounded-xl gap-1.5";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "inline-flex items-center font-medium transition-colors",
        copied
          ? "bg-apple-green/10 text-apple-green"
          : "bg-apple-gray-50 text-apple-gray-900 hover:bg-apple-gray-100",
        sizeCls,
        className,
      ].join(" ")}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? "已复制" : label}</span>
    </button>
  );
}
