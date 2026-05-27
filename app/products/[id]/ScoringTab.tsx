"use client";

import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import RecommendationBadge from "@/components/RecommendationBadge";
import {
  calculateTotalScore,
  DEFAULT_SCORE,
  getRecommendation,
  RECOMMENDATION_META,
} from "@/lib/scoring";
import {
  SCORE_DIMENSION_DESCRIPTIONS,
  SCORE_DIMENSION_LABELS,
  type ScoreDimensions,
} from "@/lib/types";
import type { MockProduct } from "@/data/mockData";
import { logActivity } from "@/data/activity";
import { saveApiProduct } from "@/lib/api/products";

export default function ScoringTab({
  product,
  onUpdated,
}: {
  product: MockProduct;
  onUpdated: () => void;
}) {
  const [score, setScore] = useState<ScoreDimensions>(product.score ?? DEFAULT_SCORE);
  const [saved, setSaved] = useState(false);

  const totalScore = useMemo(() => calculateTotalScore(score), [score]);
  const recommendation = useMemo(() => getRecommendation(totalScore), [totalScore]);

  const radarData = useMemo(
    () =>
      (Object.keys(SCORE_DIMENSION_LABELS) as Array<keyof ScoreDimensions>).map((k) => ({
        dimension: SCORE_DIMENSION_LABELS[k],
        value: score[k],
      })),
    [score]
  );

  function update(key: keyof ScoreDimensions, value: number) {
    setScore((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    const nextProduct: MockProduct = {
      ...product,
      score,
      totalScore,
      recommendation,
      updatedAt: new Date().toISOString(),
    };
    const savedProduct = await saveApiProduct(nextProduct);
    if (!savedProduct) return;
    logActivity({
      type: "scoring_completed",
      productId: product.id,
      productName: product.name,
      detail: `综合评分 ${totalScore.toFixed(1)} · ${RECOMMENDATION_META[recommendation].label}`,
    });
    setSaved(true);
    onUpdated();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
      {/* 左：滑块列表 */}
      <div className="lg:col-span-3 space-y-4">
        {(Object.keys(SCORE_DIMENSION_LABELS) as Array<keyof ScoreDimensions>).map((key) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[13px] text-apple-gray-900 font-medium">
                {SCORE_DIMENSION_LABELS[key]}
              </label>
              <span className="text-[13px] font-semibold tabular-nums text-apple-gray-900 w-8 text-right">
                {score[key]}
              </span>
            </div>
            <div className="text-[11px] text-apple-gray-300 mb-2 leading-relaxed">
              {SCORE_DIMENSION_DESCRIPTIONS[key]}
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={score[key]}
              onChange={(e) => update(key, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-white bg-apple-blue hover:bg-blue-600 transition"
          >
            保存评分
          </button>
          {saved && <span className="text-[12px] text-apple-green">✓ 已保存</span>}
        </div>
      </div>

      {/* 右：雷达 + 总分 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-apple-gray-50 rounded-2xl p-4">
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#D2D2D7" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#86868B" }} />
                <Radar dataKey="value" stroke="#0071E3" fill="#0071E3" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-apple-gray-100 rounded-2xl p-5">
          <div className="text-[12px] text-apple-gray-300 mb-1">综合评分</div>
          <div className="flex items-baseline gap-2">
            <div className="text-[40px] font-semibold text-apple-gray-900 tracking-tight leading-none">
              {totalScore.toFixed(1)}
            </div>
            <div className="text-[14px] text-apple-gray-300">/ 10</div>
          </div>
          <div className="mt-3">
            <RecommendationBadge recommendation={recommendation} />
          </div>
          <div className="text-[12px] text-apple-gray-300 mt-3 leading-relaxed">
            {RECOMMENDATION_META[recommendation].tip}
          </div>
        </div>
      </div>
    </div>
  );
}
