import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxyRequest } from "../proxy.js";

describe("proxyRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("drops accept-encoding upstream and content-encoding downstream", async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      headers: new Headers({
        "content-type": "text/html; charset=utf-8",
        "content-encoding": "gzip",
        "content-length": "123",
        etag: "demo",
      }),
      arrayBuffer: async () => new TextEncoder().encode("<html>ok</html>").buffer,
    });

    const response = await proxyRequest(
      {
        requestId: "req_1",
        method: "GET",
        path: "/",
        headers: [
          ["accept-encoding", "gzip, deflate, br"],
          ["accept-language", "en-US"],
        ],
      },
      "http://127.0.0.1:3001",
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const requestHeaders = new Headers(requestInit.headers as HeadersInit);

    expect(requestHeaders.has("accept-encoding")).toBe(false);
    expect(requestHeaders.get("accept-language")).toBe("en-US");
    expect(response.headers).toEqual([
      ["content-type", "text/html; charset=utf-8"],
      ["etag", "demo"],
    ]);
    expect(response.body?.encoding).toBe("base64");
  });
});
