import type { Recommendation, ScoreDimensions } from "./types";

const WEIGHTS: Record<keyof ScoreDimensions, number> = {
  marketHeat: 1.5,
  demandGrowth: 1.3,
  competitionPressure: 1.2,
  priceCompetition: 1.0,
  profitFeasibility: 1.5,
  keywordTraffic: 1.1,
  competitorMaturity: 1.0,
  supplyLogistics: 1.0,
  complianceLocalization: 0.8,
};

export function calculateTotalScore(score: ScoreDimensions): number {
  let total = 0;
  let weightSum = 0;
  (Object.keys(WEIGHTS) as Array<keyof ScoreDimensions>).forEach((key) => {
    total += score[key] * WEIGHTS[key];
    weightSum += WEIGHTS[key];
  });
  return Math.round((total / weightSum) * 10) / 10;
}

export function getRecommendation(totalScore: number): Recommendation {
  if (totalScore >= 7.5) return "recommend";
  if (totalScore >= 5) return "caution";
  return "avoid";
}

export const RECOMMENDATION_META: Record<
  Recommendation,
  { label: string; color: string; bg: string; tip: string }
> = {
  recommend: {
    label: "推荐上架",
    color: "text-apple-green",
    bg: "bg-apple-green/10",
    tip: "综合表现优秀，建议尽快上架并加大投入。",
  },
  caution: {
    label: "谨慎测试",
    color: "text-apple-orange",
    bg: "bg-apple-orange/10",
    tip: "存在一定不确定性，建议小批量测试后决策。",
  },
  avoid: {
    label: "不建议做",
    color: "text-apple-red",
    bg: "bg-apple-red/10",
    tip: "综合评估风险较高，不建议在当前阶段推进。",
  },
};

export const DEFAULT_SCORE: ScoreDimensions = {
  marketHeat: 5,
  demandGrowth: 5,
  competitionPressure: 5,
  priceCompetition: 5,
  profitFeasibility: 5,
  keywordTraffic: 5,
  competitorMaturity: 5,
  supplyLogistics: 5,
  complianceLocalization: 5,
};
