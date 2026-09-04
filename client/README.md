# TakeUForward — Frontend Client (`/client`)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Oxlint](https://img.shields.io/badge/Oxlint-Zero%20Warnings-success?style=flat-square)](https://oxc.rs/)
[![Architect](https://img.shields.io/badge/Architect-Tushyent-E3A44E?style=flat-square)](https://tushyent-portfolio.vercel.app/)

> The client application is a high-performance Single Page Application (SPA) and Progressive Web App (PWA) built with **React 18** and bundled with **Vite**, engineered with a custom editorial design system in Vanilla CSS.

---

## 🎨 Design System & Styling Architecture

Rather than incurring runtime CSS-in-JS overhead or heavy Tailwind utility bloat, TakeUForward employs a clean **Vanilla CSS Design Token Architecture** (`src/index.css`):
* **Theme Switching**: Controlled at runtime via the `data-theme` attribute on `document.documentElement` (`dark` or `light`), with an inline `<head>` script to eliminate flash-of-unstyled-content (FOUC).
* **Color Palette**:
  * **Dark Theme**: Deep obsidian base (`#0A0A08`), dedicated sidebar plane (`#0F0E0B`), warm surface controls (`#161510`), elevated cards (`#1E1D16`), and warm ivory typography (`#EDE8DE`).
  * **Light Theme**: Warm linen canvas (`#F4F0E8`), parchment sidebar (`#ECE5D6`), crisp white elevated cards (`#FFFFFF`), and deep espresso typography (`#18140E`).
  * **Brand Primary**: Golden amber (`#E3A44E`) in dark mode; rich amber bronze (`#965B16`) in light mode (exceeding WCAG AA 4.5:1 contrast standards).
  * **Accents**: Eucalyptus sage (`#7FB0A3` / `#2A6F60`) for success states and terracotta coral (`#E16B55` / `#B83E26`) for danger states.
* **Component Library**: Modular, accessible UI primitives under `src/components/ui/` (`Card`, `Badge`, `Button`, `Input`, `Modal`, `EmptyState`, `Spinner`, `FilePreview`).

---

## 📁 Directory Structure

```
client/
├── public/
│   ├── favicon.svg             # Clean vector brand glyph
│   ├── manifest.json           # PWA web app manifest
│   ├── llms.txt & llms-full.txt# AI agent & LLM search crawler documentation
│   ├── robots.txt              # Search crawler directives
│   └── sitemap.xml             # Canonical route index
├── src/
│   ├── api/
│   │   └── axiosClient.js      # Axios instance with CSRF token interceptor
│   ├── components/
│   │   ├── ui/                 # Core primitive components (Card, Badge, Button, Input, Modal)
│   │   ├── AppLayout.jsx       # Main layout wrapper with sidebar and mobile header
│   │   ├── Navbar.jsx          # Desktop navigation bar
│   │   ├── Sidebar.jsx         # Indented sidebar with floating pill active states
│   │   ├── SEOManager.jsx      # Dynamic meta tags & JSON-LD breadcrumb injector
│   │   └── ThemeToggle.jsx     # Dark/Light mode switcher
│   ├── constants/
│   │   └── navigation.js       # Navigation links partitioned by category
│   ├── context/
│   │   ├── AuthContext.jsx     # Current user, login/logout, alumni status state
│   │   └── ThemeContext.jsx    # Dark/Light theme state and persistent localStorage sync
│   ├── hooks/
│   │   ├── useDebounce.js      # Debounced inputs for search queries
│   │   ├── useMentionSearch.js # @user tagging search autocomplete
│   │   └── useSEO.js           # Head title, meta description, and canonical link updater
│   ├── pages/                  # 30+ lazy-loaded route views (including /tech)
│   ├── sw.js                   # Service Worker script for offline asset caching
│   ├── index.css               # Design tokens, reset, utility classes, and typography
│   └── main.jsx                # Application root mounting and Service Worker registration
├── package.json
└── vite.config.js              # Vite configuration, proxying, and PWA plugin
```

---

## ⚡ Key Technical Features

### 1. Code Splitting & Performance
All route components are imported via `React.lazy()` and rendered inside a top-level `<Suspense>` boundary in `App.jsx`. Vite bundles individual routes into isolated JS chunks, resulting in a production build that executes in under **600ms**.

### 2. Dynamic SEO & Structured Data (`SEOManager.jsx`)
Route transitions automatically update document titles, OpenGraph metadata, meta descriptions, and inject Schema.org JSON-LD BreadcrumbList schemas without requiring an external SSR server.

### 3. Comprehensive Technical Reference (`/tech`)
A dedicated documentation page ([`/tech`](https://takeuforward.blastorz.fun/tech)) built into the client provides a complete breakdown of system design patterns, cloud topology, and 12 technical interview questions and answers.

---

## 🛠️ Development & Build Commands

```bash
# Start Vite development server (HMR on port 5173)
npm run dev

# Run Oxlint static analysis (zero warnings enforced)
npm run lint

# Build production bundle & PWA service worker
npm run build

# Preview production build locally
npm run preview
```

---

<div align="center">
  <sub>Engineered with ❤️ by <a href="https://tushyent-portfolio.vercel.app/">Tushyent</a></sub>
</div>
