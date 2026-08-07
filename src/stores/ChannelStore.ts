import { makeAutoObservable, runInAction } from "mobx";
import channelService from "@/services/channel.service";
import type { Channel, CreateChannelRequest } from "@/types/channel";

function getErrorMessage(error: unknown, fallback: string): string {
  const responseMessage =
    error && typeof error === "object" && "response" in error
      ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
      : undefined;

  return typeof responseMessage === "string" ? responseMessage : fallback;
}

class ChannelStore {
  channels: Channel[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  async createChannel(payload: CreateChannelRequest): Promise<Channel | null> {
    this.isLoading = true;
    this.setError(null);

    try {
      const response = await channelService.createChannel(payload);

      runInAction(() => {
        this.channels = [response.data, ...this.channels];
      });

      return response.data;
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(getErrorMessage(error, "Could not create channel."));
      });
      return null;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

const channelStore = new ChannelStore();
export default channelStore;
