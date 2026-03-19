// src/config.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TunnelConfig {
  controlPlane: string;
  projectSlug: string;
  deviceSecret: string;
  port: number;
}

function readConfigFile(dir: string): Partial<TunnelConfig> {
  try {
    const raw = readFileSync(resolve(dir, "spawndock.config.json"), "utf-8");
    const data = JSON.parse(raw);
    return {
      controlPlane: typeof data.controlPlaneUrl === "string" ? data.controlPlaneUrl : undefined,
      projectSlug: typeof data.projectSlug === "string" ? data.projectSlug : undefined,
      deviceSecret: typeof data.deviceToken === "string" ? data.deviceToken : undefined,
      port: typeof data.localPort === "number" ? data.localPort : undefined,
    };
  } catch {
    return {};
  }
}

function parseArgs(argv: string[]): Partial<TunnelConfig> {
  const result: Partial<TunnelConfig> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--control-plane" && next) { result.controlPlane = next; i++; }
    if (arg === "--project-slug" && next) { result.projectSlug = next; i++; }
    if (arg === "--device-secret" && next) { result.deviceSecret = next; i++; }
    if (arg === "--port" && next) { result.port = parseInt(next, 10); i++; }
  }
  return result;
}

export function resolveConfig(argv: string[] = process.argv.slice(2)): TunnelConfig {
  const file = readConfigFile(process.cwd());
  const args = parseArgs(argv);
  const env: Partial<TunnelConfig> = {
    controlPlane: process.env.SPAWNDOCK_CONTROL_PLANE,
    projectSlug: process.env.SPAWNDOCK_PROJECT_SLUG,
    deviceSecret: process.env.SPAWNDOCK_DEVICE_SECRET,
    port: process.env.SPAWNDOCK_PORT ? parseInt(process.env.SPAWNDOCK_PORT, 10) : undefined,
  };

  // Priority: CLI > Env > File
  const controlPlane = args.controlPlane ?? env.controlPlane ?? file.controlPlane;
  const projectSlug = args.projectSlug ?? env.projectSlug ?? file.projectSlug;
  const deviceSecret = args.deviceSecret ?? env.deviceSecret ?? file.deviceSecret;
  const port = args.port ?? env.port ?? file.port ?? 3000;

  if (!controlPlane) throw new Error("Missing --control-plane or SPAWNDOCK_CONTROL_PLANE");
  if (!projectSlug) throw new Error("Missing --project-slug or SPAWNDOCK_PROJECT_SLUG");
  if (!deviceSecret) throw new Error("Missing --device-secret or SPAWNDOCK_DEVICE_SECRET");

  return { controlPlane, projectSlug, deviceSecret, port };
}
