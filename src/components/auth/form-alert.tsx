import { AlertCircle, CheckCircle2 } from "lucide-react";

export function FormAlert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-[#ef4444]/25 bg-[#ef4444]/[0.07] text-[#b91c1c]",
    success: "border-brand/25 bg-brand/[0.07] text-brand-ink",
    info: "border-sky-400/25 bg-sky-400/[0.07] text-sky-200",
  }[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed ${styles}`}
    >
      {tone === "success" ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
