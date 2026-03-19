import { describe, it, expect } from "vitest";
import { parseInbound, serialize } from "../protocol.js";

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
});
