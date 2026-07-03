"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { cx } from "./cx";

export interface ChatInputProps {
  /** Current text value of the composer (controlled). */
  value: string;
  /** Called whenever the text value changes. */
  onChange: (value: string) => void;
  /** Called when the user submits the message (Enter or send button). */
  onSend: () => void;
  /** Called when the user picks file(s) to attach. */
  onAttachFiles?: (files: FileList) => void;
  /** Called when the user opens the emoji picker trigger. */
  onOpenEmojiPicker?: () => void;
  /** Called when the user opens the sticker picker trigger. */
  onOpenStickerPicker?: () => void;
  /** Called on each keystroke, useful for driving typing-indicator broadcasts. */
  onTyping?: () => void;
  /** Disables the entire composer (e.g. while blocked or read-only). */
  disabled?: boolean;
  /** Shows a sending state on the submit button. */
  isSending?: boolean;
  /** Placeholder text for the input field. */
  placeholder?: string;
  /** Optional extra class names for layout composition by the parent. */
  className?: string;
}

/**
 * Message composer: auto-growing text field, attach/emoji/sticker
 * triggers, and a send button. Fully controlled — all state lives in
 * the parent; this component only reports intent via callbacks.
 */
export function ChatInput({
                            value,
                            onChange,
                            onSend,
                            onAttachFiles,
                            onOpenEmojiPicker,
                            onOpenStickerPicker,
                            onTyping,
                            disabled = false,
                            isSending = false,
                            placeholder = "Message…",
                            className,
                          }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 && !disabled && !isSending;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      onAttachFiles?.(event.target.files);
    }
    event.target.value = "";
  }

  return (
    <div className={cx("shrink-0 border-t border-white/5 bg-[#1e1f24] p-3 sm:p-4", className)}>
      <div
        className={cx(
          "flex items-end gap-1.5 rounded-2xl bg-[#2b2c34] px-2 py-1.5",
          "transition-colors duration-150 focus-within:bg-[#303138]",
          disabled && "opacity-60",
        )}
      >
        {onAttachFiles ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />
            <ComposerIconButton
              label="Attach a file"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <AttachIcon />
            </ComposerIconButton>
          </>
        ) : null}

        <textarea
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          aria-label="Message"
          className={cx(
            "max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-snug text-[#e7e8ec]",
            "placeholder:text-[#6b6d76] focus:outline-none",
          )}
        />

        {onOpenStickerPicker ? (
          <ComposerIconButton label="Send a sticker" disabled={disabled} onClick={onOpenStickerPicker}>
            <StickerIcon />
          </ComposerIconButton>
        ) : null}

        {onOpenEmojiPicker ? (
          <ComposerIconButton label="Open emoji picker" disabled={disabled} onClick={onOpenEmojiPicker}>
            <EmojiIcon />
          </ComposerIconButton>
        ) : null}

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cx(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "transition-all duration-150 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]",
            canSend
              ? "bg-[#5b6ef5] text-white hover:bg-[#4c5eea]"
              : "cursor-not-allowed bg-transparent text-[#4a4b54]",
          )}
        >
          {isSending ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
}

function ComposerIconButton({
                              label,
                              onClick,
                              disabled,
                              children,
                            }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#96979f]",
        "transition-all duration-150 hover:bg-white/5 hover:text-[#e7e8ec] active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function AttachIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17 8l-7.5 7.5a3 3 0 004.24 4.24L21 12.4a5 5 0 00-7.07-7.07L6.5 12.76"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StickerIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0116 0v3a5 5 0 01-5 5h-3a8 8 0 01-8-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M15 20a5 5 0 005-5h-5v5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 14s1.2 2 3.5 2 3.5-2 3.5-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="9.5" r="1" fill="currentColor" />
      <circle cx="15" cy="9.5" r="1" fill="currentColor" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20l16-8L4 4l2 7.5L4 20z"
        fill="currentColor"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
