import { describe, it, expect, vi, afterEach } from "vitest";
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
});
