import { makeAutoObservable } from "mobx";

/**
 * Drives the global "user profile" modal. Deliberately decoupled from Next.js
 * routing — see `src/lib/profileNav.ts` for why: the modal is opened/closed
 * via shallow History API calls so whatever page is currently mounted never
 * unmounts underneath it.
 */
class ProfileModalStore {
  openUserId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  open(userId: string) {
    this.openUserId = userId;
  }

  close() {
    this.openUserId = null;
  }
}

const profileModalStore = new ProfileModalStore();
export default profileModalStore;
