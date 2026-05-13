import Link from "next/link";
import { FileText, Package, Sparkles, Star, ImageIcon, Languages } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmptyState from "@/components/EmptyState";

export default function ProductDetailLandingPage() {
  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        icon={FileText}
        title="产品详情"
        description="选择一个产品，进入它的九宫格评分、多语言文案与美工建议工作台。"
        badge="入口页"
        action={
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-apple-blue text-white rounded-xl px-4 py-2 text-[13px] font-medium hover:bg-blue-600 transition"
          >
            <Package className="w-4 h-4" />
            前往产品列表
          </Link>
        }
      />

      <SectionCard
        title="产品详情包含哪些内容"
        description="每个产品的工作台已经可用，从产品列表选中任意一条即可进入。"
      >
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Star, title: "九宫格评分", desc: "对九个维度滑杆打分，自动算出综合分与推荐结论。" },
            { icon: Languages, title: "多语言文案", desc: "一键生成英语、泰语、越南语、印尼语、马来语文案。" },
            { icon: ImageIcon, title: "美工图片纠错", desc: "检测中文残留、画面杂乱、卖点缺失，给本地化建议。" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <li
                key={f.title}
                className="p-4 rounded-xl bg-apple-gray-50/60 border border-apple-gray-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-white text-apple-blue flex items-center justify-center shadow-soft">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[14px] font-medium text-apple-gray-900">{f.title}</div>
                </div>
                <p className="text-[12px] text-apple-gray-300 leading-relaxed">{f.desc}</p>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <EmptyState
        icon={Sparkles}
        title="还没有选择产品"
        description="先去产品列表挑一个，或者直接添加一个新产品开始测评。"
        actionHref="/products"
        actionLabel="去选择产品"
      />
    </div>
  );
}
