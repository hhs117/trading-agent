"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

export function CopyTextButton({
  text,
  label = "复制",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
        copied
          ? "bg-apple-green/10 text-apple-green"
          : "bg-apple-gray-50 text-apple-gray-900 hover:bg-apple-gray-100",
        className,
      ].join(" ")}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "已复制" : label}</span>
    </button>
  );
}

export default function CopyableBlock({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-apple-gray-100 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-apple-gray-100 px-4 py-3">
        <h3 className="text-[13px] font-semibold text-apple-gray-900">{title}</h3>
        <CopyTextButton text={text} />
      </div>
      <div className="p-4 text-[13px] leading-relaxed text-apple-gray-900">{children}</div>
    </div>
  );
}
