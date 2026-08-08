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

  members: GroupMember[] = [];

  membersLoading = false;

  membersError: string | null = null;

  isSubmittingMembers = false;

  membersActionError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  get memberUserIds(): string[] {
    return this.members
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

      runInAction(() => {
        this.currentGroup = response.data;
        // If the group response includes members inline, map them to GroupMember[]
        if (Array.isArray((response.data as any).members)) {
          const rawMembers = (response.data as any).members as Array<any>;
          this.members = rawMembers.map((m) => ({
            id: m.user_id ?? `${response.data.id}-${m.user_id}`,
            user: {
              id: m.user_id,
              username: m.username ?? "",
              email: "",
              name: m.name ?? "",
              bio: "",
              avatar_url: m.avatar_url ?? "",
              created_at: m.created_at ?? "",
              updated_at: m.updated_at ?? "",
            },
            role: m.role === "owner" ? "owner" : m.role === "admin" ? "admin" : "member",
            joined_at: m.joined_at ?? "",
          }));
        }
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

      runInAction(() => {
        this.currentGroup = response.data;
        this.groups = [response.data, ...this.groups.filter((group) => group.id !== response.data.id)];
      });

      return response.data;
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
        this.members = [];
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

  async loadMembers(groupId: string): Promise<void> {
    this.membersLoading = true;
    this.membersError = null;

    try {
      const response = await groupService.listMembers(groupId);

      runInAction(() => {
        this.members = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.members = [];
        this.membersError = getErrorMessage(error, "Could not load members.");
      });
    } finally {
      runInAction(() => {
        this.membersLoading = false;
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
      await this.loadMembers(groupId);
    }

    return success;
  }

  async updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<boolean> {
    this.isSubmittingMembers = true;
    this.membersActionError = null;

    try {
      await groupService.updateMemberRole(groupId, userId, role);
      await this.loadMembers(groupId);
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
      await this.loadMembers(groupId);
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
