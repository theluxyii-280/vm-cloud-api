import type { Env } from "../types";

export async function agentRequest(env: Env, path: string, method = "GET", body?: unknown): Promise<unknown> {
  if (!env.VM_AGENT_URL) throw new Error("VM_AGENT_URL_NOT_CONFIGURED");

  const base = env.VM_AGENT_URL.replace(/\/$/, "");
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (env.VM_AGENT_TOKEN) headers.set("Authorization", `Bearer ${env.VM_AGENT_TOKEN}`);

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!response.ok) throw new Error(`VM_AGENT_${response.status}:${text.slice(0, 300)}`);
  return data;
}
