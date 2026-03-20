import { describe, expect, it } from "vitest";

import { buildWsUrl } from "../tunnel.js";

describe("buildWsUrl", () => {
  it("includes protocol version and token query params", () => {
    const url = buildWsUrl({
      controlPlane: "https://api.example.com",
      projectSlug: "demo",
      deviceSecret: "secret123",
      port: 3000,
    });

    expect(url).toBe(
      "wss://api.example.com/tunnel/connect?protocolVersion=1&token=secret123",
    );
  });
});
