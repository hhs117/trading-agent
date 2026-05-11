"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, ThumbsUp, AlertTriangle, Star, ShieldAlert, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import MetricCard from "@/components/MetricCard";
import { Card, CardBody, CardHeader } from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import RecommendationBadge from "@/components/RecommendationBadge";
import { getProducts, seedIfEmpty } from "@/lib/storage";
import { COUNTRY_LABELS, type Product } from "@/lib/types";

const PIE_COLORS = ["#0071E3", "#34C759", "#FF9500", "#AF52DE", "#FF3B30", "#5AC8FA"];

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    seedIfEmpty();
    setProducts(getProducts());
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const recommend = products.filter((p) => p.recommendation === "recommend").length;
    const caution = products.filter((p) => p.recommendation === "caution").length;
    const avoid = products.filter((p) => p.recommendation === "avoid").length;
    const scored = products.filter((p) => typeof p.totalScore === "number");
    const avg = scored.length
      ? Math.round((scored.reduce((s, p) => s + (p.totalScore ?? 0), 0) / scored.length) * 10) / 10
      : 0;
    const highRisk = products.filter((p) => (p.score?.complianceLocalization ?? 10) <= 4).length;
    return { total, recommend, caution, avoid, avg, highRisk };
  }, [products]);

  const countryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      p.targetCountries.forEach((c) => map.set(c, (map.get(c) ?? 0) + 1));
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      name: COUNTRY_LABELS[k as keyof typeof COUNTRY_LABELS] ?? k,
      value: v,
    }));
  }, [products]);

  const categoryData = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    products.forEach((p) => {
      if (typeof p.totalScore !== "number") return;
      const cur = map.get(p.category) ?? { sum: 0, count: 0 };
      map.set(p.category, { sum: cur.sum + p.totalScore, count: cur.count + 1 });
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      name: k,
      score: Math.round((v.sum / v.count) * 10) / 10,
    }));
  }, [products]);

  if (products.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Package}
          title="还没有产品数据"
          description="添加你的第一个待选品，体验九宫格打分与多语言文案生成。"
          actionHref="/products/new"
          actionLabel="新建产品"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* 6 个核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="产品总数" value={stats.total} icon={Package} accent="blue" />
        <MetricCard label="推荐上架" value={stats.recommend} icon={ThumbsUp} accent="green" />
        <MetricCard label="谨慎测试" value={stats.caution} icon={AlertTriangle} accent="orange" />
        <MetricCard label="不建议做" value={stats.avoid} icon={ShieldAlert} accent="red" />
        <MetricCard label="平均评分" value={stats.avg} icon={Star} accent="blue" hint="满分 10" />
        <MetricCard label="高风险数" value={stats.highRisk} icon={TrendingUp} accent="red" />
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="各国家产品分布" />
          <CardBody>
            {countryData.length === 0 ? (
              <div className="text-center text-apple-gray-300 text-[13px] py-12">暂无数据</div>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={countryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {countryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="各品类平均评分" />
          <CardBody>
            {categoryData.length === 0 ? (
              <div className="text-center text-apple-gray-300 text-[13px] py-12">暂无数据</div>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#86868B" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#86868B" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="score" fill="#0071E3" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 最近产品 */}
      <Card>
        <CardHeader
          title="最近添加的产品"
          action={
            <Link href="/products" className="text-[13px] text-apple-blue hover:underline">
              查看全部
            </Link>
          }
        />
        <div className="divide-y divide-apple-gray-100">
          {products.slice(0, 5).map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-apple-gray-50/50 transition"
            >
              <div>
                <div className="text-[14px] font-medium text-apple-gray-900">{p.name}</div>
                <div className="text-[12px] text-apple-gray-300 mt-0.5">
                  {p.platform} · {p.category} · {p.targetCountries.map((c) => COUNTRY_LABELS[c]).join(", ")}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[14px] font-semibold text-apple-gray-900 w-10 text-right">
                  {p.totalScore?.toFixed(1) ?? "—"}
                </div>
                {p.recommendation && <RecommendationBadge recommendation={p.recommendation} size="sm" />}
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
