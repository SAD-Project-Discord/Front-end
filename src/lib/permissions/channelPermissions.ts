import type { ChannelMember, ChannelPermission } from "@/types/channel";

/**
 * Owner and base-role "admin" implicitly hold every permission; a plain
 * member only holds what's explicitly granted via one of their custom roles.
 */
export function hasChannelPermission(
  member: ChannelMember | undefined,
  isOwner: boolean,
  permission: ChannelPermission,
): boolean {
  if (isOwner) return true;
  if (!member) return false;
  if (member.role === "admin") return true;
  return member.custom_roles.some((role) => role.permissions.includes(permission));
}
