export interface Env {
  VM_PROVIDER?: "mock" | "runpod";
  APP_API_TOKEN?: string;
  RUNPOD_API_KEY?: string;
  RUNPOD_POD_ID?: string;
  VM_AGENT_URL?: string;
  VM_AGENT_TOKEN?: string;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface VmStatus {
  provider: string;
  id: string | null;
  status: string;
  gpu?: string | null;
  vcpu?: number | null;
  memoryGb?: number | null;
  volumeGb?: number | null;
  costPerHour?: number | string | null;
  raw?: unknown;
}

export interface CloudProvider {
  status(): Promise<VmStatus>;
  start(): Promise<VmStatus>;
  stop(): Promise<VmStatus>;
  restart(): Promise<VmStatus>;
}
