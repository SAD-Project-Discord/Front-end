import { makeAutoObservable, runInAction } from "mobx";

import groupService from "@/services/group.service";
import type { CreateGroupRequest, Group, GroupInvite, GroupMember } from "@/types/group";

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

  members: GroupMember[] = [];

  membersLoading = false;

  membersError: string | null = null;

  isSubmittingMembers = false;

  membersActionError: string | null = null;

  myInvites: GroupInvite[] = [];

  invitesLoading = false;

  invitesError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  get memberUserIds(): string[] {
    return this.members
      .map((member) => (typeof member.user_id === "string" ? member.user_id : undefined))
      .filter((id): id is string => typeof id === "string");
  }

  roleFor(groupId: string, userId: string | undefined): string | undefined {
    if (!userId) return undefined;
    const group = this.groups.find((g) => g.id === groupId);
    return group?.members?.find((m) => m.user_id === userId)?.role;
  }

  async loadGroups(): Promise<void> {
    this.isLoading = true;
    this.setError(null);

    try {
      const response = await groupService.listGroups();
      runInAction(() => {
        this.groups = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(getErrorMessage(error, "Could not load groups."));
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
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

  async updateGroup(
    groupId: string,
    payload: Partial<Pick<CreateGroupRequest, "name" | "description" | "is_private">>
  ): Promise<boolean> {
    try {
      const response = await groupService.updateGroup(groupId, payload);
      runInAction(() => {
        this.groups = this.groups.map((g) => (g.id === groupId ? response.data : g));
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(getErrorMessage(error, "Could not update group."));
      });
      return false;
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      await groupService.deleteGroup(groupId);
      runInAction(() => {
        this.groups = this.groups.filter((g) => g.id !== groupId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(getErrorMessage(error, "Could not delete group."));
      });
      return false;
    }
  }

  async leaveGroup(groupId: string): Promise<boolean> {
    try {
      await groupService.leaveGroup(groupId);
      runInAction(() => {
        this.groups = this.groups.filter((g) => g.id !== groupId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(getErrorMessage(error, "Could not leave group."));
      });
      return false;
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

  async removeMember(groupId: string, userId: string): Promise<boolean> {
    try {
      await groupService.removeMember(groupId, userId);
      runInAction(() => {
        this.members = this.members.filter((m) => m.user_id !== userId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.membersActionError = getErrorMessage(error, "Could not remove member.");
      });
      return false;
    }
  }

  /**
   * The only way to add people to a group — sends invitations, which the
   * invitee must accept (see respondToInvite). There is no direct-add.
   */
  async inviteMembers(groupId: string, userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return false;

    this.isSubmittingMembers = true;
    this.membersActionError = null;

    try {
      const results = await Promise.allSettled(
        userIds.map((userId) => groupService.sendInvite(groupId, userId))
      );

      const rejected = results.find((result) => result.status === "rejected") as
        | PromiseRejectedResult
        | undefined;

      if (rejected) {
        runInAction(() => {
          this.membersActionError = getErrorMessage(rejected.reason, "Could not send some invites.");
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

  async loadMyInvites(): Promise<void> {
    this.invitesLoading = true;
    this.invitesError = null;

    try {
      const response = await groupService.listMyInvites();
      runInAction(() => {
        this.myInvites = response.data.filter((invite) => invite.status === "pending");
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.invitesError = getErrorMessage(error, "Could not load invitations.");
      });
    } finally {
      runInAction(() => {
        this.invitesLoading = false;
      });
    }
  }

  async respondToInvite(invitationId: string, action: "accept" | "reject"): Promise<boolean> {
    try {
      await groupService.respondToInvite(invitationId, action);
      runInAction(() => {
        this.myInvites = this.myInvites.filter((invite) => invite.id !== invitationId);
      });
      if (action === "accept") {
        await this.loadGroups();
      }
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.invitesError = getErrorMessage(error, "Could not respond to invitation.");
      });
      return false;
    }
  }
}

const groupStore = new GroupStore();

export default groupStore;
