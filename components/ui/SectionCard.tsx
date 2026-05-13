import type { ReactNode } from "react";

export default function SectionCard({
  title,
  description,
  action,
  footer,
  children,
  className = "",
  bodyClassName = "p-6",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={[
        "bg-white rounded-2xl shadow-card border border-black/[0.03]",
        className,
      ].join(" ")}
    >
      {(title || action || description) && (
        <header className="flex items-start justify-between gap-3 px-6 py-5 border-b border-apple-gray-100">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[15px] font-semibold text-apple-gray-900 leading-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[12px] text-apple-gray-300 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && (
        <footer className="px-6 py-4 border-t border-apple-gray-100 bg-apple-gray-50/40 rounded-b-2xl">
          {footer}
        </footer>
      )}
    </section>
  );
}
