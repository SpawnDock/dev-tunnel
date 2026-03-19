// src/protocol.ts
export interface SerializedHttpRequest {
  requestId: string;
  method: string;
  path: string;
  headers: [string, string][];
  body?: { encoding: "utf8" | "base64"; value: string };
}

export interface SerializedHttpResponse {
  requestId: string;
  status: number;
  headers: [string, string][];
  body?: { encoding: "utf8" | "base64"; value: string };
}

export type InboundMessage =
  | { type: "http-request"; request: SerializedHttpRequest }
  | { type: "ping"; nonce: string };

export type OutboundMessage =
  | { type: "hello"; projectSlug: string; port: number; protocolVersion: 1 }
  | { type: "heartbeat"; projectSlug: string; timestamp: number }
  | { type: "http-response"; response: SerializedHttpResponse }
  | { type: "pong"; nonce: string }
  | { type: "error"; requestId?: string; message: string };

export function parseInbound(data: string): InboundMessage | null {
  try {
    const msg = JSON.parse(data);
    if (msg.type === "http-request" && msg.request) return msg;
    if (msg.type === "ping" && typeof msg.nonce === "string") return msg;
    return null;
  } catch {
    return null;
  }
}

export function serialize(msg: OutboundMessage): string {
  return JSON.stringify(msg);
}
