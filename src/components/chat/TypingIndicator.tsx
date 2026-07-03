import type { User } from "@/lib/types";
import { cx } from "./cx";

export interface TypingIndicatorProps {
  /** Users currently typing in this conversation. */
  users: User[];
  /** Optional extra class names for layout composition by the parent. */
  className?: string;
}

/**
 * Animated "someone is typing…" indicator. Renders nothing when `users`
 * is empty, so it can be mounted unconditionally by the parent.
 */
export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cx("flex items-center gap-2 px-4 py-2 text-xs text-[#8a8b93]", className)}
    >
      <span className="flex h-6 items-center gap-0.5 rounded-full bg-[#2b2c34] px-2.5 py-1.5">
        <Dot delayMs={0} />
        <Dot delayMs={150} />
        <Dot delayMs={300} />
      </span>
      <span className="truncate">{formatTypingLabel(users)}</span>
    </div>
  );
}

function Dot({ delayMs }: { delayMs: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#96979f]"
      style={{ animationDelay: `${delayMs}ms`, animationDuration: "900ms" }}
    />
  );
}

function formatTypingLabel(users: User[]): string {
  const names = users.map((user) => user.displayName);

  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing…`;
}
