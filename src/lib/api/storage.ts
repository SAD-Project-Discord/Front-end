// src/lib/api/storage.ts
import { fetchApi } from "./api";
import type { ApiMedia } from "./messages";

export const storageApi = {
  /** Uploads a single file and returns the media object to attach to a message. */
  upload: (file: File): Promise<{ success: true; data: ApiMedia }> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi("/storage/upload/", { method: "POST", body: formData });
  },

  deleteFile: (mediaId: string): Promise<void> =>
    fetchApi(`/storage/files/${encodeURIComponent(mediaId)}/`, { method: "DELETE" }),
};
