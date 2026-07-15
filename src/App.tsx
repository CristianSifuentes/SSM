// ---------------------------------------------------------------------------
// APP SHELL.
//
// Note the providers: QueryClientProvider (React Query's cache) and SWRConfig
// (SWR's global options) wrap the WHOLE app — that's why caches survive tab
// switches even though each dashboard fully unmounts. The tab switcher is
// plain useState: "which tab is open" is CLIENT state, and this is the only
// client state the app needs.
// ---------------------------------------------------------------------------

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { SWRConfig } from 'swr';
import { NetworkPanel } from './components/NetworkPanel';
import { ToastProvider } from './components/Toast';
import { ManualDashboard } from './manual/ManualDashboard';
import { Comparison } from './pages/Comparison';
import { Overview } from './pages/Overview';
import { queryClient } from './react-query/queryClient';
import { RQDashboard } from './react-query/RQDashboard';
import { SWRDashboard } from './swr/SWRDashboard';

type Tab = 'overview' | 'manual' | 'react-query' | 'swr' | 'comparison';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: '📖 Overview' },
  { id: 'manual', label: '🩹 Manual fetching' },
  { id: 'react-query', label: '⚡ React Query' },
  { id: 'swr', label: '🌊 SWR' },
  { id: 'comparison', label: '⚖️ RQ vs SWR' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <QueryClientProvider client={queryClient}>
      <SWRConfig
        value={{
          // SWR global options (mirroring the React Query defaults where
          // an equivalent exists, so the comparison is fair):
          revalidateOnFocus: true, // refetch on window focus
          revalidateOnReconnect: true, // refetch when network returns
          dedupingInterval: 2000, // collapse identical requests within 2s
        }}
      >
        <ToastProvider>
          <div className="app">
            <header className="app-header">
              <h1>Server State Management Lab</h1>
              <p className="subtitle">
                One dashboard, three implementations: manual fetching vs React Query vs SWR.
                Same mock API, same latency, same failures — watch the network panel keep score.
              </p>
              <nav className="tabs">
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`tab ${tab === id ? 'tab-active' : ''}`}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </header>

            <main className="app-main">
              {tab === 'overview' && <Overview />}
              {/* Each dashboard fully unmounts on tab switch — that's the
                  point: manual state dies with its components, the library
                  caches don't. */}
              {tab === 'manual' && <ManualDashboard />}
              {tab === 'react-query' && <RQDashboard />}
              {tab === 'swr' && <SWRDashboard />}
              {tab === 'comparison' && <Comparison />}
            </main>

            <NetworkPanel />
          </div>
        </ToastProvider>
      </SWRConfig>
      {/* Official React Query DevTools — the floating flower, bottom-right. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
