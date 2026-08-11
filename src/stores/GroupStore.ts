import { makeAutoObservable, runInAction } from "mobx";

import groupService from "@/services/group.service";
import type {
  CreateGroupRequest,
  Group,
  GroupMember,
  UpdateGroupRequest,
  GroupInfo,
  GroupInvitationInfo,
  GroupInvitationRespondAction,
  GroupMemberInfo,
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

  // -------------------------------------------------------------------
  // Additive state below, kept separate from the fields above rather than
  // reusing them (those are keyed to the `Group`/`GroupMember` shapes,
  // which don't match what the live backend actually returns). See the
  // matching methods further down.
  // -------------------------------------------------------------------

  myGroups: GroupInfo[] = [];

  isLoadingGroups = false;

  groupsError: string | null = null;

  groupMembers: GroupMemberInfo[] = [];

  groupMembersLoading = false;

  groupMembersError: string | null = null;

  isSubmittingInvitation = false;

  invitationActionError: string | null = null;

  myInvitations: GroupInvitationInfo[] = [];

  invitationsLoading = false;

  invitationsError: string | null = null;

  // -------------------------------------------------------------------
  // Public group discovery/join and invite links. These call backend
  // endpoints that don't exist yet — see docs/BACKEND_REQUIREMENTS.md.
  // -------------------------------------------------------------------

  publicGroups: GroupInfo[] = [];

  publicGroupsLoading = false;

  publicGroupsError: string | null = null;

  isJoiningGroup = false;

  inviteLink: string | null = null;

  inviteLinkLoading = false;

  inviteLinkError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async inviteMembers(groupId: string, userIds: string[]): Promise<boolean> {
    return this.runMemberAction(
      userIds,
      (userId) => groupService.sendInvite(groupId, userId),
      "Could not send some invites."
    );
  }

  // -------------------------------------------------------------------
  // Additive methods below, kept separate from the ones above rather than
  // editing them — they operate on the additive state above and call the
  // additive groupService methods that hit the endpoints as actually
  // implemented by the live backend.
  // -------------------------------------------------------------------

  roleForMember(groupId: string, userId: string | undefined): string | undefined {
    if (!userId) return undefined;
    const group = this.myGroups.find((g) => g.id === groupId);
    return group?.members?.find((m) => m.user_id === userId)?.role;
  }

  get myGroupMemberIds(): string[] {
    return this.groupMembers.map((m) => m.user_id);
  }

  async loadMyGroups(): Promise<void> {
    this.isLoadingGroups = true;
    this.groupsError = null;

    try {
      const response = await groupService.listGroups();
      runInAction(() => {
        this.myGroups = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.groupsError = getErrorMessage(error, "Could not load groups.");
      });
    } finally {
      runInAction(() => {
        this.isLoadingGroups = false;
      });
    }
  }

  async createGroupInfo(payload: CreateGroupRequest): Promise<GroupInfo | null> {
    this.isLoadingGroups = true;
    this.groupsError = null;

    try {
      const response = await groupService.createGroup(payload);
      const created = response.data as unknown as GroupInfo;
      runInAction(() => {
        this.myGroups = [created, ...this.myGroups];
      });
      return created;
    } catch (error: unknown) {
      runInAction(() => {
        this.groupsError = getErrorMessage(error, "Could not create group.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isLoadingGroups = false;
      });
    }
  }

  async updateGroupInfo(
    groupId: string,
    payload: UpdateGroupRequest
  ): Promise<boolean> {
    try {
      const response = await groupService.updateGroup(groupId, payload);
      runInAction(() => {
        this.myGroups = this.myGroups.map((g) => (g.id === groupId ? response.data : g));
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.groupsError = getErrorMessage(error, "Could not update group.");
      });
      return false;
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      await groupService.deleteGroup(groupId);
      runInAction(() => {
        this.myGroups = this.myGroups.filter((g) => g.id !== groupId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.groupsError = getErrorMessage(error, "Could not delete group.");
      });
      return false;
    }
  }

  async leaveGroup(groupId: string): Promise<boolean> {
    try {
      await groupService.leaveGroup(groupId);
      runInAction(() => {
        this.myGroups = this.myGroups.filter((g) => g.id !== groupId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.groupsError = getErrorMessage(error, "Could not leave group.");
      });
      return false;
    }
  }

  async loadGroupMembers(groupId: string): Promise<void> {
    this.groupMembersLoading = true;
    this.groupMembersError = null;

    try {
      const response = await groupService.listMembersInfo(groupId);
      runInAction(() => {
        this.groupMembers = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.groupMembers = [];
        this.groupMembersError = getErrorMessage(error, "Could not load members.");
      });
    } finally {
      runInAction(() => {
        this.groupMembersLoading = false;
      });
    }
  }

  async removeGroupMember(groupId: string, userId: string): Promise<boolean> {
    try {
      await groupService.removeMember(groupId, userId);
      runInAction(() => {
        this.groupMembers = this.groupMembers.filter((m) => m.user_id !== userId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.groupMembersError = getErrorMessage(error, "Could not remove member.");
      });
      return false;
    }
  }

  async sendGroupInvitations(groupId: string, userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return false;

    this.isSubmittingInvitation = true;
    this.invitationActionError = null;

    try {
      const results = await Promise.allSettled(
        userIds.map((userId) => groupService.sendGroupInvitation(groupId, userId))
      );

      const rejected = results.find((result) => result.status === "rejected") as
        | PromiseRejectedResult
        | undefined;

      if (rejected) {
        runInAction(() => {
          this.invitationActionError = getErrorMessage(rejected.reason, "Could not send some invitations.");
        });
        return false;
      }

      return true;
    } finally {
      runInAction(() => {
        this.isSubmittingInvitation = false;
      });
    }
  }

  async loadMyInvitations(): Promise<void> {
    this.invitationsLoading = true;
    this.invitationsError = null;

    try {
      const response = await groupService.listMyInvitations();
      runInAction(() => {
        this.myInvitations = response.data.filter((invite) => invite.status === "pending");
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.invitationsError = getErrorMessage(error, "Could not load invitations.");
      });
    } finally {
      runInAction(() => {
        this.invitationsLoading = false;
      });
    }
  }

  async respondToGroupInvitation(invitationId: string, action: GroupInvitationRespondAction): Promise<boolean> {
    try {
      await groupService.respondToInvitation(invitationId, action);
      runInAction(() => {
        this.myInvitations = this.myInvitations.filter((invite) => invite.id !== invitationId);
      });
      if (action === "accept") {
        await this.loadMyGroups();
      }
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.invitationsError = getErrorMessage(error, "Could not respond to invitation.");
      });
      return false;
    }
  }

  /** Evicts a group the current user is no longer a member of (e.g. removed by the owner). */
  evictGroup(groupId: string) {
    this.myGroups = this.myGroups.filter((g) => g.id !== groupId);
  }

  /** Drops a member from the currently loaded member list without hitting the API (e.g. a live WS event about someone else). */
  removeMemberLocally(userId: string) {
    this.groupMembers = this.groupMembers.filter((m) => m.user_id !== userId);
  }

  /** Appends an invitation pushed live over the WS connection, ignoring duplicates. */
  addInvitationLocally(invitation: GroupInvitationInfo) {
    if (this.myInvitations.some((invite) => invite.id === invitation.id)) return;
    this.myInvitations = [invitation, ...this.myInvitations];
  }

  async searchPublicGroups(query: string): Promise<void> {
    this.publicGroupsLoading = true;
    this.publicGroupsError = null;

    try {
      const response = await groupService.listPublicGroups(query);
      runInAction(() => {
        this.publicGroups = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.publicGroups = [];
        this.publicGroupsError = getErrorMessage(error, "Could not search public groups.");
      });
    } finally {
      runInAction(() => {
        this.publicGroupsLoading = false;
      });
    }
  }

  async joinPublicGroup(groupId: string): Promise<GroupInfo | null> {
    this.isJoiningGroup = true;
    this.publicGroupsError = null;

    try {
      const response = await groupService.joinGroup(groupId);
      runInAction(() => {
        if (!this.myGroups.some((g) => g.id === response.data.id)) {
          this.myGroups = [response.data, ...this.myGroups];
        }
      });
      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.publicGroupsError = getErrorMessage(error, "Could not join that group.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isJoiningGroup = false;
      });
    }
  }

  async getOrCreateInviteLink(groupId: string): Promise<string | null> {
    this.inviteLinkLoading = true;
    this.inviteLinkError = null;

    try {
      const response = await groupService.createInviteLink(groupId);
      runInAction(() => {
        this.inviteLink = response.data.url;
      });
      return response.data.url;
    } catch (error: unknown) {
      runInAction(() => {
        this.inviteLinkError = getErrorMessage(error, "Could not create an invite link.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.inviteLinkLoading = false;
      });
    }
  }

  clearInviteLink() {
    this.inviteLink = null;
    this.inviteLinkError = null;
  }
}

const groupStore = new GroupStore();

export default groupStore;
