"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.ok) {
          const body = (await response.json()) as {
            user?: { mustChangePassword?: boolean };
          };
          if (body.user?.mustChangePassword && pathname !== "/change-password") {
            router.replace("/change-password");
            return;
          }
          if (active) setReady(true);
          return;
        }
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .catch(() => {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      });
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-apple-gray-300">
        验证登录状态...
      </div>
    );
  }

  return <>{children}</>;
}
