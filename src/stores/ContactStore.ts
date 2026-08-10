import { makeAutoObservable, runInAction } from "mobx";

import contactService from "@/services/contact.service";
import type { PublicUserProfile } from "@/types/user";

class ContactStore {
  contacts: PublicUserProfile[] = [];

  isLoading = false;

  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  async loadContacts(query?: string): Promise<void> {
    this.isLoading = true;
    this.setError(null);

    try {
      const response = await contactService.listContacts(query);

      runInAction(() => {
        this.contacts = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        const responseMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : undefined;
        const message =
          typeof responseMessage === "string" ? responseMessage : "Could not load contacts.";

        this.setError(message);
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

const contactStore = new ContactStore();

export default contactStore;
