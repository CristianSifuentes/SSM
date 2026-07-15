// React Query vs SWR — feature comparison and decision guide.

import { Section } from '../components/Section';

export function Comparison() {
  return (
    <div className="dashboard">
      <Section
        title="React Query vs SWR — side by side"
        lesson={
          <>
            Both solve the same core problem (server state as a cache with
            stale-while-revalidate). React Query is the full toolbox; SWR is the sharp knife.
          </>
        }
      >
        <div className="table-scroll">
          <table className="compare">
            <thead>
              <tr>
                <th></th>
                <th>React Query (TanStack Query v5)</th>
                <th>SWR 2.x</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bundle size (min+gzip, approx.)</td>
                <td>~12–13 kB</td>
                <td>~4–5 kB</td>
              </tr>
              <tr>
                <td>Query keys</td>
                <td>Arrays, hierarchical — enables prefix-based invalidation</td>
                <td>Usually strings (any serializable value works); no hierarchy</td>
              </tr>
              <tr>
                <td>Reads</td>
                <td><code>useQuery</code>, <code>useQueries</code>, <code>useSuspenseQuery</code></td>
                <td><code>useSWR</code> (+ <code>useSWRSubscription</code>)</td>
              </tr>
              <tr>
                <td>Writes / mutations</td>
                <td><code>useMutation</code> with onMutate/onError/onSettled lifecycle</td>
                <td>No mutation hook — <code>mutate(promise, options)</code> (SWR 2 added <code>useSWRMutation</code>)</td>
              </tr>
              <tr>
                <td>Optimistic updates</td>
                <td>Manual snapshot/rollback in callbacks (full control)</td>
                <td>Declarative: <code>optimisticData</code> + <code>rollbackOnError</code></td>
              </tr>
              <tr>
                <td>Invalidation</td>
                <td><code>invalidateQueries</code> with key prefixes/predicates</td>
                <td><code>mutate(key)</code> or <code>mutate(filterFn)</code></td>
              </tr>
              <tr>
                <td>Infinite queries</td>
                <td><code>useInfiniteQuery</code>: <code>fetchNextPage</code>/<code>hasNextPage</code> built in</td>
                <td><code>useSWRInfinite</code>: key function + <code>setSize</code>, derive the rest</td>
              </tr>
              <tr>
                <td>Pagination UX</td>
                <td><code>placeholderData: keepPreviousData</code></td>
                <td><code>keepPreviousData: true</code></td>
              </tr>
              <tr>
                <td>Retries</td>
                <td>Configurable <code>retry</code> + <code>retryDelay</code> function</td>
                <td>On by default, exponential backoff, less granular</td>
              </tr>
              <tr>
                <td>Cache lifecycle</td>
                <td><code>staleTime</code> + <code>gcTime</code> (garbage collection)</td>
                <td><code>dedupingInterval</code>; no GC — cache lives until reload</td>
              </tr>
              <tr>
                <td>DevTools</td>
                <td>Official, excellent (try them in the React Query tab!)</td>
                <td>None official (community options)</td>
              </tr>
              <tr>
                <td>Extras</td>
                <td>Offline/persist plugins, select transforms, prefetching, framework-agnostic core (Vue/Solid/Svelte/Angular)</td>
                <td>Tiny, React-only, made by Vercel — pairs naturally with Next.js</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Decision guide"
        lesson={<>Either beats manual fetching by a mile. Choosing “wrong” costs little; not choosing costs a lot.</>}
      >
        <div className="two-col">
          <div>
            <h4>Choose React Query when…</h4>
            <ul>
              <li>Mutations are central (optimistic updates everywhere, complex invalidation)</li>
              <li>You want DevTools for debugging cache behavior</li>
              <li>You need fine-grained cache control (per-query staleTime/gcTime, select, prefetch)</li>
              <li>Offline support / request cancellation / paused mutations matter</li>
              <li>The team is large — conventions (key factories) scale well</li>
            </ul>
          </div>
          <div>
            <h4>Choose SWR when…</h4>
            <ul>
              <li>Your app is read-heavy with few writes</li>
              <li>Bundle size is a hard constraint (~⅓ the size)</li>
              <li>You want the smallest possible API to teach a team</li>
              <li>You're on Next.js/Vercel and like the ecosystem fit</li>
              <li>Default behaviors (focus revalidation, retry) are all you need</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section
        title="What both replace"
        lesson={<>The biggest win isn't either library — it's deleting the hand-rolled version.</>}
      >
        <ul>
          <li>❌ The <code>data / loading / error</code> useState triplet in every component</li>
          <li>❌ <code>useEffect</code> fetch effects with cleanup/race guards you must never forget</li>
          <li>❌ “Remember to refetch after mutating” scattered across the codebase</li>
          <li>❌ Redux stores whose only job is passing fetched data around</li>
          <li>❌ Hand-written retry loops, dedup maps, and cache objects</li>
        </ul>
      </Section>
    </div>
  );
}
