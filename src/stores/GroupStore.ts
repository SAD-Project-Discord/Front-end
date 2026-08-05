import { makeAutoObservable, runInAction } from "mobx";

import groupService from "@/services/group.service";
import type { CreateGroupRequest, Group, GroupMember } from "@/types/group";

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

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  get memberUserIds(): string[] {
    // Safely map member user ids, skipping members without a user or id
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
