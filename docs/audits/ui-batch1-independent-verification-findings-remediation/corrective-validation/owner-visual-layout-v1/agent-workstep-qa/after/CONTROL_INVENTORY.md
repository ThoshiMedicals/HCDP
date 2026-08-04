# Control inventory — Phase 4 FINAL (after)

| Field | Value |
|---|---|
| Agent | Work-Step / Functional QA |
| Phase | Phase 4 FINAL |
| Worktree | `/tmp/hcdp-fix/ui-batch1-wqa-3491` |
| Final app SHA | `d822dfd4a80ed0c98635a0ff8631f9e39fe781f0` |
| Live target | `http://127.0.0.1:3491` (production `next start`) |
| Method | Playwright + system Chrome; DOM geometry + source cross-check |
| Evidence | `after/screenshots/`, `after/_raw-results.json`, `after/traces/` |

READ-ONLY. Does **not** claim independent verification or merge readiness.

---

## 1. Emergency announcements

**Observed title:** Beachmere clinic temporary closure — utilities fault

| Control | Disabled | Inside banner |
|---|---|---|
| Previous | true | true |
| Next | true | true |
| View All Announcements | false | true |
| Open Full Notice | false | true |
| Acknowledge | false | true |
| Withdraw notice | false | true |

- View All fully inside card (desktop+mobile): **yes**
- Page horizontal scroll on dashboard: **false**

## 2. Topbar

| Control | aria/text | Desktop visible |
|---|---|---|
| button | Open menu | false |
| select | Clinic scope | true |
| input | Search modules and sections | true |
| a | Dashboard | true |
| a | Action Inbox 6 | true |
| button | + New Entry | true |
| button | Export | true |
| button | Enterprise Sign-In · MFA | true |
| button | Online | true |

**Brand**
- Desktop: full wordmark “Doctors Pulse” (width≈151.375)
- Mobile 390: H-mark only (intentional `.brand-compact-text { display:none }` below lg — prevents partial wordmark)

**Online:** Online  
**Appearance in Topbar:** absent (CC control bar)

## 3. Sidebar

Family groups: 12

| Viewport | Footer fully visible | Act-as fully visible |
|---|---|---|
| 1440×900 | true | true |
| 1440×720 | true | true |

Act-as select operable (value change) at both heights — see WF-SIDEBAR.

## 4. Canonical routes / H1

| Route | h1 | truncateClass | scrollOverflow | textOverflow |
|---|---|---|---|---|
| `/dashboard` | Owner/Director Command Centre | false | false | clip |
| `/action-inbox` | Action Inbox & Notifications | false | false | clip |
| `/settings` | Organisation, Locations, Users & Permissions | false | false | clip |
| `/staffpay?section=overview` | Staff Pay & Payroll Preparation | false | false | clip |
| `/staffpay?section=adjustments` | Staff Pay & Payroll Preparation | false | false | clip |

Settings + M07: wrap without ellipsis (no `truncate` class; no scroll overflow).

## 5. Appearance

{
  "value": "light",
  "options": [
    {
      "value": "light",
      "label": "Light"
    },
    {
      "value": "dark",
      "label": "Dark"
    },
    {
      "value": "system",
      "label": "Device setting"
    }
  ],
  "disabled": false
}

Clean-storage → Light; Light/Dark/System persist (WF-APPEARANCE).

## 6. Out of scope

External payments/providers/communications — OUT OF SCOPE (never PASS).
