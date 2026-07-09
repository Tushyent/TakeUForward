import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode intentionally removed: it fires every useEffect twice in dev,
// doubling all API requests and causing spurious 429 errors under normal usage.
// Re-enable only for targeted debugging of side-effect issues.
createRoot(document.getElementById('root')).render(
  <App />
)


