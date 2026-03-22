import { describe, it, expect } from "vitest";
import { parseInbound, serialize } from "../protocol.js";
import { buildWsUrl, getReconnectDelayMs } from "../tunnel.js";

describe("parseInbound", () => {
  it("parses http-request", () => {
    const msg = parseInbound(JSON.stringify({
      type: "http-request",
      request: { requestId: "r1", method: "GET", path: "/", headers: [] },
    }));
    expect(msg?.type).toBe("http-request");
  });

  it("parses ping", () => {
    const msg = parseInbound(JSON.stringify({ type: "ping", nonce: "abc" }));
    expect(msg).toEqual({ type: "ping", nonce: "abc" });
  });

  it("returns null for invalid JSON", () => {
    expect(parseInbound("not json")).toBeNull();
  });

  it("returns null for unknown type", () => {
    expect(parseInbound(JSON.stringify({ type: "unknown" }))).toBeNull();
  });
});

describe("serialize", () => {
  it("serializes outbound message", () => {
    const result = serialize({ type: "hello", projectSlug: "test", port: 3000, protocolVersion: 1 });
    const parsed = JSON.parse(result);
    expect(parsed.type).toBe("hello");
    expect(parsed.projectSlug).toBe("test");
  });

  it("serializes heartbeat with protocol version compatible messages", () => {
    const result = serialize({ type: "pong", nonce: "abc" });
    expect(JSON.parse(result)).toEqual({ type: "pong", nonce: "abc" });
  });

  it("builds a tunnel url with protocolVersion and token", () => {
    expect(
      buildWsUrl({
        controlPlane: "https://api.example.com",
        projectSlug: "test",
        deviceSecret: "secret-123",
        port: 3000,
      }),
    ).toBe("wss://api.example.com/tunnel/connect?protocolVersion=1&token=secret-123");
  });

  it("caps reconnect delay at 30 seconds", () => {
    expect(getReconnectDelayMs(1)).toBe(1000);
    expect(getReconnectDelayMs(2)).toBe(2000);
    expect(getReconnectDelayMs(5)).toBe(16000);
    expect(getReconnectDelayMs(6)).toBe(30000);
    expect(getReconnectDelayMs(7)).toBe(30000);
  });
});
