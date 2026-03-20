import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TunnelConfig {
  controlPlane: string;
  projectSlug: string;
  deviceSecret: string;
  port: number;
  previewPath?: string;
}

const PRIMARY_CONFIG_FILE = "spawndock.dev-tunnel.json";
const LEGACY_CONFIG_FILE = "spawndock.config.json";

function readNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeConfig(data: unknown): Partial<TunnelConfig> {
  if (typeof data !== "object" || data === null) {
    return {};
  }

  const record = data as Record<string, unknown>;
  const controlPlane =
    typeof record.controlPlane === "string"
      ? record.controlPlane
      : typeof record.controlPlaneUrl === "string"
        ? record.controlPlaneUrl
        : undefined;
  const projectSlug =
    typeof record.projectSlug === "string" ? record.projectSlug : undefined;
  const deviceSecret =
    typeof record.deviceSecret === "string"
      ? record.deviceSecret
      : typeof record.deviceToken === "string"
        ? record.deviceToken
        : undefined;
  const port =
    typeof record.port === "number"
      ? record.port
      : typeof record.localPort === "number"
        ? record.localPort
        : undefined;
  const previewPath =
    typeof record.previewPath === "string" ? record.previewPath : undefined;

  return { controlPlane, projectSlug, deviceSecret, port, previewPath };
}

function readConfigFile(dir: string): Partial<TunnelConfig> {
  const merged: Partial<TunnelConfig> = {};

  for (const fileName of [LEGACY_CONFIG_FILE, PRIMARY_CONFIG_FILE]) {
    try {
      const raw = readFileSync(resolve(dir, fileName), "utf-8");
      Object.assign(merged, normalizeConfig(JSON.parse(raw)));
    } catch {
      // Try next candidate.
    }
  }

  return merged;
}

function parseArgs(argv: string[]): Partial<TunnelConfig> {
  const result: Partial<TunnelConfig> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--control-plane" || arg.startsWith("--control-plane=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next;
      if (value) {
        result.controlPlane = value;
      }
      if (!arg.includes("=")) {
        i++;
      }
      continue;
    }

    if (arg === "--project-slug" || arg.startsWith("--project-slug=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next;
      if (value) {
        result.projectSlug = value;
      }
      if (!arg.includes("=")) {
        i++;
      }
      continue;
    }

    if (arg === "--device-secret" || arg.startsWith("--device-secret=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next;
      if (value) {
        result.deviceSecret = value;
      }
      if (!arg.includes("=")) {
        i++;
      }
      continue;
    }

    if (arg === "--port" || arg.startsWith("--port=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next;
      const parsed = readNumber(value);
      if (parsed !== undefined) {
        result.port = parsed;
      }
      if (!arg.includes("=")) {
        i++;
      }
    }
  }
  return result;
}

export function resolveConfig(
  argv: string[] = process.argv.slice(2),
  cwd: string = process.cwd(),
): TunnelConfig {
  const file = readConfigFile(cwd);
  const args = parseArgs(argv);
  const env: Partial<TunnelConfig> = {
    controlPlane: process.env.SPAWNDOCK_CONTROL_PLANE,
    projectSlug: process.env.SPAWNDOCK_PROJECT_SLUG,
    deviceSecret: process.env.SPAWNDOCK_DEVICE_SECRET,
    port: readNumber(process.env.SPAWNDOCK_PORT),
  };

  // Priority: CLI > Env > File
  const controlPlane = args.controlPlane ?? env.controlPlane ?? file.controlPlane;
  const projectSlug = args.projectSlug ?? env.projectSlug ?? file.projectSlug;
  const deviceSecret = args.deviceSecret ?? env.deviceSecret ?? file.deviceSecret;
  const port = args.port ?? env.port ?? file.port ?? 3000;
  const previewPath = file.previewPath;

  if (!controlPlane) throw new Error("Missing --control-plane or SPAWNDOCK_CONTROL_PLANE");
  if (!projectSlug) throw new Error("Missing --project-slug or SPAWNDOCK_PROJECT_SLUG");
  if (!deviceSecret) throw new Error("Missing --device-secret or SPAWNDOCK_DEVICE_SECRET");

  return { controlPlane, projectSlug, deviceSecret, port, previewPath };
}
