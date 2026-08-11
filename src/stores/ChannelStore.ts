import { makeAutoObservable, runInAction } from "mobx";

import channelService from "@/services/channel.service";
import type { Channel, ChannelMember, CreateChannelRequest } from "@/types/channel";

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

  constructor() {
    makeAutoObservable(this);
  }

  setChannelsError(message: string | null) {
    this.channelsError = message;
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
}

const channelStore = new ChannelStore();

export default channelStore;
