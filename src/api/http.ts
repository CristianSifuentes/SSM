// ---------------------------------------------------------------------------
// THE FAKE NETWORK LAYER.
//
// Every "HTTP request" in this lab goes through `simulateHttp()`, which:
//   1. Logs the request (tagged with which implementation fired it) to an
//      observable log — this powers the live Network Panel, so you can see
//      exactly how many requests Manual vs React Query vs SWR fire for the
//      SAME user actions.
//   2. Waits for configurable artificial latency (so loading states,
//      races, and stale-while-revalidate are actually visible).
//   3. Randomly fails based on a configurable failure rate (so you can
//      watch retry behavior and optimistic-update rollback).
// ---------------------------------------------------------------------------

import type { Source } from './types';

export interface RequestLogEntry {
  id: number;
  source: Source;
  method: string;
  path: string;
  status: 'pending' | 'success' | 'error';
  startedAt: number;
  durationMs?: number;
}

/** Global knobs, adjustable live from the Network Panel UI. */
export const networkConfig = {
  latencyMs: 700,
  /** 0..1 — applies to every route except /flaky (which is always 0.5). */
  failureRate: 0,
};

let nextRequestId = 1;
let entries: RequestLogEntry[] = [];
// Immutable snapshot for useSyncExternalStore — replaced on every change so
// React can detect updates by reference.
let snapshot: RequestLogEntry[] = entries;
const listeners = new Set<() => void>();

function emit() {
  snapshot = [...entries];
  listeners.forEach((l) => l());
}

export function subscribeToNetwork(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNetworkSnapshot(): RequestLogEntry[] {
  return snapshot;
}

export function resetNetworkLog() {
  entries = [];
  emit();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SimulateOptions {
  /** Override the global latency (the search route uses this to create
   *  out-of-order responses for the race-condition demo). */
  latencyMs?: number;
  /** Override the global failure rate (the /flaky route is always 0.5). */
  failureRate?: number;
}

/**
 * Simulate an HTTP round trip: log it, wait, maybe fail, return a deep copy
 * of the handler result (a real server would serialize to JSON — cloning
 * prevents accidental shared references with the in-memory DB).
 */
export async function simulateHttp<T>(
  source: Source,
  method: string,
  path: string,
  handler: () => T,
  options: SimulateOptions = {}
): Promise<T> {
  const entry: RequestLogEntry = {
    id: nextRequestId++,
    source,
    method,
    path,
    status: 'pending',
    startedAt: Date.now(),
  };
  entries = [...entries, entry].slice(-200); // keep the log bounded
  emit();

  const latency =
    options.latencyMs ?? networkConfig.latencyMs + Math.random() * 200;
  await sleep(latency);

  const failureRate = options.failureRate ?? networkConfig.failureRate;
  const failed = Math.random() < failureRate;

  entries = entries.map((e) =>
    e.id === entry.id
      ? { ...e, status: failed ? ('error' as const) : ('success' as const), durationMs: Date.now() - entry.startedAt }
      : e
  );
  emit();

  if (failed) {
    throw new Error(`500 Internal Server Error — ${method} ${path}`);
  }
  return structuredClone(handler());
}
