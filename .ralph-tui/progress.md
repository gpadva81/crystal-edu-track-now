# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Auth flow**: Supabase Auth → `AuthContext.jsx` listens to `onAuthStateChange` → fetches `profiles` row → sets `user` + `isAuthenticated`. New users without `account_type` get shown `SetupFlow` in `Layout.jsx:233`.
- **Routing**: Public routes (`/login`, `/register`, `/accept-invite`) are defined in `App.jsx`. All other routes go through `AuthenticatedApp` which redirects to `/login` if not authenticated.
- **UI components**: Shadcn/ui + Radix UI primitives in `src/components/ui/`. Styling uses Tailwind with violet/purple gradient theme and glassmorphism.
- **Inline validation pattern**: Use `fieldErrors` state object keyed by field name. Show `<p className="text-sm text-rose-600">` below the input. Add `border-rose-400 focus-visible:ring-rose-400` to input className when error present. Clear field error on input change.
- **Pre-existing lint issues**: Many files have unused import errors (23 total). These are not from current work — they exist across `StudentSelector`, `ClassCard`, `GamificationCard`, `UpcomingList`, `WeeklyCalendar`, etc.

---

## 2026-02-18 - US-001
- **What was implemented**: Enhanced Register page with inline field-level validation for email and password fields. The core registration flow (email+password signup via Supabase Auth, profile auto-creation via DB trigger, redirect to setup flow) was already implemented in a previous iteration.
- **Files changed**:
  - `src/pages/Register.jsx` — Added `fieldErrors` state, `validate()` function with email regex + password length check, inline error messages below each field, visual error styling on inputs, auto-clear errors on input change, and mapping of Supabase server errors to inline field errors.
- **Learnings:**
  - Registration, login, and setup flow were already fully functional from prior commits (762816f, 769fd83).
  - The `profiles` row is auto-inserted by a Supabase database trigger (`handle_new_user()`), not by client code.
  - After registration, the redirect chain is: `Register` → `Navigate to="/"` → `AuthenticatedApp` → `Layout` → `SetupFlow` (when `!user?.account_type`).
  - Supabase Auth errors can be mapped to inline field errors by checking if the message contains "email" or "password".
---

## 2026-02-18 - US-002
- **What was implemented**: Verified all acceptance criteria already met. No code changes needed — login, forgot password, auth state handling, and pending invite redirect were all implemented in prior commits (762816f, 769fd83, 496ec2e).
- **Files verified**:
  - `src/pages/Login.jsx` — `signInWithPassword()` (line 24), `resetPasswordForEmail()` with `redirectTo: origin` (line 44), forgot password UI with reset-sent confirmation (lines 36-55, 74-86), `Navigate to="/"` on authenticated (line 58).
  - `src/lib/AuthContext.jsx` — `onAuthStateChange` triggers `fetchProfile()` (lines 58-66), `pendingInvite` localStorage check + redirect after profile fetch (lines 33-37).
  - `src/App.jsx` — Public route for `/login`, authenticated redirect chain via `AuthenticatedApp`.
- **Learnings:**
  - US-002 was fully implemented alongside US-001 in prior iterations. The login flow, password reset, auth state listener, and invite redirect were all already functional.
  - The `pendingInvite` redirect happens inside `fetchProfile()` in AuthContext, not in the Login page itself. This is correct because it fires on any auth state change (login or register).
---
