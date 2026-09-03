import { MockProvider } from "./providers/mock";
import { RunPodProvider } from "./providers/runpod";
import { agentRequest } from "./services/agent";
import type { ApiResult, CloudProvider, Env } from "./types";

const API_VERSION = "0.1.0";
const PREFIX = "/api/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function json(data: ApiResult | Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function provider(env: Env): CloudProvider {
  return env.VM_PROVIDER === "runpod" ? new RunPodProvider(env) : new MockProvider();
}

function authorized(request: Request, env: Env): boolean {
  if (!env.APP_API_TOKEN) return true;
  return request.headers.get("Authorization") === `Bearer ${env.APP_API_TOKEN}`;
}

async function bodyJson(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("Content-Type") ?? "";
  if (!type.includes("application/json")) return {};
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : String(error);
  const configError = message.includes("NOT_CONFIGURED");
  return json({ ok: false, error: message, code: configError ? "NOT_CONFIGURED" : "INTERNAL_ERROR" }, configError ? 503 : 500);
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  if (path === "/") {
    return json({
      ok: true,
      service: "vm-cloud-api",
      version: API_VERSION,
      provider: env.VM_PROVIDER ?? "mock",
      security: env.APP_API_TOKEN ? "token" : "open-prototype"
    });
  }

  if (path === `${PREFIX}/health` && method === "GET") {
    return json({ ok: true, data: { status: "online", time: new Date().toISOString() } });
  }

  if (!path.startsWith(PREFIX)) return json({ ok: false, error: "ROUTE_NOT_FOUND", code: "NOT_FOUND" }, 404);
  if (!authorized(request, env)) return json({ ok: false, error: "ACCESS_DENIED", code: "UNAUTHORIZED" }, 401);

  try {
    const cloud = provider(env);

    if (path === `${PREFIX}/vm/status` && method === "GET") return json({ ok: true, data: await cloud.status() });
    if (path === `${PREFIX}/vm/start` && method === "POST") return json({ ok: true, data: await cloud.start() });
    if (path === `${PREFIX}/vm/stop` && method === "POST") return json({ ok: true, data: await cloud.stop() });
    if (path === `${PREFIX}/vm/restart` && method === "POST") return json({ ok: true, data: await cloud.restart() });

    if (path === `${PREFIX}/session/create` && method === "POST") {
      const now = Date.now();
      return json({
        ok: true,
        data: {
          sessionId: crypto.randomUUID(),
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
          vm: await cloud.status()
        }
      }, 201);
    }

    if (path === `${PREFIX}/game/status` && method === "GET") return json({ ok: true, data: await agentRequest(env, "/game/status") });
    if (path === `${PREFIX}/game/start` && method === "POST") return json({ ok: true, data: await agentRequest(env, "/game/start", "POST", await bodyJson(request)) });
    if (path === `${PREFIX}/game/stop` && method === "POST") return json({ ok: true, data: await agentRequest(env, "/game/stop", "POST", await bodyJson(request)) });

    if (path === `${PREFIX}/stream/status` && method === "GET") return json({ ok: true, data: await agentRequest(env, "/stream/status") });
    if (path === `${PREFIX}/stream/start` && method === "POST") return json({ ok: true, data: await agentRequest(env, "/stream/start", "POST", await bodyJson(request)) });
    if (path === `${PREFIX}/stream/stop` && method === "POST") return json({ ok: true, data: await agentRequest(env, "/stream/stop", "POST", await bodyJson(request)) });

    return json({ ok: false, error: "ROUTE_NOT_FOUND", code: "NOT_FOUND" }, 404);
  } catch (error) {
    return errorResponse(error);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return route(request, env);
  }
};
