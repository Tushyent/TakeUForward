# UI/UX & Deployment Audit (Phase 1)

## A. Visual Consistency
| Area | Category | Severity | Description |
|---|---|---|---|
| All Pages | Typography | Minor | Font sizing heavily relies on browser defaults combined with a unified `index.css`, but inline styles sometimes override colors and weights inconsistently. |
| All Pages | Spacing | Major | Margin and padding are entirely ad-hoc via inline styles (`padding: '1rem'`, `marginBottom: '20px'`). Sections lack uniform gaps. `CommunityPosts` uses `<hr/>` heavily, while `Home` uses bordered divs. |
| All Pages | Colors | Major | No standardized color system. Links are `#007BFF`, success is `#28a745`, destructive is `#dc3545` or plain `red`, but they are hardcoded per component instead of referencing CSS variables. |
| Badges | Contrast | Minor | Admin/Message badges use white text on `#28a745` (green) or blue which has acceptable contrast, but lacks a unified aesthetic. |
| All Pages | Buttons | Blocker (UX) | Buttons have no shared class. Every button is styled manually (e.g. `style={{ background: '#28a745', color: 'white', padding: '8px 16px' }}` in `ModerationQueue` vs `style={{ marginTop: '10px' }}` in `CommunityPosts`). |
| Cards/Lists | Components | Major | List items (posts, resources, communities) are styled inconsistently. Some are bordered `div`s, others are bordered `li`s, with varying padding and border colors (`#ccc` vs `#333` vs `#666`). |
| Navbar | Navigation | Minor | The navbar provides links, but there is no uniform "active" state or stylized layout that matches the rest of the application. |
| Forms | Inputs | Major | Inputs and textareas are completely unstyled default browser elements. They lack unified borders, focus states, and padding. |

## B. Empty / Loading / Error States
| Area | Category | Severity | Description |
|---|---|---|---|
| All Pages | Loading | Major | Loading states are just raw text (`<div>Loading...</div>`). During a Render cold-start, users will stare at this unstyled text for 30+ seconds. Needs a generic spinner or styled empty state. |
| All Pages | Toasts | OK | `react-hot-toast` is integrated properly across the main interactive actions. |

## C. Deployment-Specific Issues
| Area | Category | Severity | Description |
|---|---|---|---|
| Auth | Google OAuth | OK | The redirect uses `process.env.CLIENT_URL`, ensuring OAuth works end-to-end on Vercel. Session storage is persistent via `connect-mongo`. |
| API | CORS | OK | Express is configured to accept credentials from the `CLIENT_URL`. |
| Uploads | AWS S3 | OK | Presigned URL generation uses the correct `AWS_BUCKET_NAME` variable. Uploads bypass the backend directly to S3. |
| Backend | Emails | OK | SMTP logic correctly relies on `process.env` configurations. |
| Backend | Render Logs | OK | The MemoryStore warning will disappear on the next push due to the local `connect-mongo` fix already applied. |
| Backend | Health Check | OK | `GET /api/health` works and is ready for UptimeRobot. |

## D. Responsive Sanity Check
| Area | Category | Severity | Description |
|---|---|---|---|
| All Pages | Layout | Minor | `#root` has a `max-width: 100%`, but some forms have inline `maxWidth` that could cause minor shifting. Overall, flex layouts will prevent major horizontal scrolling, but mobile padding is missing. |
