import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-hairline-strong bg-surface-deep transition-colors checked:border-brand checked:bg-brand checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%2304130c%22 stroke-width=%222.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m3.5 8 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat focus-visible:ring-2 focus-visible:ring-brand/30",
        className
      )}
      {...props}
    />
  );
}
