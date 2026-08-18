"use client";

import { useEffect } from "react";

import { chatWs } from "@/lib/api/chat";
import contactStore from "@/stores/ContactStore";
import type { PublicUserProfile } from "@/types/user";

export default function ContactRealtimeSync() {
  useEffect(() => {
    const handleAdded = (data: { user_id: string; contact: PublicUserProfile }) => {
      contactStore.applyContactAdded(data.contact);
    };
    const handleRemoved = (data: { user_id: string }) => {
      contactStore.applyContactRemoved(data.user_id);
    };

    chatWs.on("contact.added", handleAdded);
    chatWs.on("contact.removed", handleRemoved);
    chatWs.connect();

    return () => {
      chatWs.off("contact.added", handleAdded);
      chatWs.off("contact.removed", handleRemoved);
      chatWs.disconnect();
    };
  }, []);

  return null;
}
