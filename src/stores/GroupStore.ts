import { makeAutoObservable, runInAction } from "mobx";

import groupService from "@/services/group.service";
import type {
  CreateGroupRequest,
  Group,
  GroupMember,
  UpdateGroupRequest,
} from "@/types/group";

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage =
    error && typeof error === "object" && "response" in error
      ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
      : undefined;

  return typeof responseMessage === "string" ? responseMessage : fallback;
}

class GroupStore {
  groups: Group[] = [];

  isLoading = false;

  error: string | null = null;

  currentGroup: Group | null = null;

  isGroupLoading = false;

  groupError: string | null = null;

  isSavingGroup = false;

  groupSaveError: string | null = null;

  isDeletingGroup = false;

  groupDeleteError: string | null = null;

  isSubmittingMembers = false;

  membersActionError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  private normalizeMembers(rawMembers: Array<any>, existingMembers?: GroupMember[]): GroupMember[] {
    return rawMembers.map((member) => {
      const id = member.id ?? member.user_id ?? `${member.group_id ?? member.groupId}-${member.user_id ?? member.id}`;
      const existing = existingMembers?.find((existingMember) => existingMember.id === id || existingMember.user.id === String(member.user_id ?? member.id));
      const user = {
        id: String(member.user_id ?? member.id ?? existing?.user.id ?? ""),
        username: member.username ?? member.user?.username ?? existing?.user.username ?? "",
        email: member.email ?? member.user?.email ?? existing?.user.email ?? "",
        name: member.name ?? member.user?.name ?? existing?.user.name ?? "",
        bio: member.bio ?? member.user?.bio ?? existing?.user.bio ?? "",
        avatar_url: member.avatar_url ?? member.user?.avatar_url ?? existing?.user.avatar_url ?? "",
        created_at: member.created_at ?? member.user?.created_at ?? existing?.user.created_at ?? "",
        updated_at: member.updated_at ?? member.user?.updated_at ?? existing?.user.updated_at ?? "",
      };

      return {
        id,
        user,
        role: member.role === "owner" ? "owner" : member.role === "admin" ? "admin" : "member",
        joined_at: member.joined_at ?? "",
      };
    });
  }

  get memberUserIds(): string[] {
    return (this.currentGroup?.members ?? [])
      .map((member) => member.user && typeof member.user.id === "string" ? member.user.id : undefined)
      .filter((id): id is string => typeof id === "string");
  }

  async createGroup(payload: CreateGroupRequest): Promise<Group | null> {
    this.isLoading = true;
    this.setError(null);

    try {
      const response = await groupService.createGroup(payload);

      runInAction(() => {
        this.groups = [response.data, ...this.groups];
      });

      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(getErrorMessage(error, "Could not create group."));
      });

      return null;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async loadGroup(groupId: string): Promise<void> {
    this.isGroupLoading = true;
    this.groupError = null;

    try {
      const response = await groupService.getGroup(groupId);
      const rawGroup = response.data as Group & { members?: Array<any> };

      runInAction(() => {
        const members = Array.isArray(rawGroup.members)
          ? this.normalizeMembers(rawGroup.members, this.currentGroup?.members)
          : undefined;

        this.currentGroup = {
          ...rawGroup,
          members,
        };
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.currentGroup = null;
        this.groupError = getErrorMessage(error, "Could not load group details.");
      });
    } finally {
      runInAction(() => {
        this.isGroupLoading = false;
      });
    }
  }

  async updateGroup(groupId: string, payload: UpdateGroupRequest): Promise<Group | null> {
    this.isSavingGroup = true;
    this.groupSaveError = null;

    try {
      const response = await groupService.updateGroup(groupId, payload);
      const updatedGroup = response.data as Group & { members?: GroupMember[] };

      runInAction(() => {
        const mergedMembers = Array.isArray(updatedGroup.members)
          ? this.normalizeMembers(updatedGroup.members, this.currentGroup?.members)
          : this.currentGroup?.members;

        this.currentGroup = {
          ...updatedGroup,
          members: mergedMembers,
        };
        this.groups = [this.currentGroup, ...this.groups.filter((group) => group.id !== updatedGroup.id)];
      });

      return this.currentGroup;
    } catch (error: unknown) {
      runInAction(() => {
        this.groupSaveError = getErrorMessage(error, "Could not save group settings.");
      });

      return null;
    } finally {
      runInAction(() => {
        this.isSavingGroup = false;
      });
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    this.isDeletingGroup = true;
    this.groupDeleteError = null;

    try {
      await groupService.deleteGroup(groupId);

      runInAction(() => {
        this.currentGroup = null;
        this.groups = this.groups.filter((group) => group.id !== groupId);
      });

      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.groupDeleteError = getErrorMessage(error, "Could not delete group.");
      });

      return false;
    } finally {
      runInAction(() => {
        this.isDeletingGroup = false;
      });
    }
  }

  private async runMemberAction(
    userIds: string[],
    action: (userId: string) => Promise<unknown>,
    fallbackMessage: string
  ): Promise<boolean> {
    if (userIds.length === 0) return false;

    this.isSubmittingMembers = true;
    this.membersActionError = null;

    try {
      const results = await Promise.allSettled(userIds.map((userId) => action(userId)));

      const rejected = results.find((result) => result.status === "rejected") as
        | PromiseRejectedResult
        | undefined;

      if (rejected) {
        runInAction(() => {
          this.membersActionError = getErrorMessage(rejected.reason, fallbackMessage);
        });
        return false;
      }

      return true;
    } finally {
      runInAction(() => {
        this.isSubmittingMembers = false;
      });
    }
  }

  async addMembers(groupId: string, userIds: string[]): Promise<boolean> {
    const success = await this.runMemberAction(
      userIds,
      (userId) => groupService.addMember(groupId, userId),
      "Could not add some members."
    );

    if (success) {
      await this.loadGroup(groupId);
    }

    return success;
  }

  async updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<boolean> {
    this.isSubmittingMembers = true;
    this.membersActionError = null;

    try {
      await groupService.updateMemberRole(groupId, userId, role);
      await this.loadGroup(groupId);
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.membersActionError = getErrorMessage(error, "Could not update member role.");
      });
      return false;
    } finally {
      runInAction(() => {
        this.isSubmittingMembers = false;
      });
    }
  }

  async removeGroupMember(groupId: string, userId: string): Promise<boolean> {
    this.isSubmittingMembers = true;
    this.membersActionError = null;

    try {
      await groupService.removeMember(groupId, userId);
      await this.loadGroup(groupId);
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.membersActionError = getErrorMessage(error, "Could not remove group member.");
      });
      return false;
    } finally {
      runInAction(() => {
        this.isSubmittingMembers = false;
      });
    }
  }

  async inviteMembers(groupId: string, userIds: string[]): Promise<boolean> {
    return this.runMemberAction(
      userIds,
      (userId) => groupService.sendInvite(groupId, userId),
      "Could not send some invites."
    );
  }
}

const groupStore = new GroupStore();

export default groupStore;
