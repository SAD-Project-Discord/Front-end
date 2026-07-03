import { cx } from "./cx";

export interface DateSeparatorProps {
  /** ISO 8601 date (or full timestamp) this separator represents. */
  date: string;
  /** Optional extra class names for layout composition by the parent. */
  className?: string;
}

/**
 * A horizontal divider with a centered date label, used to separate
 * groups of messages sent on different days within `MessageList`.
 */
export function DateSeparator({ date, className }: DateSeparatorProps) {
  return (
    <div
      role="separator"
      aria-label={formatDate(date)}
      className={cx("flex items-center gap-3 px-4 py-3", className)}
    >
      <span className="h-px flex-1 bg-white/5" aria-hidden="true" />
      <span className="shrink-0 text-xs font-medium text-[#6b6d76]">{formatDate(date)}</span>
      <span className="h-px flex-1 bg-white/5" aria-hidden="true" />
    </div>
  );
}

function formatDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}
