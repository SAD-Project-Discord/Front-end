/**
 * The kind of content a message carries.
 *
 * `text` and `emoji` are content types with no binary payload.
 * `sticker` is treated as a distinct type from `image` because stickers
 * typically come from a curated pack (with a `packId`/`stickerId`) rather
 * than being arbitrary user-uploaded media.
 */
export type MessageType =
  | "text"
  | "emoji"
  | "sticker"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "file";

/**
 * Discriminant used across all attachment variants.
 * Mirrors the media-bearing subset of `MessageType`
 * (text/emoji are not attachments — they live on `Message.body`).
 */
export type AttachmentType =
  | "sticker"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "file";

/**
 * Fields shared by every attachment variant, regardless of type.
 */
interface BaseAttachment {
  /** Stable unique identifier for the attachment. */
  id: string;

  /** Discriminant for narrowing to a specific attachment shape. */
  type: AttachmentType;

  /**
   * Optional user-provided caption shown alongside the attachment.
   * Supported by every attachment type.
   */
  caption?: string;

  /** Publicly resolvable URL for the asset (CDN, signed URL, etc.). */
  url: string;

  /** Optional lower-resolution/placeholder preview URL (e.g. blurhash target, thumbnail). */
  thumbnailUrl?: string;

  /** Size of the file in bytes, if known. */
  sizeBytes?: number;

  /** MIME type of the underlying asset, if known (e.g. "image/png"). */
  mimeType?: string;
}

/** A curated sticker asset, distinct from arbitrary image uploads. */
export interface StickerAttachment extends BaseAttachment {
  type: "sticker";
  /** Identifier of the sticker pack this sticker belongs to. */
  packId: string;
  /** Identifier of the sticker within its pack. */
  stickerId: string;
}

/** A raster/vector image attachment. */
export interface ImageAttachment extends BaseAttachment {
  type: "image";
  /** Pixel width of the image, if known. */
  width?: number;
  /** Pixel height of the image, if known. */
  height?: number;
  /** Blurhash or base64 placeholder for progressive loading. */
  blurhash?: string;
  /** Alt text for accessibility. */
  altText?: string;
}

/** A video attachment. */
export interface VideoAttachment extends BaseAttachment {
  type: "video";
  /** Duration in seconds, if known. */
  durationSeconds?: number;
  /** Pixel width of the video, if known. */
  width?: number;
  /** Pixel height of the video, if known. */
  height?: number;
}

/** An audio attachment (voice notes, music clips, etc.). */
export interface AudioAttachment extends BaseAttachment {
  type: "audio";
  /** Duration in seconds, if known. */
  durationSeconds?: number;
  /** Whether this audio was recorded as a voice note in-app. */
  isVoiceNote?: boolean;
  /** Waveform amplitude samples, for rendering a waveform UI. */
  waveform?: number[];
}

/** A document attachment (PDF, DOCX, spreadsheet, etc.). */
export interface DocumentAttachment extends BaseAttachment {
  type: "document";
  /** Original filename as uploaded. */
  fileName: string;
  /** Number of pages, if applicable/known (e.g. PDFs). */
  pageCount?: number;
}

/** Catch-all for any binary file that doesn't fit the other categories. */
export interface GenericFileAttachment extends BaseAttachment {
  type: "file";
  /** Original filename as uploaded. */
  fileName: string;
}

/**
 * Discriminated union of all possible attachment shapes.
 * Narrow on `attachment.type` to access variant-specific fields.
 */
export type Attachment =
  | StickerAttachment
  | ImageAttachment
  | VideoAttachment
  | AudioAttachment
  | DocumentAttachment
  | GenericFileAttachment;
