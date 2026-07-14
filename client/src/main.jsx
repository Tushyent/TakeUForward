import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// StrictMode intentionally removed: it fires every useEffect twice in dev,
// doubling all API requests and causing spurious 429 errors under normal usage.
// Re-enable only for targeted debugging of side-effect issues.
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

// Handle PWA auto-updates seamlessly by forcing a reload when a new service worker takes over.
// This ensures users always see the latest UI without needing a manual hard refresh.
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
