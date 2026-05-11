import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-apple-gray-50 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-apple-gray-300" />
      </div>
      <h3 className="text-[15px] font-semibold text-apple-gray-900 mb-1">{title}</h3>
      <p className="text-[13px] text-apple-gray-300 max-w-sm">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center px-4 py-2 rounded-xl bg-apple-blue text-white text-[13px] font-medium hover:bg-blue-600 transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
