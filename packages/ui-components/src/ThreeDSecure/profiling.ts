import type {
  ProfilingMethodStatus,
  ProfilingRequest,
  ProfilingResponse,
} from "./types";

const API = import.meta.env.VITE_API_URL as string;

export class ProfilingError extends Error {
  /** The HTTP status. 403 means 3DS profiling is off for the app. */
  status: number;

  constructor(status: number) {
    super(`3DS profiling request failed with status ${status}`);
    this.name = "ProfilingError";
    this.status = status;
  }
}

async function send(
  app: string,
  path: string,
  method: "POST" | "PATCH",
  body: object,
  signal?: AbortSignal
): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "X-Evervault-App-Id": app,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) throw new ProfilingError(response.status);
  return response;
}

/** Starts 3DS profiling for a card. Throws a `ProfilingError` on an error response. */
export async function createProfiling(
  app: string,
  request: ProfilingRequest,
  signal?: AbortSignal
): Promise<ProfilingResponse> {
  const response = await send(
    app,
    "/frontend/3ds/profiling",
    "POST",
    request,
    signal
  );
  return (await response.json()) as ProfilingResponse;
}

/** Tells the backend whether the issuer's 3DS Method page finished loading. */
export async function reportProfilingMethod(
  app: string,
  profilingId: string,
  status: ProfilingMethodStatus,
  signal?: AbortSignal
): Promise<void> {
  await send(
    app,
    `/frontend/3ds/profiling/${encodeURIComponent(profilingId)}`,
    "PATCH",
    { browserFingerprint: status },
    signal
  );
}
