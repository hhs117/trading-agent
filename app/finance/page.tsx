"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Eye, History, Receipt, Save, Trash2 } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CopyableBlock, { CopyTextButton } from "@/components/ui/CopyableBlock";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  deleteGenerationRecord,
  fetchGenerationRecords,
  saveGenerationRecord,
} from "@/lib/api/generationRecords";

const STORAGE_KEY = "seapick_finance_profit_history";

type FinanceInput = {
  procurementCost: number;
  salePrice: number;
  domesticShipping: number;
  internationalShipping: number;
  platformCommissionRate: number;
  paymentFeeRate: number;
  adFee: number;
  packagingFee: number;
  refundLoss: number;
  otherCost: number;
};

type FinanceResult = {
  platformFee: number;
  paymentFee: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitRate: number;
  breakEvenPrice: number;
  suggestedPrice: number;
  roi: number;
  verdict: string;
  verdictTone: "green" | "orange" | "red";
};

type FinanceRecord = {
  id: string;
  createdAt: string;
  input: FinanceInput;
  result: FinanceResult;
};

const initialInput: FinanceInput = {
  procurementCost: 0,
  salePrice: 0,
  domesticShipping: 0,
  internationalShipping: 0,
  platformCommissionRate: 0,
  paymentFeeRate: 0,
  adFee: 0,
  packagingFee: 0,
  refundLoss: 0,
  otherCost: 0,
};

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2,
});

function calculateProfit(input: FinanceInput): FinanceResult {
  const platformFee = input.salePrice * (input.platformCommissionRate / 100);
  const paymentFee = input.salePrice * (input.paymentFeeRate / 100);
  const fixedCost =
    input.procurementCost +
    input.domesticShipping +
    input.internationalShipping +
    input.adFee +
    input.packagingFee +
    input.refundLoss +
    input.otherCost;
  const totalCost = fixedCost + platformFee + paymentFee;
  const grossProfit = input.salePrice - input.procurementCost;
  const netProfit = input.salePrice - totalCost;
  const profitRate = input.salePrice > 0 ? (netProfit / input.salePrice) * 100 : 0;
  const feeRate = (input.platformCommissionRate + input.paymentFeeRate) / 100;
  const breakEvenPrice = feeRate < 1 ? fixedCost / (1 - feeRate) : 0;
  const suggestedPrice = feeRate < 0.7 ? fixedCost / (1 - feeRate - 0.3) : input.salePrice;
  const roi = input.adFee > 0 ? netProfit / input.adFee : netProfit > 0 ? 99 : 0;

  let verdict = "不建议上架";
  let verdictTone: FinanceResult["verdictTone"] = "red";
  if (netProfit <= 0) {
    verdict = "不建议上架：净利润为负或接近为零。";
  } else if (profitRate >= 30) {
    verdict = "利润健康：可以进入上架或放量测试。";
    verdictTone = "green";
  } else if (profitRate >= 15) {
    verdict = "可以测试：建议小预算验证转化和退款率。";
    verdictTone = "orange";
  } else {
    verdict = "风险较高：利润率低于 15%，建议先优化成本。";
  }

  return {
    platformFee,
    paymentFee,
    totalCost,
    grossProfit,
    netProfit,
    profitRate,
    breakEvenPrice,
    suggestedPrice,
    roi,
    verdict,
    verdictTone,
  };
}

function resultToText(input: FinanceInput, result: FinanceResult) {
  return [
    `采购成本：${money.format(input.procurementCost)}`,
    `售价：${money.format(input.salePrice)}`,
    `总成本：${money.format(result.totalCost)}`,
    `毛利润：${money.format(result.grossProfit)}`,
    `净利润：${money.format(result.netProfit)}`,
    `利润率：${result.profitRate.toFixed(2)}%`,
    `保本售价：${money.format(result.breakEvenPrice)}`,
    `建议售价：${money.format(result.suggestedPrice)}`,
    `ROI：${result.roi.toFixed(2)}`,
    `是否值得上架：${result.verdict}`,
  ].join("\n");
}

function Field({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 pr-12 text-[13px] outline-none focus:border-apple-blue"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-apple-gray-300">{suffix}</span>}
      </div>
    </div>
  );
}

function StatRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-apple-gray-100 bg-apple-gray-50/60 px-4 py-3">
      <div className="text-[13px] text-apple-gray-300">{label}</div>
      <div className={["text-[15px] font-semibold tabular-nums", strong ? "text-apple-blue" : "text-apple-gray-900"].join(" ")}>{value}</div>
    </div>
  );
}

export default function FinancePage() {
  const [input, setInput] = useState<FinanceInput>(initialInput);
  const [history, setHistory] = useState<FinanceRecord[]>([]);
  const result = useMemo(() => calculateProfit(input), [input]);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      const remoteHistory = await fetchGenerationRecords<FinanceInput, FinanceResult>("finance");
      if (!active) return;

      if (remoteHistory) {
        setHistory(remoteHistory.map(({ id, createdAt, input, result }) => ({ id, createdAt, input, result })));
        return;
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        setHistory(JSON.parse(raw) as FinanceRecord[]);
      } catch {
        setHistory([]);
      }
    }

    void loadHistory();
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof FinanceInput>(key: K, value: FinanceInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function saveCurrent() {
    const record: FinanceRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      input,
      result,
    };
    const next = [record, ...history].slice(0, 20);
    setHistory(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    void saveGenerationRecord({
      ...record,
      kind: "finance",
    });
  }

  function deleteRecord(id: string) {
    if (!confirm("确认删除这条利润测算历史？此操作不可恢复。")) return;
    const next = history.filter((record) => record.id !== id);
    setHistory(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    void deleteGenerationRecord(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calculator}
        title="财务利润计算"
        badge="支持历史记录"
        description="录入采购、物流、平台佣金、广告和退款等成本，自动计算利润率、保本价、建议售价和上架判断。"
        action={
          <div className="flex gap-2">
            <CopyTextButton text={resultToText(input, result)} label="复制结果" />
            <Button icon={Save} onClick={saveCurrent}>
              保存测算
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[430px_1fr]">
        <SectionCard title="成本与售价" description="金额统一按 CNY mock 计算，百分比字段请输入数字。">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="采购成本" value={input.procurementCost} suffix="CNY" onChange={(value) => update("procurementCost", value)} />
            <Field label="售价" value={input.salePrice} suffix="CNY" onChange={(value) => update("salePrice", value)} />
            <Field label="国内运费" value={input.domesticShipping} suffix="CNY" onChange={(value) => update("domesticShipping", value)} />
            <Field label="国际运费" value={input.internationalShipping} suffix="CNY" onChange={(value) => update("internationalShipping", value)} />
            <Field label="平台佣金比例" value={input.platformCommissionRate} suffix="%" onChange={(value) => update("platformCommissionRate", value)} />
            <Field label="支付手续费比例" value={input.paymentFeeRate} suffix="%" onChange={(value) => update("paymentFeeRate", value)} />
            <Field label="广告费" value={input.adFee} suffix="CNY" onChange={(value) => update("adFee", value)} />
            <Field label="包装费" value={input.packagingFee} suffix="CNY" onChange={(value) => update("packagingFee", value)} />
            <Field label="退款损耗" value={input.refundLoss} suffix="CNY" onChange={(value) => update("refundLoss", value)} />
            <Field label="其他成本" value={input.otherCost} suffix="CNY" onChange={(value) => update("otherCost", value)} />
          </div>
        </SectionCard>

        <SectionCard
          title="自动计算结果"
          description="判断规则：利润率 >= 30% 健康，15%-30% 可测试，低于 15% 风险较高；净利润 <= 0 不建议上架。"
          action={<Badge tone={result.verdictTone}>{result.verdictTone === "green" ? "利润健康" : result.verdictTone === "orange" ? "可以测试" : "风险较高"}</Badge>}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <StatRow label="总成本" value={money.format(result.totalCost)} strong />
            <StatRow label="毛利润" value={money.format(result.grossProfit)} />
            <StatRow label="净利润" value={money.format(result.netProfit)} strong />
            <StatRow label="利润率" value={`${result.profitRate.toFixed(2)}%`} />
            <StatRow label="保本售价" value={money.format(result.breakEvenPrice)} />
            <StatRow label="建议售价" value={money.format(result.suggestedPrice)} />
            <StatRow label="ROI" value={result.roi.toFixed(2)} />
            <StatRow label="平台佣金 + 手续费" value={money.format(result.platformFee + result.paymentFee)} />
          </div>
          <div className="mt-4 rounded-2xl border border-apple-gray-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-apple-gray-900">
              <Receipt className="h-4 w-4 text-apple-blue" />
              是否值得上架
            </div>
            <p className="text-[13px] leading-relaxed text-apple-gray-900">{result.verdict}</p>
          </div>
        </SectionCard>
      </div>

      <CopyableBlock title="测算摘要" text={resultToText(input, result)}>
        <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{resultToText(input, result)}</pre>
      </CopyableBlock>

      <SectionCard title="历史记录" description="保存到 localStorage，可查看、恢复或删除。">
        {history.length ? (
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.id} className="rounded-2xl border border-apple-gray-100 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <History className="h-4 w-4 text-apple-gray-300" />
                      <span className="text-[13px] font-semibold text-apple-gray-900">
                        售价 {money.format(record.input.salePrice)} / 净利润 {money.format(record.result.netProfit)}
                      </span>
                      <Badge tone={record.result.verdictTone}>{record.result.profitRate.toFixed(1)}%</Badge>
                    </div>
                    <div className="mt-1 text-[12px] text-apple-gray-300">{new Date(record.createdAt).toLocaleString("zh-CN")}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" icon={Eye} onClick={() => setInput(record.input)}>
                      查看
                    </Button>
                    <Button variant="secondary" size="sm" icon={Trash2} onClick={() => deleteRecord(record.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-apple-gray-50 px-4 py-8 text-center text-[13px] text-apple-gray-300">暂无历史记录，点击「保存测算」后会显示在这里。</div>
        )}
      </SectionCard>
    </div>
  );
}
