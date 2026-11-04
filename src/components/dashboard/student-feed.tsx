"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import {
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Newspaper,
  Send,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import type { Lang } from "@/lib/i18n";

type FeedPost = {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
};
type FeedComment = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
};
type FeedPage = {
  posts: FeedPost[];
  hasMore: boolean;
  nextCursor: { before: string; beforeId: string } | null;
};

const IMAGE_LIMIT = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function Avatar({
  name,
  src,
  size = "size-11",
}: {
  name: string;
  src?: string | null;
  size?: string;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "E";
  const dimension = size === "size-8" ? 32 : 44;
  return (
    <span
      className={`${size} relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-brand/15 bg-brand/[0.08] text-sm font-semibold text-brand-ink`}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={dimension}
          height={dimension}
          sizes={`${dimension}px`}
          unoptimized
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

function relativeTime(value: string, lang: Lang) {
  const delta = (new Date(value).getTime() - Date.now()) / 1000;
  const absolute = Math.abs(delta);
  let unit: Intl.RelativeTimeFormatUnit = "day";
  let seconds = 86_400;
  if (absolute < 60) {
    unit = "second";
    seconds = 1;
  } else if (absolute < 3600) {
    unit = "minute";
    seconds = 60;
  } else if (absolute < 86_400) {
    unit = "hour";
    seconds = 3600;
  }
  return new Intl.RelativeTimeFormat(lang === "ar" ? "ar" : "en", { numeric: "auto" }).format(
    Math.round(delta / seconds),
    unit
  );
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function StudentFeed({
  lang,
  userId,
  fullName,
  avatarUrl,
}: {
  lang: Lang;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
}) {
  const ar = lang === "ar";
  const t = ar
    ? {
        title: "Student Feed",
        description: "شارك أفكارك، واسأل، وتعلّم معًا.",
        placeholder: "بماذا تود أن تشارك اليوم؟",
        publish: "نشر",
        publishing: "جارٍ النشر…",
        addImage: "إضافة صورة",
        removeImage: "إزالة الصورة",
        like: "إعجاب",
        unlike: "إلغاء الإعجاب",
        comment: "تعليق",
        comments: "التعليقات",
        send: "إرسال",
        emptyTitle: "ابدأ المحادثة الدراسية",
        emptyBody: "كن أول من يشارك فكرة أو سؤالًا مع زملائك.",
        loading: "جارٍ تحميل المنشورات…",
        loadMore: "تحميل منشورات أقدم",
        loadingMore: "جارٍ التحميل…",
        retry: "إعادة المحاولة",
        loadError: "تعذر تحميل المنشورات. حاول مرة أخرى.",
        postError: "تعذر نشر المنشور. تحقق من اتصالك وحاول مجددًا.",
        posted: "تم نشر منشورك.",
        imageInvalid: "اختر صورة PNG أو JPG أو WebP بحجم لا يتجاوز 5 ميجابايت.",
        commentPlaceholder: "اكتب تعليقًا…",
        commentError: "تعذر إرسال التعليق.",
        delete: "حذف المنشور",
        deleteComment: "حذف التعليق",
        confirmDeleteComment: "هل تريد حذف هذا التعليق؟",
        report: "الإبلاغ عن المنشور",
        reportTitle: "الإبلاغ عن منشور",
        reportReason: "سبب الإبلاغ",
        chooseReason: "اختر سببًا",
        submitReport: "إرسال البلاغ",
        cancel: "إلغاء",
        reportSent: "تم استلام البلاغ. شكرًا لمساعدتنا في الحفاظ على مجتمع آمن.",
        alreadyReported: "سبق أن أبلغت عن هذا المنشور.",
        reportError: "تعذر إرسال البلاغ.",
        deleteError: "تعذر الحذف. حاول مرة أخرى.",
        imageCleanupWarning: "تم حذف المنشور، لكن تعذر حذف صورته من التخزين.",
        options: "خيارات المنشور",
        noComments: "لا توجد تعليقات بعد. ابدأ النقاش.",
        commentsError: "تعذر تحميل التعليقات.",
        countLike: "إعجاب",
        countComments: "تعليق",
        spam: "محتوى مزعج",
        harassment: "مضايقة أو إساءة",
        inappropriate: "محتوى غير مناسب",
        misinformation: "معلومات مضللة",
        other: "سبب آخر",
        rateLimited: "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.",
      }
    : {
        title: "Student Feed",
        description: "Share your thoughts, ask questions, and learn together.",
        placeholder: "What would you like to share today?",
        publish: "Publish",
        publishing: "Publishing…",
        addImage: "Add image",
        removeImage: "Remove image",
        like: "Like",
        unlike: "Unlike",
        comment: "Comment",
        comments: "Comments",
        send: "Send",
        emptyTitle: "Start the study conversation",
        emptyBody: "Be the first to share an idea or question with your classmates.",
        loading: "Loading posts…",
        loadMore: "Load older posts",
        loadingMore: "Loading…",
        retry: "Try again",
        loadError: "Could not load posts. Please try again.",
        postError: "Could not publish your post. Check your connection and try again.",
        posted: "Your post is live.",
        imageInvalid: "Choose a PNG, JPG, or WebP image under 5 MB.",
        commentPlaceholder: "Write a comment…",
        commentError: "Could not send your comment.",
        delete: "Delete post",
        deleteComment: "Delete comment",
        confirmDeleteComment: "Delete this comment?",
        report: "Report post",
        reportTitle: "Report a post",
        reportReason: "Reason for report",
        chooseReason: "Choose a reason",
        submitReport: "Submit report",
        cancel: "Cancel",
        reportSent: "Report received. Thanks for helping keep the community safe.",
        alreadyReported: "You already reported this post.",
        reportError: "Could not submit the report.",
        deleteError: "Could not delete this item. Please try again.",
        imageCleanupWarning: "Post deleted, but its image could not be removed from storage.",
        options: "Post options",
        noComments: "No comments yet. Start the conversation.",
        commentsError: "Could not load comments.",
        countLike: "likes",
        countComments: "comments",
        spam: "Spam",
        harassment: "Harassment or abuse",
        inappropriate: "Inappropriate content",
        misinformation: "Misinformation",
        other: "Other",
        rateLimited: "Too many attempts. Please wait a moment and try again.",
      };

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<FeedPage["nextCursor"]>(null);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pendingLikes, setPendingLikes] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewRatio, setPreviewRatio] = useState(16 / 9);
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [publishing, setPublishing] = useState(false);
  const submitLock = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [menuPost, setMenuPost] = useState<string | null>(null);
  const [reportPost, setReportPost] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const fetchPage = useCallback(async (next: FeedPage["nextCursor"] = null) => {
    const query = next
      ? `?before=${encodeURIComponent(next.before)}&beforeId=${encodeURIComponent(next.beforeId)}`
      : "";
    const response = await fetch(`/api/student-feed${query}`, { cache: "no-store" });
    const result = await readJson(response);
    if (!response.ok) throw new Error(String(result.error ?? "load_failed"));
    return result as FeedPage;
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const page = await fetchPage();
      setPosts(page.posts);
      setHasMore(page.hasMore);
      setCursor(page.nextCursor);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const page = await fetchPage();
        if (!active) return;
        setPosts(page.posts);
        setHasMore(page.hasMore);
        setCursor(page.nextCursor);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, [fetchPage]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  function setImage(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setPreviewRatio(16 / 9);
    if (!next) return;
    if (!IMAGE_TYPES.includes(next.type) || next.size > IMAGE_LIMIT || next.size <= 0) {
      setNotice({ text: t.imageInvalid, error: true });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setPreviewRatio(16 / 9);
    setNotice(null);
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null);
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current || publishing) return;
    if (!content.trim()) {
      setNotice({ text: t.postError, error: true });
      return;
    }
    submitLock.current = true;
    setPublishing(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.set("content", content.trim());
      if (file) form.set("image", file);
      const response = await fetch("/api/student-feed", { method: "POST", body: form });
      const result = await readJson(response);
      if (!response.ok) throw new Error(String(result.error ?? "publish_failed"));
      setPosts((current) => [result.post as FeedPost, ...current]);
      setContent("");
      setImage(null);
      if (inputRef.current) inputRef.current.value = "";
      setNotice({ text: t.posted });
    } catch (error) {
      setNotice({
        text:
          error instanceof Error && error.message === "rate_limited" ? t.rateLimited : t.postError,
        error: true,
      });
    } finally {
      submitLock.current = false;
      setPublishing(false);
    }
  }

  async function toggleLike(post: FeedPost) {
    if (pendingLikes.includes(post.id)) return;
    setPendingLikes((current) => [...current, post.id]);
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likesCount: Math.max(0, item.likesCount + (item.likedByMe ? -1 : 1)),
            }
          : item
      )
    );
    try {
      const response = await fetch("/api/student-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", postId: post.id }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error("like_failed");
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: Boolean(result.liked), likesCount: Number(result.likesCount) }
            : item
        )
      );
    } catch {
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: post.likedByMe, likesCount: post.likesCount }
            : item
        )
      );
      setNotice({ text: t.postError, error: true });
    } finally {
      setPendingLikes((current) => current.filter((id) => id !== post.id));
    }
  }

  async function toggleComments(postId: string) {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(postId);
    if (comments[postId]) return;
    setCommentsLoading(postId);
    try {
      const response = await fetch(`/api/student-feed?comments=${encodeURIComponent(postId)}`, {
        cache: "no-store",
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error("comments_failed");
      setComments((current) => ({
        ...current,
        [postId]: (result.comments ?? []) as FeedComment[],
      }));
      setPosts((current) =>
        current.map((item) =>
          item.id === postId ? { ...item, commentsCount: Number(result.count ?? 0) } : item
        )
      );
    } catch {
      setNotice({ text: t.commentsError, error: true });
    } finally {
      setCommentsLoading(null);
    }
  }

  async function sendComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    if (!commentDraft.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const response = await fetch("/api/student-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", postId, content: commentDraft.trim() }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(String(result.error ?? "comment_failed"));
      setComments((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), result.comment as FeedComment],
      }));
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? { ...item, commentsCount: Number(result.count ?? item.commentsCount + 1) }
            : item
        )
      );
      setCommentDraft("");
    } catch (error) {
      setNotice({
        text:
          error instanceof Error && error.message === "rate_limited"
            ? t.rateLimited
            : t.commentError,
        error: true,
      });
    } finally {
      setSendingComment(false);
    }
  }

  async function deletePost(post: FeedPost) {
    setMenuPost(null);
    setNotice(null);
    const response = await fetch("/api/student-feed", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "post", id: post.id }),
    });
    if (!response.ok) {
      setNotice({ text: t.deleteError, error: true });
      return;
    }
    const result = await readJson(response);
    setPosts((current) => current.filter((item) => item.id !== post.id));
    if (result.imageCleanup === false) {
      setNotice({ text: t.imageCleanupWarning, error: true });
    }
  }

  async function deleteComment(comment: FeedComment) {
    if (!window.confirm(t.confirmDeleteComment)) return;
    const response = await fetch("/api/student-feed", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "comment", id: comment.id }),
    });
    if (!response.ok) {
      setNotice({ text: t.deleteError, error: true });
      return;
    }
    setComments((current) => ({
      ...current,
      [comment.post_id]: (current[comment.post_id] ?? []).filter((item) => item.id !== comment.id),
    }));
    setPosts((current) =>
      current.map((item) =>
        item.id === comment.post_id
          ? { ...item, commentsCount: Math.max(0, item.commentsCount - 1) }
          : item
      )
    );
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportPost || !reportReason || reporting) return;
    setReporting(true);
    try {
      const response = await fetch("/api/student-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report", postId: reportPost, reason: reportReason }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(String(result.error ?? "report_failed"));
      setNotice({ text: t.reportSent });
      setReportPost(null);
      setReportReason("");
      setMenuPost(null);
    } catch (error) {
      const duplicate = error instanceof Error && error.message === "already_reported";
      setNotice({ text: duplicate ? t.alreadyReported : t.reportError, error: !duplicate });
    } finally {
      setReporting(false);
    }
  }

  async function loadMore() {
    if (!cursor || moreLoading) return;
    setMoreLoading(true);
    try {
      const page = await fetchPage(cursor);
      setPosts((current) => [...current, ...page.posts]);
      setHasMore(page.hasMore);
      setCursor(page.nextCursor);
    } catch {
      setNotice({ text: t.loadError, error: true });
    } finally {
      setMoreLoading(false);
    }
  }

  return (
    <main
      dir={ar ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-[740px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl border border-brand/15 bg-brand/[0.07] text-brand-ink">
            <Newspaper className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{t.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t.description}</p>
          </div>
        </div>
      </header>

      <section
        aria-label={ar ? "إنشاء منشور" : "Create a post"}
        className="mb-5 rounded-2xl border border-hairline bg-surface-raised p-4 shadow-card sm:p-5"
      >
        <form onSubmit={publish}>
          <div className="flex items-start gap-3">
            <Avatar name={fullName} src={avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="mb-3 text-sm font-semibold text-ink">{fullName}</div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={3000}
                rows={3}
                placeholder={t.placeholder}
                className="min-h-24 w-full resize-y rounded-xl border border-hairline bg-surface px-3.5 py-3 text-sm leading-6 text-ink placeholder:text-ink-muted focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
              {preview ? (
                <div
                  className="relative mt-3 max-h-72 w-full overflow-hidden rounded-xl border border-hairline"
                  style={{ aspectRatio: previewRatio }}
                >
                  <Image
                    src={preview}
                    alt={ar ? "معاينة الصورة" : "Image preview"}
                    fill
                    sizes="(max-width: 640px) 100vw, 600px"
                    unoptimized
                    onLoad={(event) => {
                      const { naturalWidth, naturalHeight } = event.currentTarget;
                      if (naturalWidth && naturalHeight)
                        setPreviewRatio(naturalWidth / naturalHeight);
                    }}
                    className="object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    aria-label={t.removeImage}
                    className="absolute end-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-surface/95 text-ink shadow-card"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onImageChange}
                className="sr-only"
                aria-label={t.addImage}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand/[0.06] hover:text-brand-ink"
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                {t.addImage}
              </button>
              <span className="text-xs text-ink-muted">{content.length}/3000</span>
            </div>
            <button
              type="submit"
              disabled={publishing || !content.trim()}
              className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  {t.publishing}
                </>
              ) : (
                t.publish
              )}
            </button>
          </div>
          {notice ? (
            <p
              role="status"
              className={`mt-3 text-sm ${notice.error ? "text-danger" : "text-brand-ink"}`}
            >
              {notice.text}
            </p>
          ) : null}
        </form>
      </section>

      <section aria-label={ar ? "المنشورات" : "Posts"} className="space-y-4">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-hairline bg-surface-raised p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-hairline/70" />
                  <div className="space-y-2">
                    <div className="h-3 w-32 rounded bg-hairline/70" />
                    <div className="h-2.5 w-20 rounded bg-hairline/50" />
                  </div>
                </div>
                <div className="mt-5 h-16 rounded-xl bg-hairline/40" />
              </div>
            ))
          : null}
        {!loading && loadError ? (
          <div className="rounded-2xl border border-hairline bg-surface-raised p-8 text-center">
            <p className="text-sm text-ink-muted">{t.loadError}</p>
            <button
              type="button"
              onClick={() => void loadInitial()}
              className="mt-4 rounded-xl border border-hairline px-4 py-2 text-sm font-semibold text-ink"
            >
              {t.retry}
            </button>
          </div>
        ) : null}
        {!loading && !loadError && posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline-strong bg-surface-raised px-6 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/[0.07] text-brand-ink">
              <MessageCircle className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-ink">{t.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-muted">{t.emptyBody}</p>
          </div>
        ) : null}
        {!loading && !loadError
          ? posts.map((post) => (
              <article
                key={post.id}
                className="overflow-visible rounded-2xl border border-hairline bg-surface-raised p-4 shadow-card sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={post.authorName} src={post.authorAvatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{post.authorName}</p>
                    <time dateTime={post.createdAt} className="mt-0.5 block text-xs text-ink-muted">
                      {relativeTime(post.createdAt, lang)}
                    </time>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={t.options}
                      aria-expanded={menuPost === post.id}
                      onClick={() => setMenuPost(menuPost === post.id ? null : post.id)}
                      className="grid size-9 place-items-center rounded-xl text-ink-muted hover:bg-black/[0.04] hover:text-ink"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>
                    {menuPost === post.id ? (
                      <div className="absolute end-0 top-10 z-20 min-w-44 overflow-hidden rounded-xl border border-hairline bg-surface-raised p-1 shadow-pop">
                        {post.userId === userId ? (
                          <button
                            type="button"
                            onClick={() => void deletePost(post)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-sm text-danger hover:bg-danger/5"
                          >
                            <Trash2 className="size-4" />
                            {t.delete}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReportPost(post.id);
                              setMenuPost(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-start text-sm text-ink-soft hover:bg-black/[0.04]"
                          >
                            {t.report}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
                <p
                  dir="auto"
                  className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-ink"
                >
                  {post.content}
                </p>
                {post.imageUrl ? (
                  <div
                    className="relative mt-4 max-h-[520px] w-full overflow-hidden rounded-xl border border-hairline"
                    style={{ aspectRatio: imageRatios[post.id] ?? 16 / 9 }}
                  >
                    <Image
                      src={post.imageUrl}
                      alt={ar ? "صورة مرفقة بمنشور" : "Image attached to post"}
                      fill
                      sizes="(max-width: 740px) 100vw, 700px"
                      unoptimized
                      loading="lazy"
                      onLoad={(event) => {
                        const { naturalWidth, naturalHeight } = event.currentTarget;
                        if (naturalWidth && naturalHeight) {
                          const ratio = naturalWidth / naturalHeight;
                          setImageRatios((current) =>
                            current[post.id] === ratio ? current : { ...current, [post.id]: ratio }
                          );
                        }
                      }}
                      className="object-contain"
                    />
                  </div>
                ) : null}
                <div className="mt-4 flex items-center justify-between border-b border-hairline pb-3 text-xs text-ink-muted">
                  <span>
                    {post.likesCount} {t.countLike}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggleComments(post.id)}
                    className="hover:text-brand-ink"
                  >
                    {post.commentsCount} {t.countComments}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    disabled={pendingLikes.includes(post.id)}
                    onClick={() => void toggleLike(post)}
                    aria-pressed={post.likedByMe}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${post.likedByMe ? "bg-brand/[0.08] text-brand-ink" : "text-ink-muted hover:bg-black/[0.035] hover:text-ink"}`}
                  >
                    <ThumbsUp className={`size-4 ${post.likedByMe ? "fill-current" : ""}`} />
                    {post.likedByMe ? t.unlike : t.like}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleComments(post.id)}
                    aria-expanded={openComments === post.id}
                    className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-black/[0.035] hover:text-ink"
                  >
                    <MessageCircle className="size-4" />
                    {t.comment}
                  </button>
                </div>
                {openComments === post.id ? (
                  <div className="mt-2 border-t border-hairline pt-4">
                    {commentsLoading === post.id ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-ink-muted">
                        <LoaderCircle className="size-4 animate-spin" />
                        {t.loading}
                      </div>
                    ) : null}
                    {commentsLoading !== post.id && (comments[post.id]?.length ?? 0) === 0 ? (
                      <p className="py-3 text-sm text-ink-muted">{t.noComments}</p>
                    ) : null}
                    <div className="space-y-4">
                      {(comments[post.id] ?? []).map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2.5">
                          <Avatar
                            name={comment.author_name}
                            src={comment.author_avatar_url}
                            size="size-8"
                          />
                          <div className="min-w-0 flex-1 rounded-xl bg-surface px-3 py-2.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-ink">
                                {comment.author_name}
                              </span>
                              <time
                                className="shrink-0 text-[10px] text-ink-muted"
                                dateTime={comment.created_at}
                              >
                                {relativeTime(comment.created_at, lang)}
                              </time>
                            </div>
                            <p
                              dir="auto"
                              className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink-soft"
                            >
                              {comment.content}
                            </p>
                          </div>
                          {comment.user_id === userId ? (
                            <button
                              type="button"
                              onClick={() => void deleteComment(comment)}
                              aria-label={t.deleteComment}
                              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-danger/5 hover:text-danger"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <form
                      onSubmit={(event) => void sendComment(event, post.id)}
                      className="mt-4 flex items-center gap-2"
                    >
                      <Avatar name={fullName} src={avatarUrl} size="size-8" />
                      <input
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        maxLength={1000}
                        placeholder={t.commentPlaceholder}
                        className="h-10 min-w-0 flex-1 rounded-xl border border-hairline bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand/50 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingComment || !commentDraft.trim()}
                        aria-label={t.send}
                        className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white disabled:opacity-50"
                      >
                        {sendingComment ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            ))
          : null}
        {hasMore && !loading && !loadError ? (
          <div className="py-2 text-center">
            <button
              type="button"
              disabled={moreLoading}
              onClick={() => void loadMore()}
              className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface-raised px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand/30 disabled:opacity-60"
            >
              {moreLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  {t.loadingMore}
                </>
              ) : (
                t.loadMore
              )}
            </button>
          </div>
        ) : null}
      </section>

      <Modal
        open={Boolean(reportPost)}
        onClose={() => {
          setReportPost(null);
          setReportReason("");
        }}
        title={t.reportTitle}
        description={t.reportReason}
      >
        <form onSubmit={(event) => void submitReport(event)} className="space-y-4">
          <select
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            required
            className="h-11 w-full rounded-xl border border-hairline bg-surface px-3 text-sm text-ink focus:border-brand/50 focus:outline-none"
          >
            <option value="">{t.chooseReason}</option>
            <option value="spam">{t.spam}</option>
            <option value="harassment">{t.harassment}</option>
            <option value="inappropriate">{t.inappropriate}</option>
            <option value="misinformation">{t.misinformation}</option>
            <option value="other">{t.other}</option>
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReportPost(null)}
              className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-ink-soft"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!reportReason || reporting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {reporting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {t.submitReport}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
