"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardCheck, ExternalLink, PlugZap, Rocket, Store } from "lucide-react";

import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import {
  dryRunTikTokShopPublish,
  validateTikTokShopProductDraft,
} from "@/lib/api/tiktok-shop";
import type { TikTokShopListingDraft } from "@/lib/server/tiktok-shop";

type TikTokShopStatus = {
  configured: boolean;
  mode: "mock" | "live";
  missingEnv: string[];
  appKey: string | null;
  apiBaseUrl: string;
  authUrl: string | null;
};

type ValidationIssue = {
  field: string;
  severity: "error" | "warning";
  message: string;
};

const sampleDraft: TikTokShopListingDraft = {
  region: "US",
  title: "Sample TikTok Shop listing draft",
  description: "Local validation draft for future TikTok Shop publishing.",
  categoryId: "sample-category",
  brandId: null,
  price: 19.99,
  currency: "USD",
  stock: 10,
  warehouseId: "sample-warehouse",
  packageWeightKg: 0.3,
  packageDimensionsCm: { length: 20, width: 15, height: 5 },
  images: ["https://placehold.co/800x800"],
  attributes: [{ name: "Material", value: "Mixed" }],
  skus: [{ sellerSku: "sample-sku", price: 19.99, stock: 10 }],
  sourceUrl: null,
};

export default function TikTokShopPage() {
  return (
    <Suspense fallback={<div className="text-[13px] text-apple-gray-300">Loading TikTok Shop workspace...</div>}>
      <TikTokShopPageInner />
    </Suspense>
  );
}

function TikTokShopPageInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId")?.trim() || "";
  const [status, setStatus] = useState<TikTokShopStatus | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [message, setMessage] = useState("");
  const [productDraft, setProductDraft] = useState<TikTokShopListingDraft | null>(null);
  const [productDraftValid, setProductDraftValid] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, []);

  const readyItems = useMemo(
    () => [
      { label: "Store model exists", done: true },
      { label: "Listing draft validator exists", done: true },
      { label: "Dry-run publish API exists", done: true },
      { label: "TikTok Shop app credentials configured", done: Boolean(status?.configured) },
      { label: "OAuth callback receives authorization code", done: true },
      { label: "Token exchange and encrypted storage", done: false },
      { label: "Live product upload", done: false },
    ],
    [status?.configured]
  );

  async function loadStatus() {
    const response = await fetch("/api/tiktok-shop/status", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { tiktokShop: TikTokShopStatus };
    setStatus(body.tiktokShop);
  }

  async function createAuthUrl() {
    setMessage("");
    const response = await fetch("/api/tiktok-shop/auth-url", { method: "POST" });
    const body = (await response.json()) as { ok?: boolean; url?: string; message?: string };
    if (!body.ok || !body.url) {
      setMessage(body.message || "Unable to create authorization URL.");
      return;
    }
    window.open(body.url, "_blank", "noopener,noreferrer");
    setMessage("Authorization URL opened in a new tab.");
  }

  async function validateSample() {
    setMessage("");
    const response = await fetch("/api/tiktok-shop/validate-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: sampleDraft }),
    });
    const body = (await response.json()) as { valid?: boolean; issues?: ValidationIssue[]; message?: string };
    setIssues(body.issues ?? []);
    setMessage(body.valid ? "Sample draft passed validation." : body.message || "Sample draft needs more data.");
  }

  async function dryRunSample() {
    setMessage("");
    const response = await fetch("/api/tiktok-shop/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: sampleDraft, dryRun: true }),
    });
    const body = (await response.json()) as { message?: string; issues?: ValidationIssue[] };
    setIssues(body.issues ?? []);
    setMessage(body.message || (response.ok ? "Dry-run completed." : "Dry-run failed."));
  }

  const validateProductDraft = useCallback(async (nextProductId = productId) => {
    if (!nextProductId) return;
    setDraftLoading(true);
    setMessage("");
    const body = await validateTikTokShopProductDraft({ productId: nextProductId });
    setProductDraft(body.draft ?? null);
    setProductDraftValid(Boolean(body.valid));
    setIssues(body.issues ?? []);
    setMessage(
      body.valid
        ? "Product draft passed local validation."
        : body.message || "Product draft generated. Some fields still need completion."
    );
    setDraftLoading(false);
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    void validateProductDraft(productId);
  }, [productId, validateProductDraft]);

  async function dryRunProductDraft() {
    if (!productDraft) return;
    setMessage("");
    const body = await dryRunTikTokShopPublish(productDraft);
    setIssues(body.issues ?? []);
    setMessage(body.message || (body.ok ? "Dry-run completed." : "Dry-run failed."));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Store}
        title="TikTok Shop integration"
        badge={status?.mode === "live" ? "Live config" : "Mock mode"}
        description="Prepare authorization, listing validation, and product publishing for a connected TikTok Shop store."
      />

      {productId ? (
        <SectionCard
          title="Product TikTok Shop draft"
          description="Generated from the selected product. Complete category, warehouse, dimensions, attributes, and brand policy before live publishing."
          action={
            <Link
              href={`/products/${encodeURIComponent(productId)}`}
              className="inline-flex items-center gap-1 text-[12.5px] text-apple-blue hover:underline"
            >
              Product detail <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {draftLoading ? (
            <div className="text-[13px] text-apple-gray-300">Generating draft...</div>
          ) : productDraft ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <div>
                  <div className="text-[12px] text-apple-gray-300">Title</div>
                  <div className="text-[14px] font-semibold text-apple-gray-900">{productDraft.title}</div>
                </div>
                <div>
                  <div className="text-[12px] text-apple-gray-300">Description</div>
                  <div className="line-clamp-4 whitespace-pre-line text-[12.5px] leading-relaxed text-apple-gray-900">
                    {productDraft.description}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="gray">Region {productDraft.region}</Badge>
                  <Badge tone="gray">{productDraft.currency} {productDraft.price}</Badge>
                  <Badge tone="gray">Stock {productDraft.stock}</Badge>
                  <Badge tone={productDraftValid ? "green" : "orange"}>
                    {productDraftValid ? "valid" : "needs work"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Button type="button" variant="secondary" icon={ClipboardCheck} onClick={() => void validateProductDraft()}>
                  Revalidate
                </Button>
                <Button type="button" icon={Rocket} onClick={dryRunProductDraft} disabled={!productDraftValid}>
                  Dry-run product
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-apple-gray-300">
              No draft generated yet. Check that the product exists in the product library.
            </div>
          )}
        </SectionCard>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
        <SectionCard title="Connection status" description="Current environment readiness for TikTok Shop Open API.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-apple-gray-100 bg-apple-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-apple-gray-900">
                    {status?.configured ? "Credentials configured" : "Waiting for credentials"}
                  </div>
                  <div className="mt-1 text-[12px] text-apple-gray-300">
                    API base: {status?.apiBaseUrl || "-"}
                  </div>
                </div>
                <Badge tone={status?.configured ? "green" : "orange"}>
                  {status?.configured ? "ready" : "mock"}
                </Badge>
              </div>
            </div>

            {status?.missingEnv?.length ? (
              <div className="rounded-2xl border border-apple-orange/20 bg-apple-orange/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-apple-gray-900">
                  <AlertTriangle className="h-4 w-4 text-apple-orange" />
                  Missing env
                </div>
                <div className="flex flex-wrap gap-2">
                  {status.missingEnv.map((item) => (
                    <code key={item} className="rounded-lg bg-white px-2 py-1 text-[12px] text-apple-gray-900">
                      {item}
                    </code>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" icon={PlugZap} onClick={createAuthUrl}>
                Open auth
              </Button>
              <Button type="button" variant="secondary" icon={ClipboardCheck} onClick={validateSample}>
                Validate sample
              </Button>
              <Button type="button" icon={Rocket} onClick={dryRunSample}>
                Dry-run sample
              </Button>
            </div>
            {message && <div className="text-[12px] text-apple-gray-300">{message}</div>}
          </div>
        </SectionCard>

        <SectionCard title="Implementation checklist" description="What is already in place and what remains before live upload.">
          <div className="space-y-3">
            {readyItems.map((item) => {
              const Icon = item.done ? CheckCircle2 : PlugZap;
              return (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-apple-gray-100 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <Icon className={["h-4 w-4", item.done ? "text-apple-green" : "text-apple-gray-300"].join(" ")} />
                    <span className="text-[13px] text-apple-gray-900">{item.label}</span>
                  </div>
                  <Badge tone={item.done ? "green" : "gray"}>{item.done ? "done" : "todo"}</Badge>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {issues.length ? (
        <SectionCard title="Latest validation issues">
          <div className="space-y-2">
            {issues.map((issue) => (
              <div key={`${issue.field}-${issue.message}`} className="rounded-xl bg-apple-gray-50 px-3 py-2 text-[12px] text-apple-gray-900">
                <Badge tone={issue.severity === "error" ? "red" : "orange"}>{issue.severity}</Badge>
                <span className="ml-2 font-medium">{issue.field}</span>
                <span className="ml-2 text-apple-gray-300">{issue.message}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
