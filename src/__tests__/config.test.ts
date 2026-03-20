import { describe, it, expect, vi, afterEach } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveConfig } from "../config.js";

describe("resolveConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves from CLI args", () => {
    const config = resolveConfig([
      "--control-plane", "http://localhost:8787",
      "--project-slug", "my-app",
      "--device-secret", "secret123",
      "--port", "4000",
    ]);
    expect(config.controlPlane).toBe("http://localhost:8787");
    expect(config.projectSlug).toBe("my-app");
    expect(config.deviceSecret).toBe("secret123");
    expect(config.port).toBe(4000);
  });

  it("throws when required fields missing", () => {
    expect(() => resolveConfig([])).toThrow("Missing");
  });

  it("defaults port to 3000", () => {
    const config = resolveConfig([
      "--control-plane", "http://localhost:8787",
      "--project-slug", "my-app",
      "--device-secret", "secret",
    ]);
    expect(config.port).toBe(3000);
  });

  it("reads from spawndock.dev-tunnel.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "spawndock-dev-tunnel-"));
    writeFileSync(
      join(dir, "spawndock.dev-tunnel.json"),
      JSON.stringify({
        controlPlane: "http://localhost:8787",
        projectSlug: "my-app",
        deviceSecret: "secret123",
        port: 4010,
      }),
    );

    const config = resolveConfig([], dir);
    expect(config.controlPlane).toBe("http://localhost:8787");
    expect(config.projectSlug).toBe("my-app");
    expect(config.deviceSecret).toBe("secret123");
    expect(config.port).toBe(4010);
  });

  it("reads previewPath from legacy spawndock.config.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "spawndock-config-"));
    writeFileSync(
      join(dir, "spawndock.config.json"),
      JSON.stringify({
        controlPlaneUrl: "http://localhost:8787",
        projectSlug: "my-app",
        deviceSecret: "secret123",
        localPort: 4010,
        previewPath: "/preview/my-app",
      }),
    );

    const config = resolveConfig([], dir);
    expect(config.previewPath).toBe("/preview/my-app");
  });
});
