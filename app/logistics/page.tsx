"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, MapPin, PackageCheck, Search, Truck } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CopyableBlock, { CopyTextButton } from "@/components/ui/CopyableBlock";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const STATUSES = ["已下单", "仓库处理中", "已发货", "清关中", "派送中", "已签收", "异常延迟"];

type LogisticsResult = {
  orderNo: string;
  status: string;
  carrier: string;
  country: string;
  eta: string;
  timeline: { status: string; time: string; desc: string; done: boolean }[];
  customerMessage: string;
};

function hashOrder(orderNo: string) {
  return orderNo.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function mockTrack(orderNo: string): LogisticsResult {
  const hash = hashOrder(orderNo);
  const statusIndex = hash % STATUSES.length;
  const status = STATUSES[statusIndex];
  const carrier = ["YunExpress", "J&T Express", "SPX", "DHL eCommerce", "Ninja Van"][hash % 5];
  const country = ["美国", "泰国", "越南", "印尼", "日本"][hash % 5];
  const today = new Date();
  const etaDate = new Date(today);
  etaDate.setDate(today.getDate() + 3 + (hash % 5));
  const currentIndex = status === "异常延迟" ? 4 : statusIndex;
  const timeline = STATUSES.slice(0, 6).map((item, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - currentIndex + index);
    return {
      status: item,
      time: date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      desc:
        item === "已下单"
          ? "订单已创建，等待仓库接单。"
          : item === "仓库处理中"
            ? "仓库正在拣货、打包并生成运单。"
            : item === "已发货"
              ? "包裹已交给承运商，物流开始更新。"
              : item === "清关中"
                ? "包裹已进入目的国清关流程。"
                : item === "派送中"
                  ? "当地承运商正在安排末端派送。"
                  : "包裹已完成签收。",
      done: index <= currentIndex && status !== "异常延迟",
    };
  });
  if (status === "异常延迟") {
    timeline.splice(5, 0, {
      status: "异常延迟",
      time: today.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      desc: "物流超过预计节点，建议客服主动解释并承诺持续跟进。",
      done: true,
    });
  }

  const customerMessage =
    status === "异常延迟"
      ? `您好，您的订单 ${orderNo} 当前物流出现延迟，我们已经记录并会持续跟进承运商更新。延迟通常与清关、航班或当地派送积压有关，有新状态后我们会第一时间通知您。`
      : `您好，您的订单 ${orderNo} 当前状态为「${status}」，承运商为 ${carrier}，预计送达时间为 ${etaDate.toLocaleDateString("zh-CN")}。我们会继续关注物流更新，请您放心。`;

  return {
    orderNo,
    status,
    carrier,
    country,
    eta: etaDate.toLocaleDateString("zh-CN"),
    timeline,
    customerMessage,
  };
}

function statusTone(status: string): "green" | "orange" | "red" | "blue" {
  if (status === "已签收") return "green";
  if (status === "异常延迟") return "red";
  if (status === "清关中" || status === "派送中") return "orange";
  return "blue";
}

export default function LogisticsPage() {
  const [orderNo, setOrderNo] = useState("SP202605130018");
  const [result, setResult] = useState<LogisticsResult | null>(null);
  const canSearch = useMemo(() => orderNo.trim().length > 0, [orderNo]);

  function handleSearch() {
    setResult(mockTrack(orderNo.trim()));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Truck}
        title="物流跟进"
        badge="订单追踪"
        description="输入订单号后 mock 返回物流状态、时间线，并生成可发给客户的物流解释话术。"
        action={
          <Button icon={Search} onClick={handleSearch} disabled={!canSearch}>
            查询物流
          </Button>
        }
      />

      <SectionCard title="订单查询" description="不同订单号会生成不同 mock 节点。">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={orderNo}
            onChange={(event) => setOrderNo(event.target.value)}
            placeholder="请输入订单号"
            className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
          />
          <Button icon={PackageCheck} onClick={handleSearch} disabled={!canSearch}>
            生成物流结果
          </Button>
        </div>
      </SectionCard>

      {result ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <div className="text-[12px] text-apple-gray-300">订单号</div>
              <div className="mt-1 truncate text-[15px] font-semibold text-apple-gray-900">{result.orderNo}</div>
            </div>
            <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <div className="text-[12px] text-apple-gray-300">物流状态</div>
              <div className="mt-2"><Badge tone={statusTone(result.status)}>{result.status}</Badge></div>
            </div>
            <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <div className="text-[12px] text-apple-gray-300">承运商</div>
              <div className="mt-1 text-[15px] font-semibold text-apple-gray-900">{result.carrier}</div>
            </div>
            <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <div className="text-[12px] text-apple-gray-300">目的国家</div>
              <div className="mt-1 text-[15px] font-semibold text-apple-gray-900">{result.country}</div>
            </div>
            <div className="rounded-2xl border border-apple-gray-100 bg-white p-4">
              <div className="text-[12px] text-apple-gray-300">预计送达</div>
              <div className="mt-1 text-[15px] font-semibold text-apple-gray-900">{result.eta}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
            <SectionCard title="物流时间线" description="展示已完成节点和当前节点。">
              <div className="space-y-0">
                {result.timeline.map((item, index) => {
                  const active = item.status === result.status;
                  return (
                    <div key={`${item.status}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                      {index < result.timeline.length - 1 && <div className="absolute left-[15px] top-8 h-full w-px bg-apple-gray-100" />}
                      <div className={["relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", item.done || active ? "bg-apple-blue text-white" : "bg-apple-gray-100 text-apple-gray-300"].join(" ")}>
                        {item.status === "异常延迟" ? <AlertTriangle className="h-4 w-4" /> : item.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl border border-apple-gray-100 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-apple-gray-900">{item.status}</span>
                            {active && <Badge tone={statusTone(result.status)} size="sm">当前</Badge>}
                          </div>
                          <span className="text-[12px] text-apple-gray-300">{item.time}</span>
                        </div>
                        <div className="mt-1 text-[13px] leading-relaxed text-apple-gray-300">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="客户解释话术" action={<CopyTextButton text={result.customerMessage} />}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-apple-gray-900">
                  <MapPin className="h-4 w-4 text-apple-blue" />
                  当前物流说明
                </div>
                <p className="text-[13px] leading-relaxed text-apple-gray-900">{result.customerMessage}</p>
                <CopyableBlock title="可发送话术" text={result.customerMessage}>{result.customerMessage}</CopyableBlock>
              </div>
            </SectionCard>
          </div>
        </>
      ) : (
        <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-apple-gray-200 bg-apple-gray-50/50 text-center">
          <div>
            <Truck className="mx-auto mb-3 h-8 w-8 text-apple-gray-300" />
            <div className="text-[14px] font-medium text-apple-gray-900">输入订单号后查询物流</div>
            <div className="mt-1 text-[12px] text-apple-gray-300">状态、时间线和客户解释话术会显示在这里。</div>
          </div>
        </div>
      )}
    </div>
  );
}
