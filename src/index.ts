#!/usr/bin/env node
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveConfig, type TunnelConfig } from "./config.js";
import { createTunnel } from "./tunnel.js";

export function buildStartupMessages(config: TunnelConfig): string[] {
  const lines = [
    `SpawnDock dev tunnel: ${config.projectSlug} -> http://127.0.0.1:${config.port}`,
  ];

  if (typeof config.telegramMiniAppUrl === "string" && config.telegramMiniAppUrl.length > 0) {
    lines.push(`TMA URL: ${config.telegramMiniAppUrl}`);
  }

  return lines;
}

export function runCli(): void {
  try {
    const config = resolveConfig();
    for (const line of buildStartupMessages(config)) {
      console.log(line);
    }
    createTunnel(config);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

const currentEntrypoint = process.argv[1]
  ? basename(process.argv[1])
  : "";
const isCliEntrypoint =
  currentEntrypoint === "spawn-dock-tunnel" ||
  currentEntrypoint === "spawndock-tunnel" ||
  currentEntrypoint === basename(fileURLToPath(import.meta.url));

if (isCliEntrypoint) {
  runCli();
}
