import type { Attachment } from "@/lib/types";
import { cx } from "./cx";

export interface AttachmentRendererProps {
  /** The attachment to render. */
  attachment: Attachment;
  /** Called when the attachment is clicked (e.g. open lightbox, download). */
  onOpen?: (attachment: Attachment) => void;
  /** Optional extra class names for layout composition by the parent. */
  className?: string;
}

/**
 * Renders a single attachment according to its type. Narrows on the
 * `Attachment` discriminated union so each variant only receives the
 * fields relevant to it.
 */
export function AttachmentRenderer({
                                     attachment,
                                     onOpen,
                                     className,
                                   }: AttachmentRendererProps) {
  const content = (() => {
    switch (attachment.type) {
      case "sticker":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.url}
            alt={attachment.caption ?? "Sticker"}
            className="h-28 w-28 object-contain"
            draggable={false}
          />
        );

      case "image":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.thumbnailUrl ?? attachment.url}
            alt={attachment.altText ?? attachment.caption ?? "Image attachment"}
            width={attachment.width}
            height={attachment.height}
            className="max-h-80 w-full max-w-sm rounded-xl object-cover"
            draggable={false}
          />
        );

      case "video":
        return (
          <video
            src={attachment.url}
            poster={attachment.thumbnailUrl}
            controls
            className="max-h-80 w-full max-w-sm rounded-xl bg-black"
          >
            <track kind="captions" />
          </video>
        );

      case "audio":
        return (
          <div
            className={cx(
              "flex w-full max-w-sm items-center gap-3 rounded-xl bg-[#2f303a] px-3 py-2.5",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5b6ef5]/20 text-[#5b6ef5]">
              <AudioIcon />
            </span>
            <audio src={attachment.url} controls className="h-9 w-full min-w-0" />
          </div>
        );

      case "document":
        return (
          <AttachmentFileCard
            fileName={attachment.fileName}
            meta={formatFileMeta(attachment.sizeBytes, attachment.pageCount)}
            icon={<DocumentIcon />}
          />
        );

      case "file":
        return (
          <AttachmentFileCard
            fileName={attachment.fileName}
            meta={formatFileMeta(attachment.sizeBytes)}
            icon={<FileIcon />}
          />
        );

      default: {
        const _exhaustive: never = attachment;
        return _exhaustive;
      }
    }
  })();

  return (
    <div className={cx("flex flex-col gap-1", className)}>
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(attachment)}
          className={cx(
            "block w-fit overflow-hidden rounded-xl text-left",
            "transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]",
          )}
        >
          {content}
        </button>
      ) : (
        <div className="w-fit overflow-hidden rounded-xl">{content}</div>
      )}

      {attachment.caption && attachment.type !== "sticker" ? (
        <p className="max-w-sm text-[13px] leading-snug text-[#c3c4cb]">
          {attachment.caption}
        </p>
      ) : null}
    </div>
  );
}

function AttachmentFileCard({
                              fileName,
                              meta,
                              icon,
                            }: {
  fileName: string;
  meta?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "flex w-full max-w-sm items-center gap-3 rounded-xl bg-[#2f303a] px-3 py-2.5",
        "transition-colors duration-150 hover:bg-[#34353f]",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5b6ef5]/20 text-[#5b6ef5]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-medium text-[#e7e8ec]">{fileName}</span>
        {meta ? <span className="text-xs text-[#8a8b93]">{meta}</span> : null}
      </span>
    </div>
  );
}

function formatFileMeta(sizeBytes?: number, pageCount?: number): string | undefined {
  const parts: string[] = [];
  if (sizeBytes !== undefined) parts.push(formatBytes(sizeBytes));
  if (pageCount !== undefined) parts.push(`${pageCount} pages`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AudioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10v4h4l5 5V5L8 10H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 2.5h8l4 4V21a1 1 0 01-1 1H6a1 1 0 01-1-1V3.5a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 2.5V7h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2.5H6a1 1 0 00-1 1V21a1 1 0 001 1h13a1 1 0 001-1V8.5L13 2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 2.5V8.5H19" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
