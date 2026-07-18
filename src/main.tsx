import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// NOTE: deliberately NOT wrapped in <React.StrictMode>. StrictMode
// double-invokes effects in development, which would double every request
// the MANUAL implementation fires and muddy the request-count comparison
// that this lab is built around. (React Query and SWR are StrictMode-safe —
// their dedup absorbs the double mount, which is itself a good argument for
// them.)
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
