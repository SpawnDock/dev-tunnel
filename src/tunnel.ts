// src/tunnel.ts
import WebSocket from "ws";
import type { TunnelConfig } from "./config.js";
import { parseInbound, serialize } from "./protocol.js";
import { proxyRequest } from "./proxy.js";

export function createTunnel(config: TunnelConfig): void {
  const localOrigin = `http://127.0.0.1:${config.port}`;
  const wsUrl = buildWsUrl(config);

  connect(wsUrl, config, localOrigin);
}

function buildWsUrl(config: TunnelConfig): string {
  const base = config.controlPlane.replace(/^http/, "ws").replace(/\/$/, "");
  return `${base}/tunnel/connect?token=${encodeURIComponent(config.deviceSecret)}`;
}

function connect(wsUrl: string, config: TunnelConfig, localOrigin: string): void {
  const ws = new WebSocket(wsUrl);
  let heartbeatInterval: NodeJS.Timeout | null = null;

  ws.on("open", () => {
    console.log(`Connected to ${config.controlPlane}`);
    ws.send(serialize({
      type: "hello",
      projectSlug: config.projectSlug,
      port: config.port,
      protocolVersion: 1,
    }));

    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialize({
          type: "heartbeat",
          projectSlug: config.projectSlug,
          timestamp: Date.now(),
        }));
      }
    }, 15_000);
  });

  ws.on("message", async (data) => {
    const msg = parseInbound(data.toString());
    if (!msg) return;

    if (msg.type === "ping") {
      ws.send(serialize({ type: "pong", nonce: msg.nonce }));
      return;
    }

    if (msg.type === "http-request") {
      try {
        const response = await proxyRequest(msg.request, localOrigin);
        ws.send(serialize({ type: "http-response", response }));
      } catch (err: any) {
        ws.send(serialize({
          type: "error",
          requestId: msg.request.requestId,
          message: err.message,
        }));
      }
    }
  });

  ws.on("close", () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    console.log("Disconnected. Reconnecting in 2s...");
    setTimeout(() => connect(wsUrl, config, localOrigin), 2000);
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error: ${err.message}`);
  });
}
