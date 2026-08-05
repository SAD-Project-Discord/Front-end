// src/lib/api/storage.ts
import { fetchApi } from "./api";

export interface UploadedFile {
  file_key: string;
}

export interface FileUrl {
  file_key: string;
  presigned_url: string;
}

export const storageApi = {
  /** Uploads a single file and returns the key used to send it as a message attachment. */
  upload: (file: File): Promise<{ success: true; data: UploadedFile }> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi("/storage/upload/", { method: "POST", body: formData });
  },

  getFileUrl: (fileKey: string): Promise<{ success: true; data: FileUrl }> =>
    fetchApi(`/storage/files/${encodeURIComponent(fileKey)}/`),

  deleteFile: (fileKey: string): Promise<void> =>
    fetchApi(`/storage/files/${encodeURIComponent(fileKey)}/`, { method: "DELETE" }),
};
