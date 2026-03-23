import { describe, expect, it } from "vitest";
import { buildStartupMessages } from "../index.js";

describe("buildStartupMessages", () => {
  it("prints the tunnel target and Telegram link when available", () => {
    expect(buildStartupMessages({
      controlPlane: "https://spawn-dock.w3voice.net",
      projectSlug: "demo-app",
      deviceSecret: "secret_123",
      port: 3001,
      telegramMiniAppUrl: "https://t.me/TMASpawnerBot/tma?startapp=demo-app",
    })).toEqual([
      "SpawnDock dev tunnel: demo-app -> http://127.0.0.1:3001",
      "TMA URL: https://t.me/TMASpawnerBot/tma?startapp=demo-app",
    ]);
  });

  it("omits the Telegram link when the config does not include one", () => {
    expect(buildStartupMessages({
      controlPlane: "https://spawn-dock.w3voice.net",
      projectSlug: "demo-app",
      deviceSecret: "secret_123",
      port: 3001,
    })).toEqual([
      "SpawnDock dev tunnel: demo-app -> http://127.0.0.1:3001",
    ]);
  });
});
