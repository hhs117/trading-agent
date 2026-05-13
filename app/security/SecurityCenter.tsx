"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Fingerprint, Globe2, KeyRound, Lock, MonitorSmartphone, RefreshCw, ShieldCheck, Store, UserCheck } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CopyableBlock, { CopyTextButton } from "@/components/ui/CopyableBlock";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const SECURITY_ADVICE = [
  "不要频繁切换 IP。",
  "不同店铺使用独立环境。",
  "避免多人共用同一账号。",
  "定期检查登录设备。",
  "避免在公共网络登录后台。",
  "重要账号开启二次验证。",
];

const LOGIN_RECORDS = [
  { time: "2026-05-13 09:42", device: "Windows / Chrome", ip: "23.92.18.41", region: "美国 洛杉矶", status: "正常" },
  { time: "2026-05-12 21:18", device: "Windows / Edge", ip: "23.92.18.41", region: "美国 洛杉矶", status: "正常" },
  { time: "2026-05-11 08:05", device: "MacOS / Chrome", ip: "103.12.88.9", region: "新加坡", status: "需复核" },
  { time: "2026-05-10 19:36", device: "Android / App", ip: "36.112.21.5", region: "中国 上海", status: "异常" },
];

function buildReport(seed: number) {
  const riskScore = 42 + (seed % 34);
  const riskLevel = riskScore >= 70 ? "高" : riskScore >= 50 ? "中" : "低";
  const tone = riskLevel === "高" ? "red" : riskLevel === "中" ? "orange" : "green";
  return {
    riskScore,
    riskLevel,
    tone: tone as "red" | "orange" | "green",
    accountStatus: riskLevel === "高" ? "存在异常登录" : "基础安全正常",
    loginEnv: seed % 2 === 0 ? "独立浏览器环境" : "浏览器环境混用",
    ipRegion: seed % 3 === 0 ? "美国 洛杉矶 / 新加坡混用" : "美国 洛杉矶",
    fingerprint: seed % 2 === 0 ? "稳定" : "近期发生变化",
    storeIsolation: seed % 3 === 1 ? "部分店铺未隔离" : "已隔离",
    alerts: [
      "检测到 1 次非常用地区登录。",
      "浏览器指纹在 24 小时内发生变化。",
      "建议检查客服子账号权限范围。",
    ],
  };
}

function reportToText(report: ReturnType<typeof buildReport>) {
  return [
    `账号安全状态：${report.accountStatus}`,
    `登录环境：${report.loginEnv}`,
    `IP 地区：${report.ipRegion}`,
    `浏览器指纹状态：${report.fingerprint}`,
    `店铺隔离状态：${report.storeIsolation}`,
    `风险等级：${report.riskLevel}`,
    "异常提醒：",
    ...report.alerts.map((item, index) => `${index + 1}. ${item}`),
    "安全建议：",
    ...SECURITY_ADVICE.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");
}

function StatusCard({
  icon: Icon,
  label,
  value,
  tone = "blue",
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone?: "blue" | "green" | "orange" | "red" | "gray";
}) {
  return (
    <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Icon className="h-5 w-5 text-apple-blue" />
        <Badge tone={tone}>{value}</Badge>
      </div>
      <div className="text-[12px] text-apple-gray-300">{label}</div>
    </div>
  );
}

export default function SecurityCenterPage() {
  const [seed, setSeed] = useState(9);
  const report = useMemo(() => buildReport(seed), [seed]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="安全中心"
        badge={`风险等级：${report.riskLevel}`}
        description="集中展示账号安全状态、登录环境、IP、浏览器指纹、店铺隔离、登录记录、异常提醒和安全建议。"
        action={
          <div className="flex gap-2">
            <CopyTextButton text={reportToText(report)} label="复制报告" />
            <Button icon={RefreshCw} onClick={() => setSeed((value) => value + 7)}>
              刷新检测
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatusCard icon={ShieldCheck} label="账号安全状态" value={report.accountStatus} tone={report.tone} />
        <StatusCard icon={MonitorSmartphone} label="登录环境" value={report.loginEnv} tone={report.loginEnv.includes("混用") ? "orange" : "green"} />
        <StatusCard icon={Globe2} label="IP 地区" value={report.ipRegion} tone={report.ipRegion.includes("/") ? "orange" : "green"} />
        <StatusCard icon={Fingerprint} label="浏览器指纹状态" value={report.fingerprint} tone={report.fingerprint === "稳定" ? "green" : "orange"} />
        <StatusCard icon={Store} label="店铺隔离状态" value={report.storeIsolation} tone={report.storeIsolation === "已隔离" ? "green" : "orange"} />
        <StatusCard icon={AlertTriangle} label="异常提醒" value={`${report.alerts.length} 条`} tone={report.tone} />
        <StatusCard icon={KeyRound} label="二次验证" value="建议开启" tone="orange" />
        <StatusCard icon={Lock} label="风险等级" value={report.riskLevel} tone={report.tone} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="最近登录记录" description="模拟展示账号最近登录设备、IP 与地区。">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-apple-gray-100 text-[12px] text-apple-gray-300">
                  <th className="py-2 font-medium">时间</th>
                  <th className="py-2 font-medium">登录环境</th>
                  <th className="py-2 font-medium">IP</th>
                  <th className="py-2 font-medium">地区</th>
                  <th className="py-2 text-right font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apple-gray-100">
                {LOGIN_RECORDS.map((record) => (
                  <tr key={`${record.time}-${record.ip}`} className="text-[13px] text-apple-gray-900">
                    <td className="py-3 tabular-nums">{record.time}</td>
                    <td className="py-3">{record.device}</td>
                    <td className="py-3 font-mono text-[12px]">{record.ip}</td>
                    <td className="py-3">{record.region}</td>
                    <td className="py-3 text-right">
                      <Badge tone={record.status === "正常" ? "green" : record.status === "需复核" ? "orange" : "red"}>{record.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="异常提醒" description="需要运营或管理员优先确认。">
          <div className="space-y-3">
            {report.alerts.map((alert) => (
              <div key={alert} className="flex gap-3 rounded-2xl border border-apple-gray-100 bg-white p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-apple-orange" />
                <span className="text-[13px] leading-relaxed text-apple-gray-900">{alert}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="安全建议" description="可作为团队账号使用规范。">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SECURITY_ADVICE.map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-apple-gray-100 bg-white p-4">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-apple-green" />
              <span className="text-[13px] leading-relaxed text-apple-gray-900">{item}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <CopyableBlock title="安全检测报告" text={reportToText(report)}>
        <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{reportToText(report)}</pre>
      </CopyableBlock>
    </div>
  );
}
