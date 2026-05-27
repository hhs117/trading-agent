"use client";

import { AlertTriangle, Fingerprint, Globe2, KeyRound, Lock, MonitorSmartphone, ShieldCheck, Store, UserCheck } from "lucide-react";

import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/EmptyState";
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

function StatusCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Icon className="h-5 w-5 text-apple-blue" />
        <Badge tone="gray">{value}</Badge>
      </div>
      <div className="text-[12px] text-apple-gray-300">{label}</div>
    </div>
  );
}

export default function SecurityCenterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="安全中心"
        badge="待接入安全数据"
        description="账号安全状态、登录环境、IP 地区、浏览器指纹、店铺隔离和最近登录记录需要接入真实审计数据后展示。"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatusCard icon={ShieldCheck} label="账号安全状态" value="暂无数据" />
        <StatusCard icon={MonitorSmartphone} label="登录环境" value="暂无数据" />
        <StatusCard icon={Globe2} label="IP 地区" value="暂无数据" />
        <StatusCard icon={Fingerprint} label="浏览器指纹状态" value="暂无数据" />
        <StatusCard icon={Store} label="店铺隔离状态" value="暂无数据" />
        <StatusCard icon={AlertTriangle} label="异常提醒" value="暂无数据" />
        <StatusCard icon={KeyRound} label="二次验证" value="待检测" />
        <StatusCard icon={Lock} label="风险等级" value="待检测" />
      </div>

      <SectionCard title="最近登录记录" description="接入真实登录审计后展示时间、设备、IP、地区和状态。">
        <EmptyState
          icon={MonitorSmartphone}
          title="暂无真实登录记录"
          description="当前已移除演示登录记录。后续可从 auth_sessions 或审计日志表中读取真实登录历史。"
        />
      </SectionCard>

      <SectionCard title="异常提醒" description="接入安全检测接口后展示需要处理的风险事件。">
        <EmptyState
          icon={AlertTriangle}
          title="暂无真实异常提醒"
          description="后续可根据 IP 变化、设备变化、失败登录、跨店铺环境混用等规则生成风险提醒。"
        />
      </SectionCard>

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
    </div>
  );
}
