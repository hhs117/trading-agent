import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  hoverable = false,
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}) {
  return (
    <div
      className={[
        "bg-white rounded-2xl shadow-card border border-black/[0.03]",
        hoverable ? "hover:shadow-hover transition-shadow" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-apple-gray-100">
      <h3 className="text-[15px] font-semibold text-apple-gray-900">{title}</h3>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={["p-6", className].join(" ")}>{children}</div>;
}
