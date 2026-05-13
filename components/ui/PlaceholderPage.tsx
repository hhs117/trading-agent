import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import PageHeader from "./PageHeader";
import SectionCard from "./SectionCard";
import Badge from "./Badge";

export interface PlannedFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface QuickEntry {
  href: string;
  label: string;
  desc?: string;
}

export default function PlaceholderPage({
  icon,
  title,
  description,
  badge = "规划中",
  plannedFeatures,
  quickEntries,
  skeleton,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  plannedFeatures: PlannedFeature[];
  quickEntries?: QuickEntry[];
  /** Optional structural skeleton rendered above the planned-feature list */
  skeleton?: React.ReactNode;
}) {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader icon={icon} title={title} description={description} badge={badge} />

      {skeleton}

      <SectionCard
        title="即将上线的能力"
        description="以下功能正在开发中，最终版本会在此页面提供完整体验。"
      >
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plannedFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <li
                key={f.title}
                className="flex items-start gap-3 p-4 rounded-xl bg-apple-gray-50/60 border border-apple-gray-100"
              >
                <div className="w-8 h-8 rounded-lg bg-white text-apple-blue flex items-center justify-center shrink-0 shadow-soft">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-apple-gray-900">
                    {f.title}
                  </div>
                  <div className="text-[12px] text-apple-gray-300 mt-1 leading-relaxed">
                    {f.description}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      {quickEntries && quickEntries.length > 0 && (
        <SectionCard
          title="相关入口"
          description="先去这些已经可以使用的页面继续推进工作。"
        >
          <ul className="divide-y divide-apple-gray-100 -my-2">
            {quickEntries.map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  className="flex items-center justify-between gap-3 py-3.5 group"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-apple-gray-900 group-hover:text-apple-blue transition-colors">
                      {q.label}
                    </div>
                    {q.desc && (
                      <div className="text-[12px] text-apple-gray-300 mt-0.5">
                        {q.desc}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-apple-gray-300 group-hover:text-apple-blue group-hover:translate-x-0.5 transition" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <div className="flex items-center gap-2 text-[12px] text-apple-gray-300 px-1">
        <Sparkles className="w-3.5 h-3.5" />
        <span>当前 MVP 阶段使用本地 mock 数据，不会调用真实第三方 API。</span>
        <Badge tone="gray" size="sm" className="ml-1">
          v0.1
        </Badge>
      </div>
    </div>
  );
}
