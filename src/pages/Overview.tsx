// The conceptual foundation: client state vs server state, the "do you still
// need Redux?" inventory, how to use the lab, and self-check questions.

import { Section } from '../components/Section';

export function Overview() {
  return (
    <div className="dashboard">
      <Section
        title="Client state vs server state — the distinction that changes everything"
        lesson={
          <>
            Most “state management pain” in React apps is <b>server state handled badly</b>. Once
            server state gets a proper tool, very little global client state remains.
          </>
        }
      >
        <div className="two-col">
          <div>
            <h4>🖥️ Client state (UI state)</h4>
            <ul>
              <li>You own it — it lives only in the browser</li>
              <li>Synchronous, always up to date</li>
              <li>Examples: theme, open modal, form input, selected filter</li>
              <li>Right tools: <code>useState</code>, <code>useReducer</code>, Context, Zustand</li>
            </ul>
          </div>
          <div>
            <h4>☁️ Server state (remote data)</h4>
            <ul>
              <li>You <b>don't</b> own it — the server does; your copy is a <i>cache</i></li>
              <li>Asynchronous, can be stale or wrong the moment it arrives</li>
              <li>Shared: others can change it behind your back</li>
              <li>Needs: caching, revalidation, dedup, retries, invalidation</li>
              <li>Right tools: <b>React Query</b>, <b>SWR</b> (also RTK Query, Apollo)</li>
            </ul>
          </div>
        </div>
        <p>
          Treating server state like client state (<code>useEffect</code> →{' '}
          <code>setState</code>, or dispatching fetch results into Redux) forces you to hand-build
          caching, dedup, staleness, retries and race protection — or, more commonly, to not build
          them and ship the bugs. The <b>Manual</b> tab shows those bugs live.
        </p>
      </Section>

      <Section
        title="How to use this lab"
        lesson={<>The network panel at the bottom is the scoreboard — reset it between tabs.</>}
      >
        <ol className="steps">
          <li>Open the <b>Manual</b> tab. Interact with every demo. Watch the request counter climb and the bugs appear (race in search, lying UI after delete, spinner on every visit).</li>
          <li>Press <b>Reset counters</b>, repeat the <i>same actions</i> in the <b>React Query</b> tab. Compare counts. Open the Cache Visualizer and the floating DevTools.</li>
          <li>Reset again and repeat in the <b>SWR</b> tab. Notice the smaller API doing the same job.</li>
          <li>Switch browser tabs and come back (focus refetch); create tasks with “make the server reject it” (optimistic rollback); crank up latency/failure sliders and see how each version copes.</li>
        </ol>
      </Section>

      <Section
        title="Do you still need Redux? A realistic state inventory"
        lesson={
          <>
            After moving server state into React Query/SWR, what's left is a handful of booleans
            and strings — <code>useState</code>/Context territory. Reach for Redux/Zustand only for
            genuinely complex <i>client</i> state (collaborative editors, canvas apps, undo/redo).
          </>
        }
      >
        <table className="inventory">
          <thead>
            <tr>
              <th>State in a typical app</th>
              <th>Kind</th>
              <th>Where it belongs</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Current user / session</td><td>server</td><td>React Query / SWR</td></tr>
            <tr><td>Task list, project list</td><td>server</td><td>React Query / SWR</td></tr>
            <tr><td>Notifications</td><td>server</td><td>React Query / SWR (polling or push)</td></tr>
            <tr><td>Search results</td><td>server</td><td>React Query / SWR</td></tr>
            <tr><td>Activity feed</td><td>server</td><td>useInfiniteQuery / useSWRInfinite</td></tr>
            <tr><td>Theme (light/dark)</td><td>client</td><td>useState + Context (+ localStorage)</td></tr>
            <tr><td>Sidebar open/closed</td><td>client</td><td>useState</td></tr>
            <tr><td>Selected filters / sort order</td><td>client</td><td>useState or the URL</td></tr>
            <tr><td>Form draft being typed</td><td>client</td><td>useState / form library</td></tr>
            <tr><td>Modal visibility</td><td>client</td><td>useState</td></tr>
          </tbody>
        </table>
        <p>
          Score: <b>5 of 10 “global state” entries were server state in disguise.</b> The classic
          Redux app stored all five in the store, with hand-written thunks re-implementing (badly)
          what React Query ships tested: caching, dedup, invalidation, retries. This very app has{' '}
          <b>zero</b> global client-state library — its only client state is “which tab is open”
          (<code>useState</code> in App.tsx) and toasts (a tiny Context).
        </p>
      </Section>

      <Section
        title="Self-check questions"
        lesson={<>Click each question to reveal the answer. If you can answer all 8, you've got it.</>}
      >
        <details>
          <summary>1. Why is server state fundamentally different from client state?</summary>
          <p>
            You don't own it: it lives on the server, is shared with other users/tabs, and changes
            without telling you. Your in-browser copy is therefore a <b>cache</b> that can be stale
            the moment it arrives — so it needs cache concerns (freshness, revalidation,
            invalidation, dedup), which <code>useState</code> has no answers for.
          </p>
        </details>
        <details>
          <summary>2. What exactly does <code>staleTime</code> control, and how is it different from <code>gcTime</code>?</summary>
          <p>
            <code>staleTime</code> = how long data counts as <b>fresh</b>; fresh data is served
            from cache with no request, stale data is served instantly too but triggers a
            background refetch on the next trigger (mount/focus/reconnect).{' '}
            <code>gcTime</code> = how long <b>inactive</b> data (zero mounted observers) stays in
            memory before eviction. Freshness vs memory — independent dials.
          </p>
        </details>
        <details>
          <summary>3. Why does putting the search string inside the query key eliminate the race condition?</summary>
          <p>
            Each key gets its own cache entry, and the component renders only the entry for the{' '}
            <b>current</b> key. A slow response for an old query is written into the old key's
            entry — it can never overwrite what's on screen. With manual fetching, whichever{' '}
            <code>setState</code> runs <i>last</i> wins, regardless of order.
          </p>
        </details>
        <details>
          <summary>4. Walk through onMutate / onError / onSettled for an optimistic create.</summary>
          <p>
            <code>onMutate</code> (before the request): cancel in-flight fetches for the key,
            snapshot the current cache, write the optimistic value, return the snapshot as context.{' '}
            <code>onError</code>: restore the snapshot from context (rollback) and notify the user.{' '}
            <code>onSettled</code> (success or error): <code>invalidateQueries</code> so the cache
            re-syncs with server truth either way.
          </p>
        </details>
        <details>
          <summary>5. What happens when you call <code>invalidateQueries({'{'} queryKey: ['tasks'] {'}'})</code>?</summary>
          <p>
            Every query whose key <i>starts with</i> <code>['tasks']</code> (board, pages,
            searches — that's why hierarchical keys matter) is marked stale. Queries with mounted
            observers refetch immediately; inactive ones refetch when next used. It does NOT delete
            data — the stale copy keeps rendering until fresh data lands.
          </p>
        </details>
        <details>
          <summary>6. When you leave a list and come back, why does React Query/SWR show data instantly while the manual version shows a spinner?</summary>
          <p>
            The cache outlives the component. On remount the hook synchronously returns the cached
            (possibly stale) data and revalidates in the background — stale-while-revalidate. The
            manual version stored data in component <code>useState</code>, which died on unmount,
            so it must start from nothing.
          </p>
        </details>
        <details>
          <summary>7. Two mounted components use the same query key. How many requests fire, and why?</summary>
          <p>
            One (assuming they mount within the dedup window / while data is fresh). Both observers
            share a single cache entry and a single in-flight promise. With manual fetching, each
            component's <code>useEffect</code> fires its own request — n components, n requests.
          </p>
        </details>
        <details>
          <summary>8. What are the biggest pitfalls when adopting React Query?</summary>
          <p>
            (a) <b>Inconsistent query keys</b> — same data under two spellings = two cache entries
            that drift; use a key factory. (b) <b>Over-invalidation</b> — invalidating{' '}
            <code>['tasks']</code> when only one page changed causes refetch storms; scope keys.
            (c) <b>Using the query cache as a client-state store</b> — it's a server cache, not
            Redux; don't <code>setQueryData</code> things that never came from a server.
            (d) Forgetting <code>cancelQueries</code> in <code>onMutate</code>, letting an
            in-flight response clobber the optimistic value.
          </p>
        </details>
      </Section>
    </div>
  );
}
