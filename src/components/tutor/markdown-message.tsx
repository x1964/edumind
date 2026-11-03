"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="space-y-2.5 text-[13.5px] leading-[1.85] text-ink-soft [&_a]:text-brand-ink [&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:border-brand/40 [&_blockquote]:ps-3 [&_blockquote]:text-ink-muted [&_code]:rounded [&_code]:bg-black/[0.06] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_h1]:mt-4 [&_h1]:text-[17px] [&_h1]:font-semibold [&_h1]:text-ink [&_h2]:mt-4 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:text-[13.5px] [&_h3]:font-semibold [&_h3]:text-ink [&_li]:my-1 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-hairline [&_pre]:bg-surface-deep [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:text-ink [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-hairline [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-hairline [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:ps-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
