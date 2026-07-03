type ClassValue = string | number | false | null | undefined;

/**
 * Joins truthy class name fragments with a space.
 * Minimal local alternative to `clsx` so this component set has no
 * external dependency requirement.
 */
export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
