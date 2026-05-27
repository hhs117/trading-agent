"use client";

import { useMemo, useState } from "react";
import { MapPin, PackageCheck, Search, Truck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

export default function LogisticsPage() {
  const [orderNo, setOrderNo] = useState("");
  const [message, setMessage] = useState("");
  const canSearch = useMemo(() => orderNo.trim().length > 0, [orderNo]);

  function handleSearch() {
    setMessage("物流真实接口还没有接入，当前不会生成本地模拟物流状态。");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Truck}
        title="物流跟进"
        badge="待接入物流接口"
        description="输入订单号后查询真实物流状态、时间线，并生成可发给客户的物流解释话术。"
        action={
          <Button icon={Search} onClick={handleSearch} disabled={!canSearch}>
            查询物流
          </Button>
        }
      />

      <SectionCard title="订单查询" description="接入物流服务商或平台订单接口后，这里会返回真实物流节点。">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={orderNo}
            onChange={(event) => {
              setOrderNo(event.target.value);
              if (message) setMessage("");
            }}
            placeholder="请输入订单号"
            className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
          />
          <Button icon={PackageCheck} onClick={handleSearch} disabled={!canSearch}>
            查询物流
          </Button>
        </div>
        {message && (
          <div className="mt-3 rounded-xl border border-apple-orange/20 bg-apple-orange/5 px-4 py-3 text-[12.5px] text-apple-orange">
            {message}
          </div>
        )}
      </SectionCard>

      <SectionCard title="物流时间线" description="已下单、仓库处理中、已发货、清关中、派送中、已签收、异常延迟。">
        <EmptyState
          icon={MapPin}
          title="暂无真实物流记录"
          description="当前已移除本地演示物流节点。接入 Shopee 订单接口或第三方物流接口后，这里会展示真实时间线。"
        />
      </SectionCard>
    </div>
  );
}
