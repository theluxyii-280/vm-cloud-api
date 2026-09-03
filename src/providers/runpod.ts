import type { CloudProvider, Env, VmStatus } from "../types";

interface RunPodPod {
  id?: string;
  desiredStatus?: string;
  costPerHr?: string | number;
  adjustedCostPerHr?: number;
  vcpuCount?: number;
  memoryInGb?: number;
  volumeInGb?: number;
  gpu?: {
    displayName?: string;
  };
}

export class RunPodProvider implements CloudProvider {
  private readonly base = "https://rest.runpod.io/v1";
  private readonly key: string;
  private readonly podId: string;

  constructor(env: Env) {
    if (!env.RUNPOD_API_KEY) throw new Error("RUNPOD_API_KEY_NOT_CONFIGURED");
    if (!env.RUNPOD_POD_ID) throw new Error("RUNPOD_POD_ID_NOT_CONFIGURED");
    this.key = env.RUNPOD_API_KEY;
    this.podId = env.RUNPOD_POD_ID;
  }

  private async request(path: string, method = "GET"): Promise<RunPodPod> {
    const response = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.key}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`RUNPOD_${response.status}:${body.slice(0, 300)}`);
    }

    if (response.status === 204) return {};
    return await response.json() as RunPodPod;
  }

  private normalize(pod: RunPodPod): VmStatus {
    return {
      provider: "runpod",
      id: pod.id ?? this.podId,
      status: pod.desiredStatus ?? "UNKNOWN",
      gpu: pod.gpu?.displayName ?? null,
      vcpu: pod.vcpuCount ?? null,
      memoryGb: pod.memoryInGb ?? null,
      volumeGb: pod.volumeInGb ?? null,
      costPerHour: pod.adjustedCostPerHr ?? pod.costPerHr ?? null
    };
  }

  async status(): Promise<VmStatus> {
    return this.normalize(await this.request(`/pods/${encodeURIComponent(this.podId)}`));
  }

  async start(): Promise<VmStatus> {
    await this.request(`/pods/${encodeURIComponent(this.podId)}/start`, "POST");
    return this.status();
  }

  async stop(): Promise<VmStatus> {
    await this.request(`/pods/${encodeURIComponent(this.podId)}/stop`, "POST");
    return this.status();
  }

  async restart(): Promise<VmStatus> {
    await this.request(`/pods/${encodeURIComponent(this.podId)}/restart`, "POST");
    return this.status();
  }
}
