import { makeAutoObservable, runInAction } from "mobx";

import groupService from "@/services/group.service";
import type { CreateGroupRequest, Group } from "@/types/group";

class GroupStore {
  groups: Group[] = [];

  isLoading = false;

  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
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
        const responseMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : undefined;
        const message =
          typeof responseMessage === "string" ? responseMessage : "Could not create group.";

        this.setError(message);
      });

      return null;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

const groupStore = new GroupStore();

export default groupStore;
