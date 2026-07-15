// ---------------------------------------------------------------------------
// LIVE NETWORK COMPARISON PANEL (always visible at the bottom).
//
// Every simulated HTTP request is tagged with the implementation that fired
// it. Do the same actions in the Manual, React Query and SWR tabs and compare
// the counters: manual fetching fires duplicate and redundant requests, the
// libraries deduplicate and reuse cache.
// ---------------------------------------------------------------------------

import { useState, useSyncExternalStore } from 'react';
import {
  getNetworkSnapshot,
  networkConfig,
  resetNetworkLog,
  subscribeToNetwork,
} from '../api/http';
import type { RequestLogEntry } from '../api/http';
import type { Source } from '../api/types';

const SOURCES: { key: Source; label: string; className: string }[] = [
  { key: 'manual', label: 'Manual', className: 'src-manual' },
  { key: 'react-query', label: 'React Query', className: 'src-rq' },
  { key: 'swr', label: 'SWR', className: 'src-swr' },
];

export function NetworkPanel() {
  const log = useSyncExternalStore(subscribeToNetwork, getNetworkSnapshot);
  const [open, setOpen] = useState(true);
  // Local mirror of the mutable networkConfig so sliders re-render.
  const [latency, setLatency] = useState(networkConfig.latencyMs);
  const [failureRate, setFailureRate] = useState(networkConfig.failureRate);

  const counts = (source: Source) => log.filter((e) => e.source === source).length;
  const inFlight = log.filter((e) => e.status === 'pending').length;
  const recent = log.slice(-9).reverse();

  return (
    <div className={`network-panel ${open ? '' : 'network-panel-closed'}`}>
      <div className="network-header" onClick={() => setOpen((o) => !o)}>
        <strong>📡 Network monitor</strong>
        <span className="network-counters">
          {SOURCES.map(({ key, label, className }) => (
            <span key={key} className={`net-count ${className}`}>
              {label}: <b>{counts(key)}</b>
            </span>
          ))}
          {inFlight > 0 && <span className="net-inflight">{inFlight} in flight…</span>}
        </span>
        <span className="network-toggle">{open ? '▼ hide' : '▲ show'}</span>
      </div>

      {open && (
        <div className="network-body">
          <div className="network-controls">
            <label>
              Latency: {latency}ms
              <input
                type="range"
                min={100}
                max={2500}
                step={100}
                value={latency}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLatency(v);
                  networkConfig.latencyMs = v;
                }}
              />
            </label>
            <label>
              Failure rate: {Math.round(failureRate * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={failureRate * 100}
                onChange={(e) => {
                  const v = Number(e.target.value) / 100;
                  setFailureRate(v);
                  networkConfig.failureRate = v;
                }}
              />
            </label>
            <button onClick={resetNetworkLog}>Reset counters</button>
          </div>
          <ul className="network-log">
            {recent.length === 0 && <li className="muted">No requests yet — interact with a tab above.</li>}
            {recent.map((entry) => (
              <NetworkRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NetworkRow({ entry }: { entry: RequestLogEntry }) {
  const source = SOURCES.find((s) => s.key === entry.source)!;
  return (
    <li className={`net-row net-${entry.status}`}>
      <span className={`net-badge ${source.className}`}>{source.label}</span>
      <code>
        {entry.method} {entry.path}
      </code>
      <span className="net-status">
        {entry.status === 'pending' ? '⏳' : entry.status === 'error' ? `💥 500 (${entry.durationMs}ms)` : `✓ 200 (${entry.durationMs}ms)`}
      </span>
    </li>
  );
}
