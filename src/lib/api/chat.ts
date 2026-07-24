// src/lib/api/chat.ts
import type { ApiMessage } from './messages';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/v1';

export type Room =
  | { type: "direct"; target_id: string }
  | { type: "group"; target_id: string }
  | { type: "channel"; target_id: string; topic_id?: string };

export type WsIncoming =
  | { event: "connected"; data: { user_id: string } }
  | { event: "message.new"; data: ApiMessage }
  | { event: "message.updated"; data: ApiMessage }
  | { event: "message.deleted"; data: { id: string; room: string } }
  | { event: "typing"; data: { user_id: string; is_typing: boolean; room: string } }
  | { event: "error"; data: { code: string; message: string } };

type EventHandler = (data: any) => void;

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  connect() {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found for WebSocket connection');
      return;
    }

    this.ws = new WebSocket(`${WS_BASE_URL}/messages/?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload: WsIncoming = JSON.parse(event.data);
        this.triggerEvent(payload.event, payload.data);
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      if (event.code === 4401) {
        console.error("Unauthorized — refresh token required");
      }
      console.log('WebSocket disconnected', event.code);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // --- Actions ---

  subscribeToRoom(room: Room) {
    this.send({ action: "subscribe", room });
  }

  unsubscribeFromRoom(room: Room) {
    this.send({ action: "unsubscribe", room });
  }

  sendTypingIndicator(room: Room, isTyping: boolean) {
    this.send({ action: "typing", room, is_typing: isTyping });
  }

  private send(payload: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // --- Event Emitters ---

  on(event: WsIncoming['event'], handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  off(event: WsIncoming['event'], handler: EventHandler) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private triggerEvent(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

// Export a singleton instance for global use across the app
export const chatWs = new ChatWebSocketClient();
