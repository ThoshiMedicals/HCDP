# Auth & User Provisioning — Migration Plan (Wave 1A, revised)

**Date:** 27 July 2026  
**Stack decision:** Use the **current HCDP stack** (Next.js + platform localStorage foundation + portable PostgreSQL SQL). **Do not use Supabase** or another competing auth platform.

## Verified current state

| Concern | Current |
|---|---|
| Framework | Next.js 16 (App Router) in `Development folder` |
| Database / ORM | None live — browser `localStorage`; portable SQL under `db/migrations/` |
| Auth identity | Demo Act-as (`DEMO_IDENTITIES`) — no local `auth.users` table |
| Session | No server session; `pulse.platform.context.identity` |
| Module 3 | `pulse.org.m3.state` mock org/users/roles |

## Identity mapping

Because there is **no local auth user table**, profiles use:

`auth_identity_id TEXT UNIQUE` — real external/demo subject. **No false foreign key.**

## Base role enum

```sql
CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');
```

`profiles.role` is the validated **base account role only**. Detailed access remains in memberships, detailed_roles, permissions, role_permissions, user_role_assignments, user_clinic_access, delegations, access_reviews.

## AuthAdminAdapter (server-only)

Supports: create invited identity, send/resend/cancel/expire invitation, password reset, suspend/restore, revoke sessions, read safe account status.
