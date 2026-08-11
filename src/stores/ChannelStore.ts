import { makeAutoObservable, runInAction } from "mobx";

import channelService from "@/services/channel.service";
import type {
  Channel,
  ChannelAccessRole,
  ChannelMember,
  ChannelRole,
  ChannelTopic,
  CreateAccessRoleRequest,
  CreateChannelRequest,
  CreateTopicRequest,
  UpdateAccessRoleRequest,
  UpdateChannelRequest,
  UpdateTopicRequest,
} from "@/types/channel";

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage =
    error && typeof error === "object" && "response" in error
      ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
      : undefined;

  return typeof responseMessage === "string" ? responseMessage : fallback;
}

class ChannelStore {
  myChannels: Channel[] = [];

  isLoadingChannels = false;

  channelsError: string | null = null;

  channelMembers: ChannelMember[] = [];

  channelMembersLoading = false;

  channelMembersError: string | null = null;

  isSubmittingMembers = false;

  membersActionError: string | null = null;

  isSavingChannel = false;

  channelSettingsError: string | null = null;

  inviteLink: string | null = null;

  inviteLinkLoading = false;

  inviteLinkError: string | null = null;

  channelRoles: ChannelAccessRole[] = [];

  channelRolesLoading = false;

  channelRolesError: string | null = null;

  isSavingRole = false;

  roleActionError: string | null = null;

  channelTopics: ChannelTopic[] = [];

  channelTopicsLoading = false;

  channelTopicsError: string | null = null;

  isSavingTopic = false;

  topicActionError: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setChannelsError(message: string | null) {
    this.channelsError = message;
  }

  clearChannelSettingsError() {
    this.channelSettingsError = null;
  }

  clearChannelMemberActionError() {
    this.membersActionError = null;
  }

  clearRoleActionError() {
    this.roleActionError = null;
  }

  clearTopicActionError() {
    this.topicActionError = null;
  }

  get myChannelMemberIds(): string[] {
    return this.channelMembers.map((m) => m.user_id);
  }

  async loadMyChannels(): Promise<void> {
    this.isLoadingChannels = true;
    this.channelsError = null;

    try {
      const response = await channelService.listChannels();
      runInAction(() => {
        this.myChannels = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.channelsError = getErrorMessage(error, "Could not load channels.");
      });
    } finally {
      runInAction(() => {
        this.isLoadingChannels = false;
      });
    }
  }

  async createChannel(payload: CreateChannelRequest): Promise<Channel | null> {
    this.isLoadingChannels = true;
    this.channelsError = null;

    try {
      const response = await channelService.createChannel(payload);
      runInAction(() => {
        this.myChannels = [response.data, ...this.myChannels];
      });
      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.channelsError = getErrorMessage(error, "Could not create channel.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isLoadingChannels = false;
      });
    }
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    try {
      await channelService.deleteChannel(channelId);
      runInAction(() => {
        this.myChannels = this.myChannels.filter((c) => c.id !== channelId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.channelsError = getErrorMessage(error, "Could not delete channel.");
      });
      return false;
    }
  }

  async leaveChannel(channelId: string): Promise<boolean> {
    try {
      await channelService.leaveChannel(channelId);
      runInAction(() => {
        this.myChannels = this.myChannels.filter((c) => c.id !== channelId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.channelsError = getErrorMessage(error, "Could not leave channel.");
      });
      return false;
    }
  }

  async loadChannelMembers(channelId: string): Promise<void> {
    this.channelMembersLoading = true;
    this.channelMembersError = null;

    try {
      const response = await channelService.listMembers(channelId);
      runInAction(() => {
        this.channelMembers = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.channelMembers = [];
        this.channelMembersError = getErrorMessage(error, "Could not load members.");
      });
    } finally {
      runInAction(() => {
        this.channelMembersLoading = false;
      });
    }
  }

  async addChannelMembers(channelId: string, userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return false;

    this.isSubmittingMembers = true;
    this.membersActionError = null;

    try {
      const results = await Promise.allSettled(
        userIds.map((userId) => channelService.addMember(channelId, userId)),
      );

      const rejected = results.find((result) => result.status === "rejected") as
        | PromiseRejectedResult
        | undefined;

      if (rejected) {
        runInAction(() => {
          this.membersActionError = getErrorMessage(rejected.reason, "Could not add some members.");
        });
        return false;
      }

      await this.loadChannelMembers(channelId);
      return true;
    } finally {
      runInAction(() => {
        this.isSubmittingMembers = false;
      });
    }
  }

  async removeChannelMember(channelId: string, userId: string): Promise<boolean> {
    try {
      await channelService.removeMember(channelId, userId);
      runInAction(() => {
        this.channelMembers = this.channelMembers.filter((m) => m.user_id !== userId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.channelMembersError = getErrorMessage(error, "Could not remove member.");
      });
      return false;
    }
  }

  /** Evicts a channel the current user is no longer a member of (e.g. removed by the owner). */
  evictChannel(channelId: string) {
    this.myChannels = this.myChannels.filter((c) => c.id !== channelId);
  }

  /** Drops a member from the currently loaded member list without hitting the API (e.g. a live WS event about someone else). */
  removeMemberLocally(userId: string) {
    this.channelMembers = this.channelMembers.filter((m) => m.user_id !== userId);
  }

  async updateChannelInfo(
    channelId: string,
    payload: UpdateChannelRequest,
  ): Promise<Channel | null> {
    this.isSavingChannel = true;
    this.channelSettingsError = null;

    try {
      const response = await channelService.updateChannel(channelId, payload);
      runInAction(() => {
        this.myChannels = this.myChannels.map((c) => (c.id === channelId ? response.data : c));
      });
      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.channelSettingsError = getErrorMessage(error, "Could not update channel.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isSavingChannel = false;
      });
    }
  }

  async getOrCreateInviteLink(channelId: string): Promise<string | null> {
    this.inviteLinkLoading = true;
    this.inviteLinkError = null;

    try {
      const response = await channelService.createInviteLink(channelId);
      runInAction(() => {
        this.inviteLink =
          typeof window === "undefined"
            ? response.data.url
            : `${window.location.origin}/invite/${encodeURIComponent(response.data.token)}`;
      });
      return this.inviteLink;
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

  /** Owner-only: promote/demote a non-owner member between admin and member. */
  async updateMemberRole(channelId: string, userId: string, role: ChannelRole): Promise<boolean> {
    if (role === "owner") return false;

    this.membersActionError = null;
    try {
      const response = await channelService.updateMemberRole(channelId, userId, { role });
      runInAction(() => {
        this.channelMembers = this.channelMembers.map((m) =>
          m.user_id === userId ? response.data : m,
        );
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.membersActionError = getErrorMessage(error, "Could not update member role.");
      });
      return false;
    }
  }

  async loadChannelRoles(channelId: string): Promise<void> {
    this.channelRolesLoading = true;
    this.channelRolesError = null;

    try {
      const response = await channelService.listRoles(channelId);
      runInAction(() => {
        this.channelRoles = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.channelRoles = [];
        this.channelRolesError = getErrorMessage(error, "Could not load roles.");
      });
    } finally {
      runInAction(() => {
        this.channelRolesLoading = false;
      });
    }
  }

  async createChannelRole(
    channelId: string,
    payload: CreateAccessRoleRequest,
  ): Promise<ChannelAccessRole | null> {
    this.isSavingRole = true;
    this.roleActionError = null;

    try {
      const response = await channelService.createRole(channelId, payload);
      runInAction(() => {
        this.channelRoles = [...this.channelRoles, response.data];
      });
      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.roleActionError = getErrorMessage(error, "Could not create role.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isSavingRole = false;
      });
    }
  }

  async updateChannelRole(
    channelId: string,
    roleId: string,
    payload: UpdateAccessRoleRequest,
  ): Promise<ChannelAccessRole | null> {
    this.isSavingRole = true;
    this.roleActionError = null;

    try {
      const response = await channelService.updateRole(channelId, roleId, payload);
      runInAction(() => {
        this.channelRoles = this.channelRoles.map((r) => (r.id === roleId ? response.data : r));
      });
      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.roleActionError = getErrorMessage(error, "Could not update role.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isSavingRole = false;
      });
    }
  }

  async deleteChannelRole(channelId: string, roleId: string): Promise<boolean> {
    this.roleActionError = null;

    try {
      await channelService.deleteRole(channelId, roleId);
      runInAction(() => {
        this.channelRoles = this.channelRoles.filter((r) => r.id !== roleId);
        this.channelMembers = this.channelMembers.map((m) => ({
          ...m,
          custom_roles: m.custom_roles.filter((id) => id !== roleId),
        }));
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.roleActionError = getErrorMessage(error, "Could not delete role.");
      });
      return false;
    }
  }

  async assignRoleToMember(channelId: string, userId: string, roleId: string): Promise<boolean> {
    this.membersActionError = null;

    try {
      const response = await channelService.assignRole(channelId, userId, roleId);
      runInAction(() => {
        this.channelMembers = this.channelMembers.map((m) =>
          m.user_id === userId ? response.data : m,
        );
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.membersActionError = getErrorMessage(error, "Could not assign role.");
      });
      return false;
    }
  }

  async removeRoleFromMember(channelId: string, userId: string, roleId: string): Promise<boolean> {
    this.membersActionError = null;

    try {
      const response = await channelService.unassignRole(channelId, userId, roleId);
      runInAction(() => {
        this.channelMembers = this.channelMembers.map((m) =>
          m.user_id === userId ? response.data : m,
        );
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.membersActionError = getErrorMessage(error, "Could not remove role.");
      });
      return false;
    }
  }

  async loadChannelTopics(channelId: string): Promise<void> {
    this.channelTopicsLoading = true;
    this.channelTopicsError = null;

    try {
      const response = await channelService.listTopics(channelId);
      runInAction(() => {
        this.channelTopics = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.channelTopics = [];
        this.channelTopicsError = getErrorMessage(error, "Could not load threads.");
      });
    } finally {
      runInAction(() => {
        this.channelTopicsLoading = false;
      });
    }
  }

  async createChannelTopic(
    channelId: string,
    payload: CreateTopicRequest,
  ): Promise<ChannelTopic | null> {
    this.isSavingTopic = true;
    this.topicActionError = null;

    try {
      const response = await channelService.createTopic(channelId, payload);
      runInAction(() => {
        this.channelTopics = [...this.channelTopics, response.data];
      });
      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.topicActionError = getErrorMessage(error, "Could not create thread.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isSavingTopic = false;
      });
    }
  }

  async updateChannelTopic(
    channelId: string,
    topicId: string,
    payload: UpdateTopicRequest,
  ): Promise<ChannelTopic | null> {
    this.isSavingTopic = true;
    this.topicActionError = null;

    try {
      const response = await channelService.updateTopic(channelId, topicId, payload);
      runInAction(() => {
        this.channelTopics = this.channelTopics.map((t) => (t.id === topicId ? response.data : t));
      });
      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.topicActionError = getErrorMessage(error, "Could not update thread.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.isSavingTopic = false;
      });
    }
  }

  async deleteChannelTopic(channelId: string, topicId: string): Promise<boolean> {
    this.topicActionError = null;

    try {
      await channelService.deleteTopic(channelId, topicId);
      runInAction(() => {
        this.channelTopics = this.channelTopics.filter((t) => t.id !== topicId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.topicActionError = getErrorMessage(error, "Could not delete thread.");
      });
      return false;
    }
  }
}

const channelStore = new ChannelStore();

export default channelStore;
