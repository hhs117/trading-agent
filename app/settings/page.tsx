"use client";

import { useCallback, useEffect, useState } from "react";

import { Card, CardBody, CardHeader } from "@/components/Card";

type Me = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "viewer";
};

type User = Me & {
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    nextPassword: "",
  });
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "operator" as User["role"],
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/users", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { users: User[] };
    setUsers(body.users);
  }, []);

  const loadMe = useCallback(async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { user: Me };
    setMe(body.user);
    if (body.user.role === "admin") {
      void loadUsers();
    }
  }, [loadUsers]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    const body = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !body.ok) {
      setPasswordMessage(body.message || "修改失败");
      return;
    }
    setPasswordForm({ currentPassword: "", nextPassword: "" });
    setPasswordMessage("密码已更新");
  }

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserMessage("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const body = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !body.ok) {
      setUserMessage(body.message || "创建失败");
      return;
    }
    setNewUser({ email: "", name: "", password: "", role: "operator" });
    setUserMessage("账号已创建");
    void loadUsers();
  }

  return (
    <div className="max-w-4xl space-y-6 fade-in">
      <Card>
        <CardHeader title="账号安全" />
        <CardBody className="space-y-4">
          {me && (
            <div className="rounded-xl bg-apple-gray-50 px-4 py-3 text-[13px] text-apple-gray-900">
              当前账号：<span className="font-medium">{me.name}</span> · {me.email} · {me.role}
            </div>
          )}
          <form onSubmit={changePassword} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
              }
              placeholder="当前密码"
              className="rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
            />
            <input
              type="password"
              value={passwordForm.nextPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))
              }
              placeholder="新密码，至少 10 位"
              className="rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
            />
            <button className="rounded-xl bg-apple-blue px-4 py-2.5 text-[13px] font-medium text-white">
              修改密码
            </button>
          </form>
          {passwordMessage && <div className="text-[12px] text-apple-gray-300">{passwordMessage}</div>}
        </CardBody>
      </Card>

      {me?.role === "admin" && (
        <Card>
          <CardHeader title="成员管理" />
          <CardBody className="space-y-5">
            <form onSubmit={createUser} className="grid gap-3 md:grid-cols-2">
              <input
                value={newUser.name}
                onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))}
                placeholder="姓名"
                className="rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
              <input
                value={newUser.email}
                onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
                placeholder="邮箱"
                className="rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
              <input
                type="password"
                value={newUser.password}
                onChange={(event) =>
                  setNewUser((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="初始密码，至少 10 位"
                className="rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
              />
              <div className="flex gap-3">
                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((current) => ({ ...current, role: event.target.value as User["role"] }))
                  }
                  className="min-w-0 flex-1 rounded-xl border border-apple-gray-100 bg-apple-gray-50 px-3 py-2.5 text-[13px] outline-none focus:border-apple-blue"
                >
                  <option value="operator">operator</option>
                  <option value="viewer">viewer</option>
                  <option value="admin">admin</option>
                </select>
                <button className="rounded-xl bg-apple-blue px-4 py-2.5 text-[13px] font-medium text-white">
                  新建账号
                </button>
              </div>
            </form>
            {userMessage && <div className="text-[12px] text-apple-gray-300">{userMessage}</div>}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[13px]">
                <thead className="text-left text-apple-gray-300">
                  <tr>
                    <th className="py-2">姓名</th>
                    <th className="py-2">邮箱</th>
                    <th className="py-2">角色</th>
                    <th className="py-2">状态</th>
                    <th className="py-2">最近登录</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-100">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="py-3 font-medium text-apple-gray-900">{user.name}</td>
                      <td className="py-3 text-apple-gray-900">{user.email}</td>
                      <td className="py-3 text-apple-gray-300">{user.role}</td>
                      <td className="py-3 text-apple-gray-300">{user.isActive ? "启用" : "停用"}</td>
                      <td className="py-3 text-apple-gray-300">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "尚未登录"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
