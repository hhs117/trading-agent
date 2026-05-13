import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-apple-blue text-white hover:bg-blue-600",
  secondary:
    "bg-white text-apple-gray-900 border border-apple-gray-100 hover:border-apple-gray-200 hover:bg-apple-gray-50",
  ghost: "text-apple-gray-900 hover:bg-apple-gray-50",
  danger: "bg-apple-red text-white hover:bg-red-600",
};

const SIZE: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[12px] rounded-lg gap-1.5",
  md: "px-4 py-2 text-[13px] rounded-xl gap-1.5",
  lg: "px-5 py-2.5 text-[14px] rounded-xl gap-2",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  children,
  className = "",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(" ")}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {IconRight && <IconRight className="w-4 h-4" />}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  children,
  className = "",
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors",
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(" ")}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {IconRight && <IconRight className="w-4 h-4" />}
    </Link>
  );
}
