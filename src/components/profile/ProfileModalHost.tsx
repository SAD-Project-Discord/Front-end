"use client";

import { observer } from "mobx-react-lite";
import ProfileDialog from "./ProfileDialog";
import profileModalStore from "@/stores/ProfileModalStore";
import { closeUserProfile } from "@/lib/profileNav";

/**
 * Mounted once at the protected-layout level so the profile modal can be
 * opened from anywhere in the app (message senders, member lists, headers,
 * etc.) without prop-drilling — see `openUserProfile` in `profileNav.ts`.
 */
function ProfileModalHost() {
  return <ProfileDialog userId={profileModalStore.openUserId} onClose={closeUserProfile} />;
}

export default observer(ProfileModalHost);
