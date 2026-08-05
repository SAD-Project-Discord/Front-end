// src/lib/chat/attachmentMetaCache.ts
//
// The backend only ever returns `{ id }` for a message's media — no
// filename, mimetype, or size. The only place that information is ever
// known is client-side, at the moment *this* session uploads the file. We
// stash it here (in-memory, session-scoped — not worth persisting) so the
// sender's own view can render a proper preview; attachments from other
// senders, or reloaded from history, fall back to a generic file chip.

interface AttachmentMeta {
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

const cache = new Map<string, AttachmentMeta>();

export function setAttachmentMeta(fileKey: string, meta: AttachmentMeta): void {
  cache.set(fileKey, meta);
}

export function getAttachmentMeta(fileKey: string): AttachmentMeta {
  return cache.get(fileKey) ?? {};
}
