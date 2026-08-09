// src/lib/api/stickers.ts
import { fetchApi } from "./api";

export interface Sticker {
  id: string;
  url: string;
  name?: string;
}

export interface StickerPack {
  id: string;
  name: string;
  stickers: Sticker[];
}

export const stickersApi = {
  getPacks: (): Promise<{ success: true; data: StickerPack[] }> => fetchApi("/stickers/packs/"),

  getPack: (packId: string): Promise<{ success: true; data: StickerPack }> =>
    fetchApi(`/stickers/packs/${encodeURIComponent(packId)}/`),
};
