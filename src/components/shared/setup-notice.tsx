import { Database, Sparkles } from "lucide-react";

export function SupabaseSetupNotice({
  title,
  body,
  docs,
  env,
}: {
  title: string;
  body: string;
  docs: string;
  env: string;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-6 py-10 text-center shadow-card">
      <div className="grid size-12 place-items-center rounded-2xl border border-amber-500/25 bg-amber-500/[0.12] text-amber-700">
        <Database className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{body}</p>
      <code className="mt-4 rounded-lg border border-hairline bg-surface-deep px-3 py-2 font-mono text-[12px] text-ink-soft">
        NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY
      </code>
      <p className="mt-3 text-[12px] text-ink-muted">{env}</p>
      <p className="mt-1 text-[12px] text-ink-muted">{docs}</p>
    </div>
  );
}

export function AiSetupNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-amber-500/25 bg-amber-500/[0.12] text-amber-700">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">{body}</p>
      <code className="mt-4 rounded-lg border border-hairline bg-surface-deep px-3 py-2 font-mono text-[12px] text-ink-soft">
        AI_BASE_URL · AI_API_KEY · AI_MODEL
      </code>
    </div>
  );
}
