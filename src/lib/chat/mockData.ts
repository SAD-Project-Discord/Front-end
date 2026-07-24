import type {
  Attachment,
  AudioAttachment,
  Conversation,
  ConversationType,
  DocumentAttachment,
  GenericFileAttachment,
  ImageAttachment,
  Message,
  MessageStatus,
  MessageType,
  StickerAttachment,
  User,
  VideoAttachment,
} from "../types";

/* -------------------------------------------------------------------------
 * Deterministic PRNG
 *
 * We want mock data that is stable across reloads (so screenshots, visual
 * diffs, and manual QA don't shift every refresh) but still "random enough"
 * to look realistic. A tiny seeded PRNG gives us both.
 * ---------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(1337);

function randomInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function pickWeighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function chance(probability: number): boolean {
  return rng() < probability;
}

function uid(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

/* -------------------------------------------------------------------------
 * Users
 * ---------------------------------------------------------------------- */

export const CURRENT_USER_ID = "user_0000";

const USERNAMES = [
  "kaidenrivers",
  "sofia.codes",
  "marcus_wolfe",
  "elena.kim",
  "trvis.dev",
  "priya.raman",
  "jordan.blake",
  "yukisnow",
  "diego_martins",
  "amara.oduya",
  "leo.fontaine",
  "hana.tanaka",
  "oscar.vega",
  "nina_petrova",
  "samir.khoury",
  "chloe.bergman",
  "ravi.desai",
  "isla.mackenzie",
  "tomas.novak",
  "zara.hassan",
  "felix.brandt",
  "maya.lindqvist",
  "adrian.cruz",
  "noor.abadi",
  "gustav.holm",
];

const DISPLAY_NAMES = [
  "Kaiden Rivers",
  "Sofia Alvarez",
  "Marcus Wolfe",
  "Elena Kim",
  "Travis Nguyen",
  "Priya Raman",
  "Jordan Blake",
  "Yuki Sato",
  "Diego Martins",
  "Amara Oduya",
  "Leo Fontaine",
  "Hana Tanaka",
  "Oscar Vega",
  "Nina Petrova",
  "Samir Khoury",
  "Chloe Bergman",
  "Ravi Desai",
  "Isla Mackenzie",
  "Tomas Novak",
  "Zara Hassan",
  "Felix Brandt",
  "Maya Lindqvist",
  "Adrian Cruz",
  "Noor Abadi",
  "Gustav Holm",
];

function avatarUrl(seed: string): string {
  return `https://i.pravatar.cc/150?u=${seed}`;
}

function buildUsers(): User[] {
  const currentUser: User = {
    id: CURRENT_USER_ID,
    displayName: "You",
    username: "me",
    avatarUrl: avatarUrl("current-user"),
    isOnline: true,
  };

  const others: User[] = USERNAMES.map((username, i) => {
    const isOnline = chance(0.4);
    return {
      id: uid("user", i + 1),
      displayName: DISPLAY_NAMES[i],
      username,
      avatarUrl: avatarUrl(username),
      isOnline,
      lastSeenAt: isOnline
        ? undefined
        : new Date(
            Date.now() - randomInt(5, 60 * 24 * 3) * 60 * 1000
          ).toISOString(),
    };
  });

  return [currentUser, ...others];
}

export const mockUsers: User[] = buildUsers();
export const currentUser: User = mockUsers[0];

function userById(id: string): User {
  const found = mockUsers.find((u) => u.id === id);
  if (!found) throw new Error(`Unknown mock user id: ${id}`);
  return found;
}

/* -------------------------------------------------------------------------
 * Content banks
 * ---------------------------------------------------------------------- */

const TEXT_LINES = [
  "hey, did you see the new build?",
  "lol yeah that's wild",
  "can we push the meeting to 3pm?",
  "sent over the files, lmk if anything's missing",
  "no worries, take your time",
  "this looks great, nice work",
  "one sec, grabbing my laptop",
  "did the deploy go through?",
  "haha classic",
  "I'll take a look after lunch",
  "sounds good to me",
  "can you send the invite link again?",
  "just landed, give me 10 min",
  "that bug is finally fixed",
  "omg finally 😩",
  "let's sync tomorrow morning",
  "appreciate you handling that",
  "wait what happened",
  "on it",
  "sorry, was afk for a bit",
  "yeah let's do that",
  "pushed a fix, can you pull latest?",
  "this is exactly what I needed, thank you",
  "no way, seriously?",
  "I'm down for that",
  "let me double check and get back to you",
  "that meeting ran long lol",
  "same, I'm exhausted",
  "can we hop on a call?",
  "all good on my end",
];

const EMOJI_LINES = ["👍", "😂", "🔥", "😭", "🎉", "👀", "💀", "❤️", "😅", "🙌"];

const CAPTIONS = [
  "thoughts?",
  "look what I found",
  "finally done with this",
  "this made me laugh so hard",
  "check this out",
  "from earlier today",
  "for the record",
  undefined,
  undefined,
  undefined,
];

const IMAGE_TOPICS = [
  "mountains",
  "city-night",
  "coffee",
  "dog",
  "cat",
  "beach",
  "forest",
  "food",
  "concert",
  "sunset",
];

const VIDEO_TOPICS = ["clip", "recording", "demo", "highlight"];

const DOCUMENT_FILES = [
  { name: "Q3-report.pdf", pages: 12 },
  { name: "design-spec.pdf", pages: 5 },
  { name: "meeting-notes.pdf", pages: 2 },
  { name: "contract-draft.pdf", pages: 8 },
  { name: "onboarding-guide.pdf", pages: 20 },
];

const GENERIC_FILES = [
  { name: "archive.zip", mime: "application/zip" },
  { name: "backup.sql", mime: "application/sql" },
  { name: "assets.tar.gz", mime: "application/gzip" },
  { name: "config.json", mime: "application/json" },
  { name: "presentation.key", mime: "application/x-iwork-keynote-sffkey" },
];

const STICKER_PACKS = ["classic-pack", "party-pack", "reactions-pack"];

/* -------------------------------------------------------------------------
 * Attachment builders
 * ---------------------------------------------------------------------- */

let attachmentCounter = 0;
function nextAttachmentId(): string {
  attachmentCounter += 1;
  return uid("attachment", attachmentCounter);
}

function maybeCaption(): string | undefined {
  return pick(CAPTIONS);
}

function buildStickerAttachment(): StickerAttachment {
  const pack = pick(STICKER_PACKS);
  const stickerId = `sticker-${randomInt(1, 40)}`;
  return {
    id: nextAttachmentId(),
    type: "sticker",
    url: `https://picsum.photos/seed/${pack}-${stickerId}/200/200`,
    packId: pack,
    stickerId,
    caption: maybeCaption(),
  };
}

function buildImageAttachment(): ImageAttachment {
  const topic = pick(IMAGE_TOPICS);
  const seed = `${topic}-${randomInt(1, 999)}`;
  const width = pick([800, 1024, 1200]);
  const height = pick([600, 768, 900]);
  return {
    id: nextAttachmentId(),
    type: "image",
    url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
    thumbnailUrl: `https://picsum.photos/seed/${seed}/200/150`,
    width,
    height,
    mimeType: "image/jpeg",
    sizeBytes: randomInt(80_000, 4_500_000),
    altText: `Photo related to ${topic}`,
    caption: maybeCaption(),
  };
}

function buildVideoAttachment(): VideoAttachment {
  const topic = pick(VIDEO_TOPICS);
  const seed = `${topic}-${randomInt(1, 999)}`;
  return {
    id: nextAttachmentId(),
    type: "video",
    url: `https://example-cdn.test/videos/${seed}.mp4`,
    thumbnailUrl: `https://picsum.photos/seed/${seed}/400/225`,
    width: 1280,
    height: 720,
    durationSeconds: randomInt(4, 180),
    mimeType: "video/mp4",
    sizeBytes: randomInt(1_000_000, 60_000_000),
    caption: maybeCaption(),
  };
}

function buildAudioAttachment(): AudioAttachment {
  const isVoiceNote = chance(0.7);
  const waveform = Array.from({ length: 24 }, () => Math.round(rng() * 100));
  return {
    id: nextAttachmentId(),
    type: "audio",
    url: `https://example-cdn.test/audio/${uid("clip", randomInt(1, 999))}.m4a`,
    durationSeconds: randomInt(2, 240),
    isVoiceNote,
    waveform,
    mimeType: "audio/m4a",
    sizeBytes: randomInt(20_000, 3_000_000),
    caption: isVoiceNote ? undefined : maybeCaption(),
  };
}

function buildDocumentAttachment(): DocumentAttachment {
  const doc = pick(DOCUMENT_FILES);
  return {
    id: nextAttachmentId(),
    type: "document",
    url: `https://example-cdn.test/documents/${doc.name}`,
    fileName: doc.name,
    pageCount: doc.pages,
    mimeType: "application/pdf",
    sizeBytes: randomInt(50_000, 8_000_000),
    caption: maybeCaption(),
  };
}

function buildGenericFileAttachment(): GenericFileAttachment {
  const file = pick(GENERIC_FILES);
  return {
    id: nextAttachmentId(),
    type: "file",
    url: `https://example-cdn.test/files/${file.name}`,
    fileName: file.name,
    mimeType: file.mime,
    sizeBytes: randomInt(10_000, 20_000_000),
    caption: maybeCaption(),
  };
}

function buildAttachmentsFor(type: MessageType): Attachment[] | undefined {
  switch (type) {
    case "sticker":
      return [buildStickerAttachment()];
    case "image":
      return chance(0.15)
        ? [buildImageAttachment(), buildImageAttachment()]
        : [buildImageAttachment()];
    case "video":
      return [buildVideoAttachment()];
    case "audio":
      return [buildAudioAttachment()];
    case "document":
      return [buildDocumentAttachment()];
    case "file":
      return [buildGenericFileAttachment()];
    default:
      return undefined;
  }
}

/* -------------------------------------------------------------------------
 * Message builders
 * ---------------------------------------------------------------------- */

const MESSAGE_TYPE_WEIGHTS: ReadonlyArray<readonly [MessageType, number]> = [
  ["text", 45],
  ["emoji", 10],
  ["sticker", 5],
  ["image", 15],
  ["video", 8],
  ["audio", 7],
  ["document", 5],
  ["file", 5],
];

const STATUS_WEIGHTS: ReadonlyArray<readonly [MessageStatus, number]> = [
  ["sent", 20],
  ["delivered", 20],
  ["read", 55],
  ["failed", 5],
];

let messageCounter = 0;
function nextMessageId(): string {
  messageCounter += 1;
  return uid("message", messageCounter);
}

function bodyFor(type: MessageType): string | undefined {
  if (type === "text") return pick(TEXT_LINES);
  if (type === "emoji") return pick(EMOJI_LINES);
  // Occasionally attach a short caption-as-body alongside media.
  return chance(0.2) ? pick(TEXT_LINES) : undefined;
}

interface BuildMessageParams {
  conversationId: string;
  senderId: string;
  createdAt: string;
  isOutgoing: boolean;
}

function buildMessage({
  conversationId,
  senderId,
  createdAt,
  isOutgoing,
}: BuildMessageParams): Message {
  const type = pickWeighted(MESSAGE_TYPE_WEIGHTS);
  const status: MessageStatus = isOutgoing
    ? pickWeighted(STATUS_WEIGHTS)
    : "read";

  return {
    id: nextMessageId(),
    conversationId,
    senderId,
    type,
    body: bodyFor(type),
    attachments: buildAttachmentsFor(type),
    status,
    createdAt,
    clientGeneratedId: isOutgoing ? uid("client", messageCounter) : undefined,
  };
}

/* -------------------------------------------------------------------------
 * Conversations
 *
 * 16 direct messages + 4 group chats = 20 conversations total.
 * Messages are distributed across conversations and spread over the last
 * ~6 days so the UI has multiple `DateSeparator` boundaries to render.
 * ---------------------------------------------------------------------- */

const TOTAL_CONVERSATIONS = 20;
const TOTAL_MESSAGES = 150;
const GROUP_CONVERSATION_COUNT = 4;
const DAYS_OF_HISTORY = 6;

const GROUP_TITLES = [
  "Frontend Guild",
  "Weekend Trip 🏔️",
  "Design Reviews",
  "Family Chat",
];

function otherUserPool(): User[] {
  return mockUsers.filter((u) => u.id !== CURRENT_USER_ID);
}

function randomTimestampWithinLastDays(days: number): Date {
  const now = Date.now();
  const msAgo = randomInt(0, days * 24 * 60 * 60 * 1000);
  return new Date(now - msAgo);
}

function buildConversationShells(): Array<{
  id: string;
  type: ConversationType;
  participants: User[];
  title?: string;
}> {
  const pool = otherUserPool();
  const shells: Array<{
    id: string;
    type: ConversationType;
    participants: User[];
    title?: string;
  }> = [];

  const directCount = TOTAL_CONVERSATIONS - GROUP_CONVERSATION_COUNT;
  for (let i = 0; i < directCount; i++) {
    const partner = pool[i % pool.length];
    shells.push({
      id: uid("conversation", i + 1),
      type: "direct",
      participants: [currentUser, partner],
    });
  }

  for (let i = 0; i < GROUP_CONVERSATION_COUNT; i++) {
    const size = randomInt(3, 5);
    const members = new Set<User>();
    while (members.size < size) {
      members.add(pick(pool));
    }
    shells.push({
      id: uid("conversation", directCount + i + 1),
      type: "group",
      participants: [currentUser, ...members],
      title: GROUP_TITLES[i],
    });
  }

  return shells;
}

function buildMessagesAndConversations(): {
  conversations: Conversation[];
  messages: Message[];
} {
  const shells = buildConversationShells();

  // Distribute 150 messages across 20 conversations, weighted so some
  // conversations are chattier than others (more realistic than a flat split).
  const weights = shells.map(() => randomInt(1, 5));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) =>
    Math.max(3, Math.round((w / weightSum) * TOTAL_MESSAGES))
  );

  // Reconcile rounding so the total is exactly TOTAL_MESSAGES.
  let diff = TOTAL_MESSAGES - counts.reduce((a, b) => a + b, 0);
  let idx = 0;
  while (diff !== 0) {
    const i = idx % counts.length;
    if (diff > 0) {
      counts[i] += 1;
      diff -= 1;
    } else if (counts[i] > 3) {
      counts[i] -= 1;
      diff += 1;
    }
    idx += 1;
  }

  const allMessages: Message[] = [];
  const conversations: Conversation[] = shells.map((shell, shellIndex) => {
    const count = counts[shellIndex];
    const candidateSenders =
      shell.type === "direct"
        ? shell.participants
        : shell.participants;

    // Build ascending timestamps within the history window for this thread.
    const timestamps = Array.from({ length: count }, () =>
      randomTimestampWithinLastDays(DAYS_OF_HISTORY)
    ).sort((a, b) => a.getTime() - b.getTime());

    const conversationMessages: Message[] = timestamps.map((ts) => {
      const sender = pick(candidateSenders);
      const isOutgoing = sender.id === CURRENT_USER_ID;
      return buildMessage({
        conversationId: shell.id,
        senderId: sender.id,
        createdAt: ts.toISOString(),
        isOutgoing,
      });
    });

    allMessages.push(...conversationMessages);

    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const isUnread = chance(0.35);
    const unreadCount = isUnread ? randomInt(1, 12) : 0;

    return {
      id: shell.id,
      type: shell.type,
      participants: shell.participants,
      title: shell.title,
      avatarUrl:
        shell.type === "group"
          ? avatarUrl(shell.title ?? shell.id)
          : undefined,
      lastMessage,
      unreadCount,
      createdAt: new Date(
        Date.now() - DAYS_OF_HISTORY * 24 * 60 * 60 * 1000
      ).toISOString(),
      updatedAt: lastMessage.createdAt,
      isMuted: chance(0.1),
      isArchived: false,
      isTyping: chance(0.08),
    };
  });

  // Sort conversations by most recent activity, Discord/DM-list style.
  conversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return { conversations, messages: allMessages };
}

const { conversations, messages } = buildMessagesAndConversations();

export const mockConversations: Conversation[] = conversations;
export const mockMessages: Message[] = messages;

/* -------------------------------------------------------------------------
 * Convenience helpers for consumers (components, storybook, dev pages)
 * ---------------------------------------------------------------------- */

export function getMessagesForConversation(conversationId: string): Message[] {
  return mockMessages
    .filter((m) => m.conversationId === conversationId)
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getConversationById(id: string): Conversation | undefined {
  return mockConversations.find((c) => c.id === id);
}

export function getUserForMessage(message: Message): User {
  return userById(message.senderId);
}
