# Authentication & Identity — Current-State Audit (Wave 1A)

**Date:** 27 July 2026  
**Codebase:** `Development folder/`  
**Verdict:** There is **no real authentication provider and no real database**. Identity is a client-side demo switcher. Wave 1A introduces provisioning on the **current stack** (not Supabase): portable PostgreSQL SQL + server `AuthAdminAdapter` + foundation in-memory store for tests/API until `DATABASE_URL` is configured.

---

## 1. Authentication provider

| Check | Result |
|---|---|
| Supabase / NextAuth / Clerk / Firebase | **Not present** |
| Auth packages in `package.json` | None (Next + React only, plus Wave 1 `tsx`) |
| `.env*` | None found |
| `middleware.ts` | Absent |
| Login / session APIs | Absent |

Demo identity: `src/platform/context/identity-context.tsx` (`DEMO_IDENTITIES`, Act as User/Role).

---

## 2. Database and ORM

| Check | Result |
|---|---|
| Postgres / Prisma / Drizzle / SQLite | **Absent** |
| Persistence | Browser `localStorage` only |
| Platform keys | `pulse.platform.*` via `src/platform/storage/storage.ts` |
| M03 state | `pulse.org.m3.state` |

---

## 3. User / profile models (TypeScript only)

- `DemoIdentity` — shell act-as catalogue
- `OrgUser`, `RoleDefinition`, `AccessRequest`, `AccessReview` — M03 mock types in `src/lib/organisation/types.ts`
- No SQL `profiles` / `auth.users` linkage

---

## 4. Role and permission logic

- Module register `visibleForRoles` / `ENTERPRISE_ROLES`
- `PermissionGuard` on demo identity flags
- M03 role matrix + permission exceptions (e.g. `export.sensitive.payroll`)
- **Single primary role per demo user** today — insufficient for production multi-role/clinic model

---

## 5. Demo identity switching

| Key | Purpose |
|---|---|
| `pulse.platform.context.identity` | Active demo user |
| `pulse.v27.executiveRole` | Legacy role mirror |
| `pulse.m2.inbox.demoRole` / `canSeeSensitive` | Inbox demo flags |
| `pulse.org.m3.state` | M03 `currentUserId` |

Sidebar `<select aria-label="Act as User / Role">` → `setActiveIdentity`. No server session.

---

## 6. Routes relying on mock identity

All `/(portal)/[module]` routes — **no auth gate**. Visibility filtered client-side by demo role.

---

## 7. Email

No Resend/SendGrid/Nodemailer. Notifications simulate email only.

---

## 8. Server API routes

`src/app/api/**` — **none** before Wave 1A.

---

## 9. M03 features to preserve

Access requests, reviews, security alerts, `trainingComplete`, `export.sensitive.payroll`, org→inbox sync, dual-approval Sarah/David demo, Act-as UX.

---

## Wave 1A implication

| Question | Answer |
|---|---|
| Prepare vs replace? | **Introduce** greenfield auth schema + domain services |
| Do not assume generic SQL? | Correct — no existing tables to match; design for HCDP multi-role/clinic model |
| Demo Act-as? | Preserve, isolate from production auth |
| Email before launch? | Required — Wave 1A ships provider interface + console/dev fallback |
