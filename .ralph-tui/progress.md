# StudyTrack Implementation Progress

## Codebase Patterns

- **Auth:** Supabase Auth + React Context (`AuthContext.jsx`). `onAuthStateChange` listener auto-fetches profile on login/logout. Pending invite redirect handled in `fetchProfile`.
- **Supabase Client:** `src/api/supabaseClient.js` exports `supabase` (raw client) and `base44` (ORM-like wrapper with `SupabaseEntity` class, auth helpers, RPC wrappers, and mock integrations).
- **UI:** Glassmorphism theme with violet/purple accents. shadcn/ui components in `src/components/ui/`. Tailwind CSS for styling.
- **Routing:** React Router v6. Authenticated users redirected from login/register to `/`. Unauthenticated users see login page.
- **State:** TanStack React Query v5 for server state, React Context for auth/student selection.

---

## 2026-02-18 - US-002
- **What was implemented:** All acceptance criteria were already complete from prior work:
  - Email + password sign-in via `supabase.auth.signInWithPassword()` (Login.jsx:24)
  - Forgot password sends Supabase reset email with redirect to app origin (Login.jsx:44)
  - Auth state change triggers profile fetch and routing via `onAuthStateChange` listener (AuthContext.jsx:58)
  - `pendingInvite` localStorage check redirects user to accept invite after login (AuthContext.jsx:33-37)
- **Files changed:** None (already implemented)
- **Learnings:**
  - The entire auth flow (login, forgot password, auth state listener, pending invite redirect) was implemented as part of an earlier commit (likely the initial app scaffold)
  - `fetchProfile` in AuthContext handles both profile loading and pending invite redirect in a single flow
---
