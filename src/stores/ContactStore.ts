import { isAxiosError } from "axios";
import { makeAutoObservable, runInAction } from "mobx";

import contactService from "@/services/contact.service";
import type { PublicUserProfile } from "@/types/user";

const CONTACT_PAGE_SIZE = 30;

function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function withContactStatus(profile: PublicUserProfile, isContact: boolean): PublicUserProfile {
  return { ...profile, is_contact: isContact };
}

class ContactStore {
  contacts: PublicUserProfile[] = [];

  query = "";

  nextCursor: string | null = null;

  hasMore = false;

  isLoading = false;

  isLoadingMore = false;

  addingIds = new Set<string>();

  removingIds = new Set<string>();

  contactStatuses = new Map<string, boolean>();

  error: string | null = null;

  actionError: string | null = null;

  private requestVersion = 0;

  constructor() {
    makeAutoObservable(this);
  }

  clearActionError() {
    this.actionError = null;
  }

  rememberContactStatus(userId: string, isContact: boolean) {
    this.contactStatuses.set(userId, isContact);
  }

  contactStatusFor(userId: string): boolean | undefined {
    return this.contactStatuses.get(userId);
  }

  isAdding(userId: string): boolean {
    return this.addingIds.has(userId);
  }

  isRemoving(userId: string): boolean {
    return this.removingIds.has(userId);
  }

  private matchesCurrentQuery(profile: PublicUserProfile): boolean {
    const query = this.query.toLocaleLowerCase();
    if (!query) return true;
    return profile.name.toLocaleLowerCase().includes(query) ||
      profile.username.toLocaleLowerCase().includes(query);
  }

  private upsertVisibleContact(profile: PublicUserProfile) {
    if (!this.matchesCurrentQuery(profile)) return;
    const normalized = withContactStatus(profile, true);
    this.contacts = [normalized, ...this.contacts.filter((contact) => contact.id !== profile.id)];
  }

  async loadContacts(query = "", append = false): Promise<void> {
    if (append && (!this.hasMore || !this.nextCursor || this.isLoadingMore)) return;

    const requestedQuery = append ? this.query : query.trim();
    const cursor = append ? this.nextCursor ?? undefined : undefined;
    const version = ++this.requestVersion;

    if (append) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
      this.query = requestedQuery;
      this.error = null;
    }

    try {
      const response = await contactService.listContacts({
        q: requestedQuery || undefined,
        cursor,
        limit: CONTACT_PAGE_SIZE,
      });

      if (version !== this.requestVersion) return;

      runInAction(() => {
        const incoming = response.data.map((profile) => withContactStatus(profile, true));
        incoming.forEach((profile) => this.contactStatuses.set(profile.id, true));

        if (append) {
          const merged = new Map(this.contacts.map((profile) => [profile.id, profile]));
          incoming.forEach((profile) => merged.set(profile.id, profile));
          this.contacts = Array.from(merged.values());
        } else {
          this.contacts = incoming;
        }

        this.nextCursor = response.meta.next_cursor;
        this.hasMore = response.meta.has_more;
      });
    } catch (error: unknown) {
      if (version !== this.requestVersion) return;
      runInAction(() => {
        this.error = getErrorMessage(error, "Could not load contacts.");
        if (!append) {
          this.contacts = [];
          this.nextCursor = null;
          this.hasMore = false;
        }
      });
    } finally {
      if (version === this.requestVersion) {
        runInAction(() => {
          this.isLoading = false;
          this.isLoadingMore = false;
        });
      }
    }
  }

  async loadMore(): Promise<void> {
    await this.loadContacts(this.query, true);
  }

  async addContact(userId: string): Promise<PublicUserProfile | null> {
    if (this.addingIds.has(userId)) return null;

    this.addingIds.add(userId);
    this.actionError = null;

    try {
      const response = await contactService.addContact(userId);
      const saved = withContactStatus(response.data, true);
      runInAction(() => {
        this.contactStatuses.set(userId, true);
        this.upsertVisibleContact(saved);
      });
      return saved;
    } catch (error: unknown) {
      runInAction(() => {
        this.actionError = getErrorMessage(error, "Could not add this contact.");
      });
      return null;
    } finally {
      runInAction(() => {
        this.addingIds.delete(userId);
      });
    }
  }

  async removeContact(userId: string): Promise<boolean> {
    if (this.removingIds.has(userId)) return false;

    this.removingIds.add(userId);
    this.actionError = null;

    try {
      await contactService.removeContact(userId);
      runInAction(() => {
        this.contactStatuses.set(userId, false);
        this.contacts = this.contacts.filter((contact) => contact.id !== userId);
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.actionError = getErrorMessage(error, "Could not remove this contact.");
      });
      return false;
    } finally {
      runInAction(() => {
        this.removingIds.delete(userId);
      });
    }
  }

  applyContactAdded(profile: PublicUserProfile) {
    const saved = withContactStatus(profile, true);
    this.contactStatuses.set(profile.id, true);
    this.upsertVisibleContact(saved);
  }

  applyContactRemoved(userId: string) {
    this.contactStatuses.set(userId, false);
    this.contacts = this.contacts.filter((contact) => contact.id !== userId);
  }
}

const contactStore = new ContactStore();

export default contactStore;
