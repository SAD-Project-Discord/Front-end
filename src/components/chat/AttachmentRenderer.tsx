'use client';

import React, { useState } from "react";
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
  const [isEnlarged, setIsEnlarged] = useState(false);

  const handleImageClick = () => {
    if (onOpen) {
      onOpen(attachment);
    } else {
      setIsEnlarged(true);
    }
  };

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
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.thumbnailUrl ?? attachment.url}
              alt={attachment.altText ?? attachment.caption ?? "Image attachment"}
              width={attachment.width}
              height={attachment.height}
              className={cx(
                "max-h-80 w-full max-w-sm rounded-xl object-cover cursor-zoom-in",
                !onOpen && "hover:opacity-90 transition-opacity"
              )}
              draggable={false}
              onClick={handleImageClick}
            />
            
            {/* Built-in Lightbox fallback if onOpen is not provided */}
            {isEnlarged && !onOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
                onClick={() => setIsEnlarged(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.url}
                  alt={attachment.altText ?? "Enlarged image"}
                  className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                />
              </div>
            )}
          </>
        );

      case "video":
        return (
          <video
            src={attachment.url}
            poster={attachment.thumbnailUrl}
            controls
            preload="metadata"
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
            <audio src={attachment.url} controls preload="metadata" className="h-9 w-full min-w-0" />
          </div>
        );

      case "document":
        return (
          <AttachmentFileCard
            fileName={attachment.fileName || "Document"}
            // meta={formatFileMeta(attachment.sizeBytes, attachment.pageCount, getExtension(attachment.fileName))}    // TODO: gotta handle this later
            icon={<DocumentIcon />}
            downloadUrl={attachment.url}
          />
        );

      case "file":
        return (
          <AttachmentFileCard
            fileName={attachment.fileName || "File"}
            // meta={formatFileMeta(attachment.sizeBytes, undefined, getExtension(attachment.fileName))}    // TODO: gotta handle this later
            icon={<FileIcon />}
          />
        );

      default: {
        // Fallback for exhaustive check safety
        return null;
      }
    }
  })();

  return (
    <div className={cx("flex flex-col gap-1", className)}>
      {onOpen && attachment.type !== "image" ? (
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
        <p className="max-w-sm text-[13px] leading-snug text-[#c3c4cb] bg-neutral-900/30 px-2 py-1 rounded-md border-l-2 border-[#5b6ef5] mt-1">
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
  downloadUrl,
}: {
  fileName: string;
  meta?: string;
  icon: React.ReactNode;
  downloadUrl?: string;
}) {
  return (
    <div
      className={cx(
        "flex w-full max-w-sm items-center gap-3 rounded-xl bg-[#2f303a] px-3 py-2.5",
        "transition-colors duration-150 hover:bg-[#34353f] group",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5b6ef5]/20 text-[#5b6ef5]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-[#e7e8ec]">{fileName}</span>
        {meta ? <span className="text-xs text-[#8a8b93]">{meta}</span> : null}
      </span>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={fileName}
          target="_blank"
          rel="noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a8b93] hover:bg-[#5b6ef5]/20 hover:text-[#5b6ef5] transition-colors"
          title="Download"
          onClick={(e) => e.stopPropagation()} // Prevent triggering onOpen if wrapped in a button
        >
          <DownloadIcon />
        </a>
      )}
    </div>
  );
}

function formatFileMeta(sizeBytes?: number, pageCount?: number, extension?: string): string | undefined {
  const parts: string[] = [];
  if (extension) parts.push(extension.toUpperCase());
  if (sizeBytes !== undefined) parts.push(formatBytes(sizeBytes));
  if (pageCount !== undefined) parts.push(`${pageCount} pages`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Icons ---

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

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} stroke="currentColor" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}