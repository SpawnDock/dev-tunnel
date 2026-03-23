import WebSocket from "ws";
import type { TunnelConfig } from "./config.js";
import { parseInbound, serialize } from "./protocol.js";
import { proxyRequest } from "./proxy.js";

const HEARTBEAT_INTERVAL_MS = 15_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export function createTunnel(config: TunnelConfig): void {
  const localOrigin = `http://127.0.0.1:${config.port}`;
  const wsUrl = buildWsUrl(config);

  connect(wsUrl, config, localOrigin, 0);
}

function resolveForwardedPath(previewPath: string | undefined, path: string): string {
  if (!previewPath || previewPath.length === 0) {
    return path;
  }

  const normalizedPreviewPath = previewPath.replace(/\/$/, "");
  const [pathname, query = ""] = path.split("?");

  const forwardedPath =
    pathname === "/"
      ? `${normalizedPreviewPath}/`
      : `${normalizedPreviewPath}${pathname}`;

  return query.length > 0 ? `${forwardedPath}?${query}` : forwardedPath;
}

export function buildWsUrl(config: TunnelConfig): string {
  if (!URL.canParse(config.controlPlane)) {
    throw new Error(`Invalid control plane URL: ${config.controlPlane}`);
  }

  const url = new URL(config.controlPlane);
  if (url.protocol === "http:") {
    url.protocol = "ws:";
  } else if (url.protocol === "https:") {
    url.protocol = "wss:";
  }

  const currentPath = url.pathname.replace(/\/+$/, "");
  url.pathname = currentPath.length === 0 ? "/tunnel/connect" : `${currentPath}/tunnel/connect`;
  url.searchParams.set("protocolVersion", "1");
  url.searchParams.set("token", config.deviceSecret);
  return url.toString();
}

export function getReconnectDelayMs(attempt: number): number {
  return Math.min(
    INITIAL_RECONNECT_DELAY_MS * (2 ** Math.max(attempt - 1, 0)),
    MAX_RECONNECT_DELAY_MS,
  );
}

function connect(wsUrl: string, config: TunnelConfig, localOrigin: string, reconnectAttempt: number): void {
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
    }, HEARTBEAT_INTERVAL_MS);
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
        const response = await proxyRequest(
          {
            ...msg.request,
            path: resolveForwardedPath(config.previewPath, msg.request.path),
          },
          localOrigin,
        );
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

  ws.on("close", (code) => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    if (code === 4001) {
      console.log("Disconnected because another tunnel replaced this session.");
      return;
    }

    const nextAttempt = reconnectAttempt + 1;
    const delayMs = getReconnectDelayMs(nextAttempt);
    console.log(`Disconnected. Reconnecting in ${Math.round(delayMs / 1000)}s (attempt ${nextAttempt})...`);
    setTimeout(() => connect(wsUrl, config, localOrigin, nextAttempt), delayMs);
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error: ${err.message}`);
  });
}
