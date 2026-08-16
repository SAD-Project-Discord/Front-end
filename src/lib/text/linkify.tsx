import type { ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/**
 * Splits `text` on URLs and wraps each one in a clickable, new-tab link.
 * `String.split` with a single capturing group puts matches at odd indices
 * in the result, interleaved with the surrounding plain-text segments.
 */
export function linkifyText(text: string): ReactNode[] {
  const parts = text.split(URL_PATTERN);
  if (parts.length === 1) return [text];

  return parts.map((part, index) => {
    if (index % 2 === 0) return part;
    const href = part.startsWith("www.") ? `https://${part}` : part;
    return (
      <a key={index} href={href} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
        {part}
      </a>
    );
  });
}
