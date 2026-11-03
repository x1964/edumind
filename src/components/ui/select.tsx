import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full min-w-0 appearance-none rounded-xl border border-hairline bg-surface-deep/70 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23707d74%22 stroke-width=%221.8%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[length:16px] bg-[position:right_0.85rem_center] bg-no-repeat px-3.5 pe-9 text-sm text-ink transition-colors focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60 rtl:bg-[position:left_0.85rem_center]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
