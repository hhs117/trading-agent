import { TrendingUp, BadgeDollarSign, ShoppingBag, Percent, FileBarChart } from "lucide-react";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import SectionCard from "@/components/ui/SectionCard";
import StatCard from "@/components/ui/StatCard";

export default function FinanceStatsPage() {
  return (
    <PlaceholderPage
      icon={TrendingUp}
      title="财务统计"
      description="跨店铺、跨国家、跨平台的营收 / 成本 / 利润聚合视图，按日 / 月 / 季对比。"
      skeleton={
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="本月营收" value="—" icon={BadgeDollarSign} accent="blue" hint="待接入" />
            <StatCard label="本月订单" value="—" icon={ShoppingBag} accent="green" hint="待接入" />
            <StatCard label="毛利率" value="—" icon={Percent} accent="orange" hint="待接入" />
            <StatCard label="累计利润" value="—" icon={TrendingUp} accent="purple" hint="待接入" />
          </div>

          <SectionCard title="月度利润趋势（占位）">
            <div className="h-64 rounded-xl bg-apple-gray-50/60 border border-dashed border-apple-gray-200 flex items-center justify-center text-[12px] text-apple-gray-300">
              图表区域 · 营收 vs 成本 vs 利润
            </div>
          </SectionCard>

          <SectionCard title="按平台拆分（占位）">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {["Shopee", "Lazada", "TikTok Shop"].map((p) => (
                <div
                  key={p}
                  className="p-4 rounded-xl bg-apple-gray-50/60 border border-apple-gray-100"
                >
                  <div className="text-[13px] font-medium text-apple-gray-900 mb-2">{p}</div>
                  <div className="h-3 rounded bg-apple-gray-100 mb-1.5 animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-apple-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      }
      plannedFeatures={[
        { icon: FileBarChart, title: "多维度报表", description: "按平台 / 国家 / 品类 / 店铺自由切片。" },
        { icon: TrendingUp, title: "同比环比", description: "支持周 / 月 / 季 / 年对比，识别异常波动。" },
        { icon: Percent, title: "毛利结构", description: "拆分采购、运费、佣金、广告各占比。" },
        { icon: BadgeDollarSign, title: "现金流测算", description: "结合回款周期估算资金占用。" },
      ]}
      quickEntries={[
        { href: "/finance", label: "利润计算", desc: "单品利润模型的输入入口。" },
        { href: "/", label: "Dashboard", desc: "看板汇总了核心 KPI。" },
      ]}
    />
  );
}
