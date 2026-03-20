#!/usr/bin/env node
import { resolveConfig } from "./config.js";
import { createTunnel } from "./tunnel.js";

try {
  const config = resolveConfig();
  console.log(
    `SpawnDock dev tunnel: ${config.projectSlug} -> http://127.0.0.1:${config.port}`,
  );
  createTunnel(config);
} catch (err: any) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
