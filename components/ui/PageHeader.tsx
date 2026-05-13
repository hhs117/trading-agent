import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Badge from "./Badge";

export default function PageHeader({
  icon: Icon,
  title,
  description,
  badge,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-apple-blue/10 text-apple-blue flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[20px] md:text-[22px] font-semibold text-apple-gray-900 leading-tight">
              {title}
            </h1>
            {badge && (
              <Badge tone="gray" size="sm">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-[13px] text-apple-gray-300 mt-1.5 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
