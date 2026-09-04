import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, Database, Cpu, Layers, GitBranch, Terminal, 
  HelpCircle, ChevronDown, ChevronRight, ArrowLeft, ExternalLink, 
  FileCode, Network, HardDrive, RefreshCw
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ThemeToggle from '../components/ThemeToggle';
import { useSEO } from '../hooks/useSEO';

const INTERVIEW_QUESTIONS = [
  {
    id: 'anonymity',
    q: 'How did you design the server-side anonymity engine, and why is client-side filtering insufficient?',
    category: 'Security & Data Privacy',
    a: `**The Problem**: In a campus community discussing sensitive topics (placement feedback, professor reviews, mental health, complaints), students require absolute anonymity. If anonymity is implemented merely by hiding the author's name in React, the raw payload over the network (\`authorId\`, \`email\`, \`name\`) can still be inspected via browser DevTools.

**The Architectural Solution**:
1. **Controller-Level Redaction**: When \`isAnonymous: true\`, the server-side controller explicitly strips \`authorId\`, \`author\`, and identifying email fields from the MongoDB document *before* the JSON payload is serialized and dispatched over HTTP.
2. **Automated Regression Testing**: We enforced non-negotiable Jest unit tests (\`anonymity.test.js\`) ensuring that even if a database query hydrates author associations, the response serializer strictly sanitizes the fields.
3. **Database Audit Decoupling**: While moderation requires administrative abuse reporting, standard queries completely eliminate the identity pointer from public read pipelines.`
  },
  {
    id: 'auth-session-vs-jwt',
    q: 'Why did you choose session-based cookies (Passport.js) over JWT in LocalStorage for authentication?',
    category: 'Authentication & State',
    a: `**Security Tradeoff**:
* **JWT in LocalStorage**: Susceptible to Cross-Site Scripting (XSS). If any malicious script or compromised npm package executes, it can read \`window.localStorage\` and exfiltrate credentials. Furthermore, stateless JWTs cannot be revoked instantly if a student's account is suspended.
* **HttpOnly Session Cookies**: Inaccessible via JavaScript (\`document.cookie\`), mitigating token exfiltration attacks. Session records live in MongoDB Atlas (\`connect-mongo\`), allowing platform administrators to instantly revoke sessions, force re-authentication, or enforce institutional domain boundaries (\`@ssn.edu.in\`).

**Production Consideration**: Requires \`trust proxy\` configuration and \`SameSite=Lax/None\` + \`Secure\` cookie attributes when backend and frontend are hosted on separate subdomains.`
  },
  {
    id: 'realtime-polling-vs-sockets',
    q: 'Why use polling for Phase 1 messaging instead of WebSockets (Socket.io)?',
    category: 'System Scalability',
    a: `**Engineering Tradeoff**:
1. **Deployment Architecture**: In Phase 1, our Node.js server is deployed on cloud container platforms (like Render/Serverless) where persistent, long-lived WebSocket connections can incur idle connection limits, reconnection storms, and scaling complexities across multiple worker nodes without Redis Pub/Sub.
2. **Traffic Pattern**: Campus private messages and notification updates are asynchronous and bursty rather than high-frequency gaming exchanges.
3. **Bandwidth Optimization**: We implemented conditional HTTP polling (60s interval) that only transfers payloads when state changes, halving background requests.
4. **Clean Migration Path**: Socket.io is formally documented as Phase 2, which will introduce an Redis adapter once concurrent active user volumes warrant persistent full-duplex socket clusters.`
  },
  {
    id: 's3-presigned-urls',
    q: 'How do you handle file uploads securely without saturating Node.js server bandwidth?',
    category: 'Cloud Architecture & I/O',
    a: `**The Bottleneck**: Streaming large files (PDFs, images, assignments) through an Express backend consumes server RAM, blocks event loop buffers, and increases CPU utilization, easily causing Denial of Service under concurrent student uploads.

**The Solution**:
1. The client requests a presigned S3 upload URL from Express (\`GET /api/drive/upload-url\`).
2. The server verifies authentication, enforces mime-type whitelisting, and computes a cryptographically signed AWS S3 \`PutObject\` presigned URL with an expiry window (e.g. 5 minutes).
3. The client uploads the binary blob directly from the browser to the AWS S3 / Supabase storage bucket via \`PUT\`.
4. Once completed, the client registers the file metadata in MongoDB. The backend never buffers the file binary.`
  },
  {
    id: 'rate-limiting-redos',
    q: 'How does the platform protect against ReDoS (Regular Expression Denial of Service) and brute-force abuse?',
    category: 'Defensive Engineering',
    a: `**Defensive Measures**:
1. **Search Sanitization (\`sanitizeQuery.js\`)**: When users search clubs, electives, or marketplace items, queries passed to MongoDB \`$regex\` are sanitized to escape catastrophic backtracking sequences (e.g. \`(a+)+$\`) that freeze MongoDB CPU threads.
2. **Token-Bucket Rate Limiting (\`rateLimiter.js\`)**: Express middleware enforces IP and route-specific rate limiting (e.g., stricter limits on auth, password resets, and ticket creations) with standardized \`Retry-After\` headers.
3. **Payload Clamping**: JSON body limits capped at 100KB to reject payload flooding attacks.`
  },
  {
    id: 'database-indexing',
    q: 'What indexing strategies are used in MongoDB Atlas to ensure sub-100ms queries as collections grow?',
    category: 'Database Optimization',
    a: `**Indexing Patterns**:
1. **Compound Indexes**: In \`Post\` collection: \`{ communityId: 1, createdAt: -1 }\` and \`{ category: 1, createdAt: -1 }\` allow compound equality-sort operations without in-memory sorting.
2. **Sparse Indexes**: In \`User\` model: \`{ googleId: 1 }\` and \`{ email: 1 }\` with unique constraints.
3. **Text Search Indexing**: Full-text compound indexes on \`{ title: "text", description: "text" }\` in academic resources and marketplace items for fast multi-token relevance search without third-party search cluster costs.
4. **Projection Whitelisting**: Strict \`.select("-passwordHash -__v")\` avoids transferring unnecessary schema fields across the network.`
  },
  {
    id: 'design-patterns',
    q: 'What software design patterns are implemented in this repository?',
    category: 'Design Patterns',
    a: `1. **Chain of Responsibility (Middleware)**: Every Express request traverses a pipeline: \`Security Headers (Helmet) → Rate Limiter → Session Deserializer → Sanitizer → Role Gate (requireApprovedUser) → Route Controller\`.
2. **Strategy Pattern**: Authentication strategies modularized via Passport.js (Google OAuth 2.0 vs Admin credentials); Dynamic notification channels (Web Push vs SendGrid Email).
3. **Factory Pattern**: Centralized Axios client factory (\`axiosClient.js\`) with automatic CSRF token injection and global 401 interceptor redirect handlers.
4. **Observer / PubSub Pattern**: Event-driven notification dispatchers that alert users when peers reply to comments, tag mentions, or accept mock interview requests.
5. **Custom Hook Composition**: Decoupled UI logic into reusable headless hooks (\`useSEO\`, \`useDebounce\`, \`useMentionSearch\`).`
  },
  {
    id: 'scaling-10k-to-500k',
    q: 'How would you scale this architecture from 10,000 to 500,000 concurrent users?',
    category: 'System Design & Scalability',
    a: `1. **Stateless Horizontal Scaling**: Decouple Express instances across container clusters behind an AWS Application Load Balancer (ALB).
2. **Distributed Caching (Redis)**:
   - Move session storage from MongoDB \`connect-mongo\` to a high-throughput Redis Cluster.
   - Cache hot reads (trending posts, club directory, course electives) with TTL and stale-while-revalidate invalidation.
3. **Database Read Replicas**: Configure MongoDB Atlas Replica Sets to offload read queries from the primary node to secondary read replicas.
4. **CDN Edge Caching**: Put Cloudflare or AWS CloudFront in front of static client assets and presigned S3 media downloads.
5. **Asynchronous Message Queue**: Offload email dispatches (SendGrid) and push notifications to BullMQ/RabbitMQ worker queues.`
  },
  {
    id: 'anonymity-moderation-balance',
    q: 'How does the platform balance user anonymity with moderation of abusive content?',
    category: 'Product & Ethics',
    a: `**The Dilemma**: Full anonymity without accountability leads to cyberbullying, spam, and platform abuse.
**The Solution**:
1. **Server-Side Anonymity**: Public API responses NEVER transmit author IDs to clients for \`isAnonymous\` posts.
2. **Immutable Audit Trail (\`ActivityLog.js\`)**: Database models maintain internal administrative references accessible exclusively to System Administrators through a secured dashboard for lawful policy enforcement.
3. **Community Flagging & Auto-Quarantine**: Any post receiving 3+ reports automatically gets moved to the \`ModerationQueue\`, hiding it from student feeds until reviewed by human admins.`
  },
  {
    id: 'pwa-offline',
    q: 'How is the Progressive Web App (PWA) configured for campus bandwidth resilience?',
    category: 'Frontend Engineering',
    a: `**Implementation**:
1. **Service Worker (\`sw.js\` via Vite PWA Plugin)**: Employs \`injectManifest\` to precache core HTML, CSS tokens, and JavaScript bundles.
2. **NetworkFirst for Dynamic APIs**: Requests to \`/api/posts\` and \`/api/communities\` use Network-First strategy with IndexedDB/Cache fallback when students traverse campus dead zones (basements, elevators).
3. **StaleWhileRevalidate for Static Assets**: Icons, club logos, and CSS typography load instantly from cache while refreshing in the background.`
  },
  {
    id: 'error-handling',
    q: 'How is centralized error handling structured to avoid leaking stack traces in production?',
    category: 'Resilience & DevOps',
    a: `**The Pattern**:
1. **Unified Error Middleware (\`errorMiddleware.js\`)**: All Express routes wrap asynchronous handlers in \`try/catch\` and forward failures to \`next(err)\`.
2. **Error Normalization**: Distinguishes operational errors (400 ValidationError, 403 Forbidden, 404 NotFound) from programmer errors (500 UncaughtException).
3. **Safe Serialization**: In production (\`NODE_ENV === "production"\`), stack traces are suppressed and logged to Pino/CloudWatch with unique request correlation IDs, while the client receives safe, human-readable JSON error contracts.`
  },
  {
    id: 'most-challenging-bug',
    q: 'What was a notable architectural bug you solved during development?',
    category: 'Engineering Experience',
    a: `**The Incident**: During wide-monitor layout testing, pages exhibited an unexpected blank black column beside the feed, while mobile screens suffered from broken layout overflows and dark stroke outlines on icons in dark mode.

**The Root Cause**:
1. The global layout had competing fixed margins (\`margin-left: 280px\` on \`.app-main\`) combined with hardcoded max-width constraints on the parent container rather than individual page columns.
2. The Lucide SVG icons were consuming \`var(--primary-ink)\` as SVG stroke color, which evaluated to dark charcoal, drawing an unintended thick black outline over amber badges in dark mode.

**The Resolution**:
- Refactored \`.page-col\` classes (\`page-col-feed\`, \`page-col-wide\`, \`page-col-form\`) to handle per-page responsive containment while allowing \`.app-main\` to flex fluidly across 4K displays.
- Unified icon fill and stroke tokens to \`#FFFFFF\` across all brand badges, achieving clean typographic rendering in both light and dark themes.`
  }
];

const ARCHITECTURE_LAYERS = [
  {
    layer: '1. Presentation Layer (Client)',
    tech: 'React 18 SPA, Vite, Vanilla CSS Design System, React Router 6, Axios',
    role: 'Responsive client running on Vercel CDN. Employs CSS token architecture for instant dark/light theme switching with zero runtime CSS-in-JS overhead.'
  },
  {
    layer: '2. Edge & Ingress',
    tech: 'Vercel Edge Network, Cloudflare DNS, Reverse Proxy',
    role: 'Provides TLS termination, gzip/brotli compression, HTTP/2 multiplexing, static asset caching, and route rewrites to the API server.'
  },
  {
    layer: '3. Application Layer (Backend)',
    tech: 'Node.js 20+, Express.js, Passport.js Google OAuth 2.0',
    role: 'RESTful API gateway hosted on Render. Handles authentication, token-bucket rate limiting, CSRF verification, and business logic controllers.'
  },
  {
    layer: '4. Data & Persistence',
    tech: 'MongoDB Atlas, Mongoose ODM, connect-mongo',
    role: 'Document database storing users, communities, posts, reviews, and audit logs. Utilizes compound indexing and sparse unique constraints.'
  },
  {
    layer: '5. Storage & Cloud Services',
    tech: 'AWS S3 (Presigned URLs), Google Gemini AI API, SendGrid V3',
    role: 'Offloaded binary asset storage with zero server-side streaming overhead. Integrates Gemini AI for academic note synthesis and SendGrid for verified notifications.'
  }
];

const TechDocs = () => {
  useSEO({
    title: 'Technical Architecture & Engineering Reference | TakeUForward SSN',
    description: 'System design, engineering tradeoffs, software design patterns, and interview preparation for TakeUForward SSN, architected by Tushyent.',
    keywords: 'Tushyent, System Architecture, Low Level Design, High Level Design, Software Engineering, Interview Prep, Node.js, React, MongoDB',
  });

  const [openQuestion, setOpenQuestion] = useState('anonymity');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(INTERVIEW_QUESTIONS.map(q => q.category))];

  const filteredQuestions = selectedCategory === 'All' 
    ? INTERVIEW_QUESTIONS 
    : INTERVIEW_QUESTIONS.filter(q => q.category === selectedCategory);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', paddingBottom: 'var(--space-16)' }}>
      {/* ── TOP HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))',
        borderBottom: '1px solid var(--border)',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
            <ArrowLeft size={16} /> Back to App
          </Link>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={15} color="var(--primary)" /> Engineering Reference
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <ThemeToggle />
          <a
            href="https://tushyent-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 'var(--text-xs)', fontWeight: 600,
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', textDecoration: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            Tushyent Portfolio <ExternalLink size={12} />
          </a>
        </div>
      </header>

      {/* ── MAIN CONTAINER ── */}
      <main className="page-col page-col-wide" style={{ paddingTop: 'var(--space-8)' }}>
        
        {/* HERO BANNER */}
        <div style={{ marginBottom: 'var(--space-10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Badge variant="primary" size="sm">System Architecture</Badge>
            <Badge variant="secondary" size="sm">Technical Interview Cheatsheet</Badge>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Architected by Tushyent</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.035em', margin: '0 0 var(--space-3) 0', color: 'var(--text-primary)' }}>
            TakeUForward Architecture & Technical Specs
          </h1>
          
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '820px', margin: 0 }}>
            A deep-dive technical reference guide detailing system topology, low-level design patterns, cloud tradeoffs, defensive security engines, and senior software engineering interview responses for TakeUForward SSN.
          </p>
        </div>

        {/* ── QUICK JUMP SECTION NAV ── */}
        <div style={{
          display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap',
          marginBottom: 'var(--space-8)', padding: 'var(--space-3)',
          background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}>
          {[
            { label: 'System Topology', href: '#topology' },
            { label: 'Layer Breakdown', href: '#layers' },
            { label: 'Tech Stack Rationale', href: '#stack' },
            { label: 'Design Patterns', href: '#patterns' },
            { label: 'Tradeoff Matrix', href: '#tradeoffs' },
            { label: 'Interview Q&A Cheatsheet', href: '#interview-qa' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '6px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
                color: 'var(--text-secondary)', textDecoration: 'none',
                borderRadius: 'var(--radius-xs)', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)', transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* ── SECTION 1: SYSTEM TOPOLOGY ── */}
        <section id="topology" style={{ marginBottom: 'var(--space-10)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <Network size={20} color="var(--primary)" /> High-Level System Topology & Network Flow
          </h2>

          <Card style={{ padding: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              TakeUForward implements a decoupled, modern three-tier web application topology. The Single Page Application (SPA) is globally distributed on Vercel's Edge CDN, communicating with a stateless Node.js / Express cluster on Render, backed by MongoDB Atlas and AWS S3 for direct binary storage.
            </p>

            <pre style={{
              background: 'var(--bg-base)', padding: 'var(--space-5)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', overflowX: 'auto', fontSize: '12px',
              fontFamily: 'var(--font-mono)', lineHeight: 1.5, color: 'var(--text-secondary)'
            }}>
{`+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|    React 18 SPA (Vite) | Vanilla CSS Design Tokens | PWA Service Worker (Cache)       |
+---------------------------------------------------------------------------------------+
           |                                             |
           | HTTP REST / JSON                            | Direct Binary Upload (PUT)
           v                                             v
+------------------------------------+        +-----------------------------------------+
|        EDGE / INGRESS ROUTING      |        |                 AWS S3                  |
|    Vercel Edge Network / TLS Proxy |        |  Presigned Upload URLs | Private Files  |
+------------------------------------+        +-----------------------------------------+
           |
           v
+---------------------------------------------------------------------------------------+
|                              APPLICATION LAYER (EXPRESS)                              |
|  [Helmet / CORS] -> [RateLimiter] -> [Session (Mongo)] -> [Sanitizer] -> [Auth Gate]   |
|                                                                                       |
|  Controllers: Posts | Auth (OAuth 2.0) | Chat | S3 Signing | Gemini AI Parser | Admin  |
+---------------------------------------------------------------------------------------+
           |                                             |
           | Mongoose ODM                                | SMTP / VAPID Push
           v                                             v
+------------------------------------+        +-----------------------------------------+
|          DATABASE LAYER            |        |          EXTERNAL NOTIFICATIONS         |
|   MongoDB Atlas (M10 Replica Set)  |        |    SendGrid V3 API | Web Push Service   |
|   Compound & Full-Text Indexes     |        +-----------------------------------------+
+------------------------------------+`}
            </pre>
          </Card>
        </section>

        {/* ── SECTION 2: LAYER BREAKDOWN ── */}
        <section id="layers" style={{ marginBottom: 'var(--space-10)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <Layers size={20} color="var(--primary)" /> Architectural Layers Breakdown
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {ARCHITECTURE_LAYERS.map(({ layer, tech, role }) => (
              <Card key={layer} style={{ padding: 'var(--space-5)', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--space-2)' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 650, color: 'var(--text-primary)' }}>
                    {layer}
                  </h3>
                  <Badge variant="primary" size="sm">{tech}</Badge>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {role}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: TECH STACK RATIONALE ── */}
        <section id="stack" style={{ marginBottom: 'var(--space-10)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <Cpu size={20} color="var(--primary)" /> Tech Stack Decision Matrix
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            <Card style={{ padding: 'var(--space-5)', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCode size={16} color="var(--primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>React 18 + Vite SPA</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                <strong>Why Selected</strong>: Fast Hot Module Replacement (HMR) powered by native ES modules, lightweight 510ms bundle builds, Rollup code splitting, and zero server-side rendering complexity for an authenticated dashboard application.
              </p>
            </Card>

            <Card style={{ padding: 'var(--space-5)', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={16} color="var(--primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Node.js + Express</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                <strong>Why Selected</strong>: Non-blocking asynchronous I/O ideal for API routing, mature middleware ecosystem (Passport, Helmet, Express-Rate-Limit), and fast JSON document manipulation.
              </p>
            </Card>

            <Card style={{ padding: 'var(--space-5)', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={16} color="var(--primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>MongoDB Atlas</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                <strong>Why Selected</strong>: Document model natively represents dynamic campus entities: polymorphic reviews, comments, and tagging arrays. Atlas replica sets provide high availability and fast compound indexing.
              </p>
            </Card>

            <Card style={{ padding: 'var(--space-5)', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HardDrive size={16} color="var(--primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>AWS S3 Presigned URLs</h3>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                <strong>Why Selected</strong>: Eliminates server bandwidth bottlenecks. Clients upload heavy PDFs and images directly to S3 via pre-authenticated cryptographic tokens, preserving server RAM.
              </p>
            </Card>
          </div>
        </section>

        {/* ── SECTION 4: DESIGN PATTERNS ── */}
        <section id="patterns" style={{ marginBottom: 'var(--space-10)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <GitBranch size={20} color="var(--primary)" /> Software Design Patterns Applied
          </h2>

          <Card style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1. Chain of Responsibility (Middleware)
                </h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Decoupled security gates where each request passes sequentially through <code>helmet()</code> &rarr; <code>rateLimiter</code> &rarr; <code>csrfProtection</code> &rarr; <code>sanitizeQuery</code> &rarr; <code>requireAuth</code> &rarr; <code>requireApprovedUser</code>.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Strategy Pattern
                </h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Authentication mechanisms interchangeable via Passport Strategies (Google OAuth vs System Admin credentials); Notification channels encapsulated (SendGrid Email vs Web Push).
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  3. Redaction Engine (Anonymity)
                </h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Server-side entity transformation pattern. Automatically inspects <code>isAnonymous</code> flags and purges <code>authorId</code> and user references from JSON serialization before sending over the wire.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  4. Custom Hook Abstractions
                </h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Extracted stateful UI lifecycles into pure reusable logic hooks: <code>useSEO</code> for dynamic route meta injection, <code>useDebounce</code> for search filtering, and <code>useMentionSearch</code> for student tagging.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* ── SECTION 5: TRADEOFF MATRIX ── */}
        <section id="tradeoffs" style={{ marginBottom: 'var(--space-10)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <RefreshCw size={20} color="var(--primary)" /> Key Engineering Tradeoffs
          </h2>

          <Card style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>Dimension</th>
                  <th style={{ padding: '12px 16px', color: 'var(--success)' }}>Chosen Approach</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Alternative Considered</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>Tradeoff Rationale</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Real-Time Messaging</td>
                  <td style={{ padding: '12px 16px' }}><Badge variant="success" size="sm">Polling (60s)</Badge></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>WebSockets (Socket.io)</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Serverless container compatibility and horizontal scaling simplicity without Redis Pub/Sub in Phase 1.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Session Management</td>
                  <td style={{ padding: '12px 16px' }}><Badge variant="primary" size="sm">HttpOnly Cookies</Badge></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>JWT in LocalStorage</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Complete immunity from XSS token theft and instant admin session revocation for suspended accounts.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>File Ingestion</td>
                  <td style={{ padding: '12px 16px' }}><Badge variant="accent" size="sm">S3 Presigned URLs</Badge></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Backend Proxy Stream</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Direct S3 streaming eliminates Node.js event-loop memory exhaustion during concurrent campus uploads.</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Styling Architecture</td>
                  <td style={{ padding: '12px 16px' }}><Badge variant="info" size="sm">Vanilla CSS Tokens</Badge></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Tailwind / CSS-in-JS</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Zero JS runtime overhead, instant theme switching via HTML attributes, and complete editorial aesthetic control.</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        {/* ── SECTION 6: INTERVIEW Q&A CHEATSHEET ── */}
        <section id="interview-qa" style={{ marginBottom: 'var(--space-10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 var(--space-1) 0' }}>
                <HelpCircle size={20} color="var(--primary)" /> Technical Interview Preparation Cheatsheet
              </h2>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                12 high-signal architectural interview questions and comprehensive answers tailored for technical rounds.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '4px 10px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--primary)' : 'var(--border)',
                    background: selectedCategory === cat ? 'var(--bg-elevated)' : 'transparent',
                    color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: selectedCategory === cat ? 600 : 400,
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filteredQuestions.map((item, idx) => {
              const isOpen = openQuestion === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isOpen ? 'var(--primary)' : 'var(--border)',
                    background: isOpen ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    transition: 'all var(--transition-fast)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setOpenQuestion(isOpen ? null : item.id)}
                    style={{
                      width: '100%', padding: 'var(--space-4) var(--space-5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', textAlign: 'left',
                      cursor: 'pointer', color: 'var(--text-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', width: 24, flexShrink: 0 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.q}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                      <Badge variant="secondary" size="sm">{item.category}</Badge>
                      {isOpen ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 var(--space-5) var(--space-5) calc(var(--space-5) + 24px + var(--space-3))',
                      fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7,
                      borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)'
                    }}>
                      {item.a.split('\n\n').map((paragraph, pIdx) => {
                        return (
                          <p key={pIdx} style={{ margin: '0 0 10px 0' }} dangerouslySetInnerHTML={{
                            __html: paragraph
                              .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 650;">$1</strong>')
                              .replace(/`([^`]+)`/g, '<code style="background: var(--bg-base); padding: 2px 5px; border-radius: 4px; font-size: 0.85em; border: 1px solid var(--border); font-family: var(--font-mono); color: var(--text-primary);">$1</code>')
                          }} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FOOTER SIGNATURE ── */}
        <div style={{
          marginTop: 'var(--space-12)', paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--border)', textAlign: 'center',
          fontSize: 'var(--text-sm)', color: 'var(--text-muted)'
        }}>
          <p style={{ margin: '0 0 var(--space-2) 0' }}>
            Architected & engineered with <span style={{ color: 'var(--danger)' }}>❤️</span> by{' '}
            <a
              href="https://tushyent-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Tushyent
            </a>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
            <a href="https://tushyent-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Portfolio ↗
            </a>
            <span>&middot;</span>
            <a href="https://github.com/Tushyent" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              GitHub ↗
            </a>
            <span>&middot;</span>
            <Link to="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              About TakeUForward
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
};

export default TechDocs;
