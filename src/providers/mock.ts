import type { CloudProvider, VmStatus } from "../types";

let state: VmStatus = {
  provider: "mock",
  id: "mock-vm",
  status: "STOPPED",
  gpu: "Mock GPU",
  vcpu: 4,
  memoryGb: 16,
  volumeGb: 50,
  costPerHour: 0
};

export class MockProvider implements CloudProvider {
  async status(): Promise<VmStatus> {
    return state;
  }

  async start(): Promise<VmStatus> {
    state = { ...state, status: "RUNNING" };
    return state;
  }

  async stop(): Promise<VmStatus> {
    state = { ...state, status: "STOPPED" };
    return state;
  }

  async restart(): Promise<VmStatus> {
    state = { ...state, status: "RUNNING" };
    return state;
  }
}
