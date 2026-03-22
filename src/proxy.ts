// src/proxy.ts
import type { SerializedHttpRequest, SerializedHttpResponse } from "./protocol.js";

const HOP_BY_HOP = new Set([
  "connection", "host", "keep-alive", "proxy-authenticate",
  "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "content-length",
]);
const REQUEST_HEADERS_TO_DROP = new Set([
  ...HOP_BY_HOP,
  "accept-encoding",
]);
const RESPONSE_HEADERS_TO_DROP = new Set([
  ...HOP_BY_HOP,
  "content-encoding",
]);

function filterResponseHeaders(headers: Headers): [string, string][] {
  const result: [string, string][] = [];

  for (const [name, value] of headers.entries()) {
    if (!RESPONSE_HEADERS_TO_DROP.has(name.toLowerCase())) {
      result.push([name, value]);
    }
  }

  return result;
}

function decodeBody(body: { encoding: string; value: string }): string | ArrayBuffer {
  if (body.encoding === "utf8") return body.value;
  const buf = Buffer.from(body.value, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export async function proxyRequest(
  request: SerializedHttpRequest,
  localOrigin: string
): Promise<SerializedHttpResponse> {
  const url = new URL(request.path, localOrigin);
  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (!REQUEST_HEADERS_TO_DROP.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  }

  const init: RequestInit = { method: request.method, headers };
  const method = request.method.toUpperCase();
  if (request.body && method !== "GET" && method !== "HEAD") {
    init.body = decodeBody(request.body);
  }

  try {
    const res = await fetch(url, init);
    const bodyBytes = new Uint8Array(await res.arrayBuffer());
    const responseHeaders = filterResponseHeaders(res.headers);

    const response: SerializedHttpResponse = {
      requestId: request.requestId,
      status: res.status,
      headers: responseHeaders,
    };

    if (bodyBytes.byteLength > 0) {
      return {
        ...response,
        body: { encoding: "base64", value: Buffer.from(bodyBytes).toString("base64") },
      };
    }

    return response;
  } catch (err: any) {
    return {
      requestId: request.requestId,
      status: 503,
      headers: [["content-type", "application/json"]],
      body: {
        encoding: "utf8",
        value: JSON.stringify({
          error: "server_offline",
          message: "Local development server is offline. Start it again with `npm run dev`.",
        }),
      },
    };
  }
}
