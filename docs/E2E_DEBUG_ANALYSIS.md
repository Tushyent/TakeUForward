# E2E Test Debugging Analysis

## Overview
This document summarizes the root causes and fixes applied to the Playwright E2E test (`critical-path.spec.js`) to make it robust and pass successfully. The test simulates a full critical path: logging in, creating an anonymous post, having a second user comment on it, and searching for resources.

## Issues Identified and Fixed

### 1. Zombie Vite Server (Port Conflict)
- **Problem:** The Playwright test started failing with `net::ERR_CONNECTION_REFUSED` at `http://localhost:5173/`.
- **Root Cause:** A zombie Node process from a previous test run was holding port 5173. When the test launched the frontend via `npm run dev`, Vite detected port 5173 was in use and silently bound to port 5174 instead. However, Playwright's config and the backend CORS policy were strictly tied to port 5173, causing network requests to be blocked.
- **Fix:** Killed the orphaned Node processes holding port 5173 and ensured Vite could bind to its default port.

### 2. Checkbox Interaction Failure (React State Race Condition)
- **Problem:** The test failed to verify that the created post was "Anonymous".
- **Root Cause:** Playwright was originally finding the hidden `<input type="checkbox">` and forcing a check with `.check({ force: true })`. While this bypassed DOM visibility checks, it failed to trigger React's synthetic `onChange` event reliably, meaning the `isAnonymous` state remained `false` when the form was submitted.
- **Fix:** Changed the locator to target the `<label>` wrapping the checkbox and used a standard `.click()`. This accurately mimics real user interaction, toggling the native checkbox and firing the React state update perfectly.

### 3. Post Card Locator Timeout
- **Problem:** The test timed out waiting for `postCard.getByText('Anonymous')`.
- **Root Cause:** The `postCard` was located using the CSS selector `[class*="post-card"], article, [class*="card"]`. However, the React `Card` component (`Card.jsx`) does not apply any explicit `className="card"` to the DOM element by default. As a result, the locator returned an empty set, causing Playwright to timeout indefinitely while searching for text within it.
- **Fix:** Switched to a robust DOM traversal approach. Found the paragraph tag containing the unique post text, then traversed upward using `.locator('..')` to select its parent container (the Card itself). Applied this fix to both User A and User B's locators.

### 4. Search Results Race Condition
- **Problem:** Step 4 of the test (Search by course code) failed immediately with `Expected: true, Received: false`.
- **Root Cause:** The assertion used `await resultsList.isVisible()`, which evaluates instantaneously without waiting. Because the API request for search results took a few milliseconds, the results list wasn't immediately in the DOM, causing a false negative. Additionally, the `resultsList` locator was also incorrectly relying on `[class*="resource"]`.
- **Fix:** 
  1. Updated the `resultsList` locator to look for the "Download / View File" button, which is uniquely rendered inside resource cards.
  2. Replaced the instantaneous `.isVisible()` boolean check with Playwright's built-in auto-waiting assertion: `await expect(resultsList.or(emptyState)).toBeVisible({ timeout: 10000 })`. This ensures the test waits gracefully for the network request to resolve and the UI to update.

## Conclusion
All test regressions have been resolved. The Playwright E2E suite now successfully completes the entire critical path flow (100% pass rate) with resilient, auto-waiting locators and robust DOM interactions. Additionally, all 46 backend Jest tests continue to pass with zero regressions.
