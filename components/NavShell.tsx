"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface NavShellContextValue {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const NavShellContext = createContext<NavShellContextValue | null>(null);

export function NavShellProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  // Auto-close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const value = useMemo(
    () => ({ mobileOpen, openMobile, closeMobile, toggleMobile }),
    [mobileOpen, openMobile, closeMobile, toggleMobile]
  );

  return <NavShellContext.Provider value={value}>{children}</NavShellContext.Provider>;
}

export function useNavShell(): NavShellContextValue {
  const ctx = useContext(NavShellContext);
  if (!ctx) {
    // Fallback no-op so components can render outside the provider (e.g. tests)
    return {
      mobileOpen: false,
      openMobile: () => {},
      closeMobile: () => {},
      toggleMobile: () => {},
    };
  }
  return ctx;
}
