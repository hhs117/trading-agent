"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.nextPassword !== form.confirmPassword) {
      setError("两次输入的新密码不一致。");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          nextPassword: form.nextPassword,
        }),
      });
      const body = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        setError(body.message || "修改失败，请稍后再试。");
        return;
      }

      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-apple-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-apple-gray-100 bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apple-blue text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-apple-gray-900">首次登录请修改密码</h1>
            <p className="mt-0.5 text-[12px] text-apple-gray-300">为了账号安全，临时密码只能用一次。</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordInput
            label="当前密码"
            value={form.currentPassword}
            onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
          />
          <PasswordInput
            label="新密码"
            value={form.nextPassword}
            onChange={(value) => setForm((current) => ({ ...current, nextPassword: value }))}
          />
          <PasswordInput
            label="确认新密码"
            value={form.confirmPassword}
            onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
          />

          {error && <div className="rounded-xl bg-apple-red/10 px-3 py-2 text-[12px] text-apple-red">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-apple-blue px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {loading ? "保存中..." : "保存新密码"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-apple-gray-300">{label}</label>
      <input
        type="password"
        minLength={10}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
      />
    </div>
  );
}
