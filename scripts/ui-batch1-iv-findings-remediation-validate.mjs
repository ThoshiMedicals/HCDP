/**
 * UI Batch 1 — independent-verification findings remediation validator (corrected).
 *
 * Evidence written under OUT_DIR (default remediation evidence root, or a
 * corrective-validation subdirectory when HCDP_OUT_DIR is set).
 *
 *   HCDP_BASE_URL=http://127.0.0.1:3480 \
 *   HCDP_OUT_DIR=docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation-prod \
 *   HCDP_MODE=production \
 *   node scripts/ui-batch1-iv-findings-remediation-validate.mjs
 *
 * Fail predicate (any → route fail):
 *   - navigation status ≥ 400
 *   - unallowlisted resource response ≥ 400
 *   - application page error
 *   - application console error
 *   - hydration mismatch
 *   - horizontal page overflow
 *   - chrome-scoped element clip / occlusion / unintended truncation
 *   - typography / contrast / dark-surface hard-gate failure
 *   - unallowlisted requestfailed
 *
 * Narrow HMR WebSocket allowlist + same-origin RSC/prefetch ERR_ABORTED
 * (requires `_rsc=` or verified Next prefetch headers) are classified
 * separately and never hide application errors. 403 / 500 / JSON parse /
 * unknown failures are never auto-allowlisted. Bare `resourceType()==="fetch"`
 * or bare `/_next/` path matches are NOT sufficient for abort allowlisting.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const BASE = process.env.HCDP_BASE_URL || "http://127.0.0.1:3480";
const MODE = process.env.HCDP_MODE || "unknown";
const OUT = process.env.HCDP_OUT_DIR
  ? join(process.cwd(), process.env.HCDP_OUT_DIR)
  : join(
      process.cwd(),
      "docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation"
    );
const SHOTS = join(OUT, "screenshots");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(join(OUT, "logs"), { recursive: true });

const APP_SHA =
  process.env.HCDP_APP_SHA ||
  (() => {
    try {
      return readFileSync(join(process.cwd(), ".git/HEAD"), "utf8").trim();
    } catch {
      return "unknown";
    }
  })();

const M04 = [
  "overview",
  "people",
  "staff-profiles",
  "doctor-profiles",
  "engagements",
  "credentials",
  "leave-availability",
  "restrictions",
  "onboarding",
  "offboarding",
  "reports",
  "settings",
];
const M05 = [
  "roster-board",
  "coverage",
  "open-shifts",
  "availability-leave",
  "requests",
  "conflicts-warnings",
  "published-history",
  "cost-forecast",
  "reports",
  "settings",
];
const M06 = [
  "live",
  "clock",
  "timesheets",
  "exceptions",
  "corrections",
  "approvals",
  "breaks",
  "history",
  "reports",
  "settings",
];
const M07 = [
  "overview",
  "people",
  "leave",
  "adjustments",
  "exceptions",
  "variances",
  "approval",
  "export",
  "reconciliation",
  "history",
  "settings",
];

const MATRIX_ROUTES = [
  "/dashboard",
  "/action-inbox",
  "/settings",
  "/staff-doctors",
  "/staff-doctors?section=people",
  "/staff-doctors?section=credentials",
  "/roster",
  "/roster?section=coverage",
  "/roster?section=open-shifts",
  "/time-attendance",
  "/time-attendance?section=timesheets",
  "/time-attendance?section=approvals",
  "/staffpay?section=overview",
  "/staffpay?section=people",
  "/staffpay?section=approval",
  "/staffpay?section=export",
  "/staffpay?section=reconciliation",
  "/staffpay?section=adjustments",
];

const SECTION_SWEEP = [
  ...M04.map((s) => `/staff-doctors?section=${s}`),
  ...M05.map((s) => `/roster?section=${s}`),
  ...M06.map((s) => `/time-attendance?section=${s}`),
  ...M07.map((s) => `/staffpay?section=${s}`),
];

const WIDTHS = [1440, 1280, 1024, 768, 430, 390];

/** Narrow, explicit HMR / webpack-dev-server noise allowlist only. */
function classifyEvent(text, url = "") {
  const t = String(text || "");
  const u = String(url || "");
  if (
    /webpack-hmr/i.test(t) ||
    /webpack-hmr/i.test(u) ||
    /_next\/webpack-hmr/i.test(t) ||
    /_next\/webpack-hmr/i.test(u) ||
    (/WebSocket connection/i.test(t) && /hmr/i.test(t)) ||
    (/WebSocket connection/i.test(t) && /_next\/webpack-hmr/i.test(u))
  ) {
    return {
      class: "environmental-hmr",
      allowlisted: true,
      rationale:
        "Narrow allowlist: Next.js webpack HMR WebSocket handshake noise on next dev only",
    };
  }
  if (/Download the React DevTools/i.test(t)) {
    return {
      class: "environmental-devtools-hint",
      allowlisted: true,
      rationale: "Browser DevTools install hint — not application failure",
    };
  }
  if (/\[HMR\]|Fast Refresh/i.test(t)) {
    return {
      class: "environmental-hmr",
      allowlisted: true,
      rationale: "HMR status log on next dev",
    };
  }
  // Never auto-allowlist these:
  if (/status of 403|403 \(Forbidden\)/i.test(t) || /\b403\b/.test(t) && /Failed to load resource/i.test(t)) {
    return { class: "application-http-403", allowlisted: false, rationale: "403 Forbidden is never auto-allowlisted" };
  }
  if (/status of 500|500 \(Internal Server Error\)/i.test(t)) {
    return { class: "application-http-500", allowlisted: false, rationale: "500 Internal Server Error is never auto-allowlisted" };
  }
  if (/Unexpected end of JSON input/i.test(t)) {
    return { class: "application-json-parse", allowlisted: false, rationale: "JSON parse error is never auto-allowlisted" };
  }
  if (/hydration|did not match|Text content does not match|Minified React error #418|React error #418/i.test(t)) {
    return { class: "application-hydration", allowlisted: false, rationale: "Hydration mismatch (incl. React #418)" };
  }
  if (/Failed to load resource/i.test(t)) {
    return { class: "application-resource-failure", allowlisted: false, rationale: "Resource load failure — not allowlisted" };
  }
  return { class: "application-console", allowlisted: false, rationale: "Unclassified application console/page error" };
}

function write(name, data) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

async function persistAppearance(page, mode) {
  await page.evaluate((m) => {
    localStorage.setItem("pulse.cc.appearance", JSON.stringify(m));
  }, mode);
}

async function pageProbe(page) {
  return page.evaluate(() => {
    function parseRgba(input) {
      if (!input) return null;
      const s = String(input).trim();
      if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
      const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*[,/]\s*([.\d]+))?/i);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    }
    function blend(fg, bg) {
      const a = fg.a + bg.a * (1 - fg.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
        g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
        b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
        a: 1,
      };
    }
    function effectiveBackground(el) {
      let acc = { r: 255, g: 255, b: 255, a: 0 };
      let node = el;
      while (node && node.nodeType === 1) {
        const parsed = parseRgba(getComputedStyle(node).backgroundColor);
        if (parsed && parsed.a > 0) {
          acc = blend(parsed, acc);
          if (acc.a >= 0.99) break;
        }
        if (node === document.documentElement) break;
        node = node.parentElement;
      }
      if (acc.a < 0.99) {
        const body = parseRgba(getComputedStyle(document.body).backgroundColor) || {
          r: 255,
          g: 255,
          b: 255,
          a: 1,
        };
        acc = blend(acc.a > 0 ? acc : { r: 0, g: 0, b: 0, a: 0 }, { ...body, a: 1 });
      }
      return { r: acc.r, g: acc.g, b: acc.b };
    }
    function relLuminance(rgb) {
      const channel = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
    }
    function contrastRatio(fg, bg) {
      if (!fg || !bg) return null;
      const L1 = relLuminance(fg);
      const L2 = relLuminance(bg);
      return Number(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2));
    }

    const htmlDark = document.documentElement.classList.contains("theme-dark");
    const issues = [];

    for (const el of document.querySelectorAll(".v32-nav-toggle, .v33-fav-star")) {
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize) || 0;
      const text = (el.innerText || el.getAttribute("aria-label") || "").trim();
      const visible =
        cs.opacity !== "0" &&
        cs.visibility !== "hidden" &&
        cs.display !== "none" &&
        el.getBoundingClientRect().width > 0;
      if (el.classList.contains("v32-nav-toggle") || el.classList.contains("is-fav") || visible) {
        if (fontSize + 0.01 < 13) {
          issues.push({
            kind: "typography-control-below-13",
            selector: el.className,
            fontSize,
            text: text.slice(0, 40),
          });
        }
      }
      if (el.classList.contains("v33-fav-star") && (el.classList.contains("is-fav") || visible)) {
        const fgP = parseRgba(cs.color);
        const bg = effectiveBackground(el);
        const fg = fgP ? { r: fgP.r, g: fgP.g, b: fgP.b } : null;
        const ratio = contrastRatio(fg, bg);
        const required = fontSize < 13 ? 4.5 : 3;
        if (ratio != null && ratio < required) {
          issues.push({
            kind: "fav-contrast",
            ratio,
            required,
            fontSize,
            fg: cs.color,
            bg: `rgb(${bg.r},${bg.g},${bg.b})`,
            text: text.slice(0, 20),
          });
        }
      }
    }

    const helperNodes = document.querySelectorAll(
      ".module-section-nav__select-caption, .module-section-nav__badge, .cc-chip, .cc-demo-banner, .cc-layer-label, th"
    );
    for (const el of helperNodes) {
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize) || 0;
      const text = (el.innerText || "").trim();
      if (!text) continue;
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      if (fontSize + 0.01 < 13) {
        issues.push({
          kind: "typography-helper-below-13",
          tag: el.tagName,
          className: String(el.className).slice(0, 80),
          fontSize,
          text: text.slice(0, 40),
        });
      }
    }

    if (htmlDark) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let n = 0;
      while (walker.nextNode() && n < 400) {
        const el = walker.currentNode;
        if (!(el instanceof HTMLElement)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 24 || rect.height < 16) continue;
        const bg = effectiveBackground(el);
        const lum = relLuminance(bg);
        if (lum >= 0.9) {
          const cls = String(el.className || "");
          if (/pulse-sidebar|sr-only|hidden/.test(cls)) continue;
          issues.push({
            kind: "light-surface-leak",
            background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
            className: cls.slice(0, 120),
            tag: el.tagName.toLowerCase(),
          });
          n += 20;
        }
        n++;
      }
    }

    const docEl = document.documentElement;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const horizontalOverflow =
      docEl.scrollWidth > docEl.clientWidth + 1 ||
      document.body.scrollWidth > document.body.clientWidth + 1;

    const CLIP_PROBE_SELECTOR = [
      "button",
      "a[href]",
      "input:not([type='hidden'])",
      "select",
      "header .page-title h1",
      ".page-title h1",
      ".pulse-top-ribbon button",
      ".pulse-top-ribbon a",
      ".pulse-top-ribbon select",
      ".seg-mini a",
      ".brand-compact",
      ".clinic-select-compact",
      ".cc-pulse.cc-surface-danger button",
      ".sidebar-user",
      ".sidebar-user select",
      ".v27-sidebar-role",
      ".v27-sidebar-role select",
      ".module-section-nav__tab",
      ".v32-nav-toggle",
    ].join(", ");

    function isVisible(el) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }

    function isInsideClosedDrawer(el) {
      const sidebar = el.closest(".pulse-sidebar");
      if (!sidebar) return false;
      const cs = getComputedStyle(sidebar);
      const t = cs.transform || "";
      // Closed mobile drawer uses -translate-x-full (matrix with tx ≈ -width).
      if (t && t !== "none") {
        const m = t.match(/matrix\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(",").map((x) => Number(x.trim()));
          const tx = parts[4];
          if (Number.isFinite(tx) && tx < -8) return true;
        }
      }
      const r = sidebar.getBoundingClientRect();
      return r.right <= 1;
    }

    function describeClipNode(node) {
      const cs = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      const clientW = node.clientWidth;
      const clientH = node.clientHeight;
      // When the node is a true constrained scroller, expose the *client* box (visible area),
      // not the full content-sized border box (tall .cc-root with overflow:auto but no clamp).
      const constrainedY =
        (cs.overflowY === "auto" || cs.overflowY === "scroll") &&
        node.scrollHeight > clientH + 2;
      const constrainedX =
        (cs.overflowX === "auto" || cs.overflowX === "scroll") &&
        node.scrollWidth > clientW + 2;
      return {
        tag: node.tagName.toLowerCase(),
        className: String(node.className || "").slice(0, 80),
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        position: cs.position,
        constrainedY,
        constrainedX,
        rect: {
          x: Number(r.x.toFixed(2)),
          y: Number(r.y.toFixed(2)),
          width: Number((constrainedX || constrainedY ? clientW : r.width).toFixed(2)),
          height: Number((constrainedY ? clientH : r.height).toFixed(2)),
        },
        scrollWidth: node.scrollWidth,
        clientWidth: clientW,
        scrollHeight: node.scrollHeight,
        clientHeight: clientH,
      };
    }

    function nearestClippingAncestor(el) {
      let node = el.parentElement;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        const ox = cs.overflowX;
        const oy = cs.overflowY;
        const clips =
          /(auto|scroll|hidden|clip)/.test(ox) || /(auto|scroll|hidden|clip)/.test(oy);
        if (clips) return describeClipNode(node);
        node = node.parentElement;
      }
      return null;
    }

    /** Nearest ancestor that actually scrolls vertically (scrollHeight > clientHeight). */
    function nearestVerticalScrollport(el) {
      let node = el.parentElement;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        if (
          (cs.overflowY === "auto" || cs.overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight + 2
        ) {
          return describeClipNode(node);
        }
        node = node.parentElement;
      }
      // Page-level scroll containers used by the shell (must be constrained scrollers).
      for (const sel of ["main", ".content", ".app", ".cc-root", ".pulse-sidebar nav"]) {
        const node = el.closest?.(sel);
        if (
          node instanceof HTMLElement &&
          node.scrollHeight > node.clientHeight + 2
        ) {
          const cs = getComputedStyle(node);
          if (cs.overflowY === "auto" || cs.overflowY === "scroll") {
            return describeClipNode(node);
          }
        }
      }
      return null;
    }

    function isScrollPort(anc) {
      return !!(anc && anc.constrainedY);
    }

    function clipExtents(elRect, clipRect) {
      if (!clipRect) return { clippedW: 0, clippedH: 0 };
      const left = Math.max(0, clipRect.x - elRect.x);
      const right = Math.max(0, elRect.x + elRect.width - (clipRect.x + clipRect.width));
      const top = Math.max(0, clipRect.y - elRect.y);
      const bottom = Math.max(0, elRect.y + elRect.height - (clipRect.y + clipRect.height));
      return {
        clippedW: Number((left + right).toFixed(2)),
        clippedH: Number((top + bottom).toFixed(2)),
      };
    }

    function overlapRatio(elRect, box) {
      if (!box || elRect.width <= 0 || elRect.height <= 0) return 0;
      const ox = Math.max(
        0,
        Math.min(elRect.x + elRect.width, box.x + box.width) - Math.max(elRect.x, box.x)
      );
      const oy = Math.max(
        0,
        Math.min(elRect.y + elRect.height, box.y + box.height) - Math.max(elRect.y, box.y)
      );
      return (ox * oy) / (elRect.width * elRect.height);
    }

    /** Visible portion of a scrollport clamped to the viewport (client view). */
    function visibleScrollportBox(scrollport) {
      if (!scrollport?.rect) return null;
      const b = scrollport.rect;
      const x = Math.max(0, b.x);
      const y = Math.max(0, b.y);
      const right = Math.min(vw, b.x + b.width);
      const bottom = Math.min(vh, b.y + b.height);
      const width = right - x;
      const height = bottom - y;
      if (width <= 1 || height <= 1) return null;
      return { x, y, width, height };
    }

    /**
     * Legitimate scroll-region exemption: centre or majority of the box lies outside
     * the nearest vertical scrollport's viewport-visible client area
     * (nav.overflow-auto, main, .content, .app, overflow-x-auto rows).
     */
    function legitimateScrollRegionExemption(elRect, scrollport) {
      if (!scrollport) return false;
      const box = visibleScrollportBox(scrollport) || scrollport.rect;
      if (!box) return false;
      const cx = elRect.x + elRect.width / 2;
      const cy = elRect.y + elRect.height / 2;
      const centreOutside =
        cy < box.y - 1 ||
        cy > box.y + box.height + 1 ||
        cx < box.x - 1 ||
        cx > box.x + box.width + 1;
      const majorityOutside = overlapRatio(elRect, box) < 0.5;
      return centreOutside || majorityOutside;
    }

    /** Horizontal overflow-x auto/scroll containers (tables, ribbon-right) — not layout defects. */
    function inHorizontalScrollContainer(el, clipAnc) {
      if (clipAnc && (clipAnc.overflowX === "auto" || clipAnc.overflowX === "scroll")) return true;
      return !!el.closest?.(
        ".overflow-x-auto, .ribbon-right, [class*='overflow-x-auto'], [class*='overflow-x-scroll']"
      );
    }

    function isChromeScoped(el) {
      return !!(
        el.closest(".pulse-top-ribbon") ||
        el.closest(".brand-compact") ||
        el.closest(".seg-mini") ||
        el.closest(".cc-pulse.cc-surface-danger") ||
        el.closest(".sidebar-user") ||
        el.closest(".v27-sidebar-role") ||
        el.matches?.("header .page-title h1, .page-title h1") ||
        (el.tagName === "H1" && el.closest(".page-title"))
      );
    }

    function centreOccluded(el) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > vw || cy > vh) {
        return { occluded: false, skipped: "centre-outside-viewport", topTag: null };
      }
      const top = document.elementFromPoint(cx, cy);
      if (!top) return { occluded: true, skipped: null, topTag: null };
      const hit = el === top || el.contains(top) || top.contains(el);
      return {
        occluded: !hit,
        skipped: null,
        topTag: top.tagName?.toLowerCase() || null,
        topClass: String(top.className || "").slice(0, 60),
        topEl: top,
      };
    }

    /**
     * Sticky/fixed sidebar footer covering a nav link scrolled underneath is not a
     * true occlusion defect — the control is clipped by the scrollable nav above it.
     */
    function stickyFooterScrollOcclusion(el, occ, scrollport) {
      if (!occ?.occluded || !occ.topEl) return false;
      const footer = occ.topEl.closest?.(".sidebar-user");
      if (!footer) return false;
      // Footer sits below flex-1 overflow nav (sticky/fixed or stacked shrink-0); nav links
      // scrolled underneath are legitimate scroll, not chrome occlusion defects.
      const inSidebarNav =
        !!el.closest?.(".pulse-sidebar nav, nav.flex-1, nav[aria-label='Platform modules']") ||
        !!(
          scrollport &&
          /nav/i.test(String(scrollport.tag || "")) &&
          el.closest?.(".pulse-sidebar")
        );
      return inSidebarNav && !!scrollport;
    }

    function hasUnintendedTruncation(el) {
      const cs = getComputedStyle(el);
      const text = (el.innerText || el.textContent || "").trim();
      if (!text || text.length < 2) return false;
      const nowrap = cs.whiteSpace === "nowrap" || cs.whiteSpace === "pre";
      const ellipsis = cs.textOverflow === "ellipsis";
      const hiddenOverflow = cs.overflowX === "hidden" || cs.overflow === "hidden";
      if ((ellipsis || (nowrap && hiddenOverflow)) && el.scrollWidth > el.clientWidth + 2) {
        // Intentional brand-compact-text hide is display:none, not truncation.
        if (el.closest?.(".brand-compact-text")) return false;
        return true;
      }
      return false;
    }

    const overflowHits = [];
    const elementClipHits = [];
    const seen = new Set();
    for (const el of document.querySelectorAll(CLIP_PROBE_SELECTOR)) {
      if (!(el instanceof HTMLElement)) continue;
      if (seen.has(el)) continue;
      seen.add(el);
      if (!isVisible(el)) continue;
      if (isInsideClosedDrawer(el)) continue;

      const r = el.getBoundingClientRect();
      const elRect = { x: r.x, y: r.y, width: r.width, height: r.height };
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // Meaningful visibility: hard-fails require the control centre in the viewport.
      const centreInViewport = cx >= 0 && cy >= 0 && cx <= vw && cy <= vh;
      const clipAnc = nearestClippingAncestor(el);
      const scrollport = nearestVerticalScrollport(el) || (
        inHorizontalScrollContainer(el, clipAnc) ? clipAnc : null
      );
      const scrollExempt = legitimateScrollRegionExemption(elRect, scrollport);
      const hScroll = inHorizontalScrollContainer(el, clipAnc);

      const eps = 1.5;
      // Horizontal escape always matters; vertical-only below/above fold is page scroll.
      const outsideViewportX = r.left < -eps || r.right > vw + eps;
      const outsideViewportY =
        (r.top < -eps && r.bottom > eps) || (r.bottom > vh + eps && r.top < vh - eps);
      const entirelyOutsideViewportY = r.bottom <= eps || r.top >= vh - eps;
      const outsideViewport = outsideViewportX || (outsideViewportY && !entirelyOutsideViewportY);

      const clipBox = clipAnc?.rect || null;
      const { clippedW, clippedH } = clipExtents(elRect, clipBox);
      // Vertical-only clip by a scrollport is legitimate scrolling, not a layout defect.
      const verticalOnlyScrollClip =
        isScrollPort(clipAnc) && clippedW <= 2 && clippedH > 2;
      // Horizontal-only clip inside overflow-x auto/scroll is legitimate row/table scroll.
      const horizontalOnlyScrollClip =
        hScroll && clippedH <= 2 && clippedW > 2;
      const clippedByAncestor =
        !!clipAnc &&
        (clippedW > 2 || clippedH > 2) &&
        !verticalOnlyScrollClip &&
        !horizontalOnlyScrollClip &&
        !scrollExempt;

      const occ = centreOccluded(el);
      const footerScrollOcc = stickyFooterScrollOcclusion(el, occ, scrollport);
      // Ignore occlusion when centre outside viewport, scroll-exempt, or under sticky footer.
      const occluded =
        !!occ.occluded &&
        !occ.skipped &&
        !scrollExempt &&
        !footerScrollOcc &&
        centreInViewport;

      const trunc = hasUnintendedTruncation(el);
      const scrollOverflow = el.scrollWidth > el.clientWidth + 2;

      // Broad .content / main scrollWidth noise — record but do not chrome-fail.
      const noisyScrollContainer =
        el.matches?.("main, .content") ||
        el.classList?.contains("content") ||
        el.tagName === "MAIN";

      // Vertical-only escape through the viewport edge = page/document scroll, not a defect.
      // Covers fully below/above fold and partially past the fold (e.g. 15px of a toolbar button).
      const belowViewportPageScroll =
        !outsideViewportX &&
        (entirelyOutsideViewportY || (outsideViewportY && !outsideViewportX));

      // Non-chrome (or ribbon overflow) horizontal scroll escape — not a layout defect.
      const horizontalScrollEscape = !!(outsideViewportX && hScroll);

      const hit = {
        kind: "element-clip-probe",
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40),
        className: String(el.className || "").slice(0, 80),
        chromeScoped: isChromeScoped(el),
        rect: {
          x: Number(r.x.toFixed(2)),
          y: Number(r.y.toFixed(2)),
          width: Number(r.width.toFixed(2)),
          height: Number(r.height.toFixed(2)),
        },
        viewport: { width: vw, height: vh },
        centreInViewport,
        outsideViewport:
          !!outsideViewport &&
          !scrollExempt &&
          !belowViewportPageScroll &&
          !(horizontalScrollEscape && !isChromeScoped(el)),
        nearestClippingAncestor: clipAnc,
        nearestVerticalScrollport: scrollport,
        legitimateScrollRegionExemption: !!scrollExempt,
        stickyFooterScrollOcclusion: !!footerScrollOcc,
        horizontalScrollEscape: !!horizontalScrollEscape,
        clippedW,
        clippedH,
        clippedByAncestor: !!clippedByAncestor,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollOverflow,
        centreOcclusion: {
          occluded: occ.occluded,
          skipped: occ.skipped,
          topTag: occ.topTag,
          topClass: occ.topClass,
        },
        occluded,
        unintendedTruncation: trunc,
        noisyScrollContainer: !!noisyScrollContainer,
        belowViewportPageScroll: !!belowViewportPageScroll,
      };

      if (
        hit.outsideViewport ||
        hit.clippedByAncestor ||
        hit.occluded ||
        hit.unintendedTruncation ||
        (scrollOverflow && !noisyScrollContainer && !scrollExempt && !hScroll)
      ) {
        overflowHits.push(hit);
      }
      elementClipHits.push(hit);
    }

    // Hard fails: only for meaningfully visible controls (centre in viewport).
    // Never hard-fail legitimate scroll-region / sticky-footer / below-fold / h-scroll noise.
    const elementClipFails = overflowHits.filter((h) => {
      if (h.noisyScrollContainer) return false;
      if (h.legitimateScrollRegionExemption) return false;
      if (h.stickyFooterScrollOcclusion) return false;
      if (h.belowViewportPageScroll) return false;
      if (h.horizontalScrollEscape) return false;
      // Prompt: fail when a *visible meaningful* control is defective — centre must be on-screen.
      if (!h.centreInViewport) return false;
      if (!h.chromeScoped) {
        return (
          (h.outsideViewport && (h.tag === "button" || h.tag === "a" || h.tag === "select" || h.tag === "input")) ||
          (h.occluded && (h.tag === "button" || h.tag === "a" || h.tag === "select"))
        );
      }
      // Chrome-scoped: brand / seg-mini / emergency / sidebar-user / H1 / top-ribbon while visible.
      return (
        h.outsideViewport ||
        h.clippedByAncestor ||
        h.occluded ||
        h.unintendedTruncation
      );
    });

    return {
      htmlDark,
      appearance: document.documentElement.dataset.appearance || null,
      issues,
      horizontalOverflow,
      overflowHits: overflowHits.slice(0, 80),
      elementClipHits: elementClipHits.slice(0, 120),
      elementClipFails: elementClipFails.slice(0, 40),
      sidebarCount: document.querySelectorAll(".pulse-sidebar").length,
      bootstrapStatus: document.querySelector("[data-m07-bootstrap-status]")?.textContent || null,
      scrollWidth: docEl.scrollWidth,
      clientWidth: docEl.clientWidth,
    };
  });
}

function attachRouteCollectors(page, bag) {
  const onConsole = (msg) => {
    const text = msg.text();
    const loc = msg.location();
    const entry = {
      type: "console",
      level: msg.type(),
      text,
      url: loc?.url || "",
      line: loc?.lineNumber,
      column: loc?.columnNumber,
      at: nowIso(),
      ...classifyEvent(text, loc?.url || ""),
    };
    bag.rawEvents.push(entry);
    if (msg.type() === "error" || /hydration|did not match|Unexpected end of JSON|Failed to load resource/i.test(text)) {
      if (entry.allowlisted) bag.allowlistedEvents.push(entry);
      else bag.appConsoleErrors.push(entry);
    }
    if (
      /hydration|did not match|Text content does not match|Minified React error #418|React error #418/i.test(
        text
      )
    ) {
      bag.hydrationSignatures.push(entry);
    }
  };
  const onPageError = (err) => {
    const text = String(err?.message || err);
    const entry = {
      type: "pageerror",
      text,
      stack: err?.stack ? String(err.stack).slice(0, 2000) : undefined,
      at: nowIso(),
      ...classifyEvent(text),
    };
    bag.rawEvents.push(entry);
    if (entry.allowlisted) bag.allowlistedEvents.push(entry);
    else bag.appPageErrors.push(entry);
    if (
      /hydration|did not match|Minified React error #418|React error #418/i.test(text)
    ) {
      bag.hydrationSignatures.push(entry);
    }
  };
  const onRequestFailed = (req) => {
    const failure = req.failure();
    const failureText = failure?.errorText || "unknown";
    const url = req.url();
    let cls = classifyEvent(failureText, url);
    // Narrow abort allowlist: same-origin + ERR_ABORTED + (_rsc= OR verified Next prefetch headers).
    // Bare resourceType()==="fetch" or bare /_next/ path is NOT sufficient.
    if (/net::ERR_ABORTED/i.test(failureText)) {
      try {
        const u = new URL(url);
        const base = new URL(BASE);
        if (u.origin === base.origin) {
          const headers = typeof req.headers === "function" ? req.headers() : {};
          const purpose = String(headers["purpose"] || headers["sec-purpose"] || "");
          const nextPrefetch = String(
            headers["next-router-prefetch"] || headers["Next-Router-Prefetch"] || ""
          );
          const rscQuery = url.includes("_rsc=");
          const prefetchSig =
            nextPrefetch === "1" || /prefetch/i.test(purpose);
          if (rscQuery || prefetchSig) {
            cls = {
              class: "environmental-nav-abort",
              allowlisted: true,
              rationale:
                "Same-origin net::ERR_ABORTED with RSC (_rsc=) or verified Next prefetch headers (next-router-prefetch / Purpose: prefetch). Bare fetch resourceType or bare /_next/ path alone is not allowlisted. Recorded but not an HTTP 403/500/JSON application failure.",
            };
          }
        }
      } catch {
        /* keep prior classification */
      }
    }
    const entry = {
      type: "requestfailed",
      url,
      method: req.method(),
      resourceType: req.resourceType(),
      failureText,
      at: nowIso(),
      ...cls,
    };
    bag.rawEvents.push(entry);
    bag.failedRequests.push(entry);
    if (!entry.allowlisted) bag.unallowlistedFailedRequests.push(entry);
    else bag.allowlistedEvents.push(entry);
  };
  const onResponse = (res) => {
    const status = res.status();
    if (status < 400) return;
    const entry = {
      type: "response",
      url: res.url(),
      status,
      statusText: res.statusText(),
      resourceType: res.request().resourceType(),
      method: res.request().method(),
      at: nowIso(),
      ...classifyEvent(`status of ${status}`, res.url()),
    };
    // Re-classify HTTP status precisely
    if (status === 403) {
      entry.class = "application-http-403";
      entry.allowlisted = false;
      entry.rationale = "403 Forbidden is never auto-allowlisted";
    } else if (status >= 500) {
      entry.class = "application-http-500";
      entry.allowlisted = false;
      entry.rationale = "5xx response is never auto-allowlisted";
    } else if (/webpack-hmr|_next\/webpack-hmr/i.test(res.url())) {
      entry.class = "environmental-hmr";
      entry.allowlisted = true;
      entry.rationale = "HMR endpoint HTTP error — narrow allowlist";
    } else {
      entry.class = "application-http-4xx";
      entry.allowlisted = false;
      entry.rationale = "Resource HTTP ≥400 is never auto-allowlisted";
    }
    bag.rawEvents.push(entry);
    bag.httpErrors.push(entry);
    if (entry.allowlisted) bag.allowlistedEvents.push(entry);
    else bag.unallowlistedHttpErrors.push(entry);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
    page.off("response", onResponse);
  };
}

function emptyBag() {
  return {
    rawEvents: [],
    appConsoleErrors: [],
    appPageErrors: [],
    hydrationSignatures: [],
    failedRequests: [],
    unallowlistedFailedRequests: [],
    httpErrors: [],
    unallowlistedHttpErrors: [],
    allowlistedEvents: [],
  };
}

function adjudicateFail(entry) {
  const reasons = [];
  if ((entry.navigationStatus ?? 0) >= 400) reasons.push(`navigation-status-${entry.navigationStatus}`);
  if ((entry.unallowlistedHttpErrors || []).length)
    reasons.push(`unallowlisted-http-${entry.unallowlistedHttpErrors.length}`);
  if ((entry.appPageErrors || []).length) reasons.push(`pageerror-${entry.appPageErrors.length}`);
  if ((entry.appConsoleErrors || []).length) reasons.push(`console-error-${entry.appConsoleErrors.length}`);
  if ((entry.hydrationSignatures || []).length) reasons.push(`hydration-${entry.hydrationSignatures.length}`);
  if (entry.horizontalOverflow) reasons.push("horizontal-overflow");
  // Chrome-scoped element clip / occlusion only — never hard-fail on noisy .content scrollWidth.
  if ((entry.elementClipFails || []).length)
    reasons.push(`element-clip-${entry.elementClipFails.length}`);
  const hard = (entry.visualIssues || []).filter((i) =>
    [
      "typography-control-below-13",
      "typography-helper-below-13",
      "fav-contrast",
      "light-surface-leak",
    ].includes(i.kind)
  );
  if (hard.length) reasons.push(`visual-hard-gate-${hard.length}`);
  if ((entry.unallowlistedFailedRequests || []).length)
    reasons.push(`requestfailed-${entry.unallowlistedFailedRequests.length}`);
  return { fail: reasons.length > 0, failReasons: reasons };
}

async function visitRoute(page, route, meta, bag) {
  const startedAt = nowIso();
  const t0 = Date.now();
  // Reset per-route collectors (listeners close over `bag` object; replace array fields).
  Object.assign(bag, emptyBag());

  let navigationStatus = 0;
  let finalUrl = "";
  let navError = null;
  try {
    const res = await page.goto(BASE + route, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    navigationStatus = res?.status() ?? 0;
    finalUrl = page.url();
    try {
      await page.waitForLoadState("networkidle", { timeout: 8000 });
    } catch {
      /* settle */
    }
    await page.waitForTimeout(250);
  } catch (err) {
    navError = String(err);
    finalUrl = page.url();
  }

  const probe = await pageProbe(page).catch((err) => ({
    issues: [{ kind: "probe-error", text: String(err) }],
    horizontalOverflow: false,
    overflowHits: [],
    elementClipHits: [],
    elementClipFails: [],
    htmlDark: false,
  }));

  const endedAt = nowIso();
  const entry = {
    route,
    finalUrl,
    appearance: meta.appearance,
    viewport: meta.width,
    mode: MODE,
    navigationStatus,
    navError,
    startedAt,
    endedAt,
    ms: Date.now() - t0,
    htmlDark: probe.htmlDark,
    sidebarCount: probe.sidebarCount,
    bootstrapStatus: probe.bootstrapStatus ?? null,
    visualIssues: probe.issues || [],
    horizontalOverflow: !!probe.horizontalOverflow,
    overflowHits: probe.overflowHits || [],
    elementClipHits: probe.elementClipHits || [],
    elementClipFails: probe.elementClipFails || [],
    scrollWidth: probe.scrollWidth,
    clientWidth: probe.clientWidth,
    appConsoleErrors: [...bag.appConsoleErrors],
    appPageErrors: [...bag.appPageErrors],
    hydrationSignatures: [...bag.hydrationSignatures],
    failedRequests: [...bag.failedRequests],
    unallowlistedFailedRequests: [...bag.unallowlistedFailedRequests],
    httpErrors: [...bag.httpErrors],
    unallowlistedHttpErrors: [...bag.unallowlistedHttpErrors],
    allowlistedEvents: [...bag.allowlistedEvents],
    rawEvents: [...bag.rawEvents],
    sweep: !!meta.sweep,
  };
  const adj = adjudicateFail(entry);
  entry.fail = adj.fail;
  entry.failReasons = adj.failReasons;
  return entry;
}

async function runAppearancePersistence(browser) {
  const results = {};
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
    });
    const page = await ctx.newPage();
    const bag = emptyBag();
    const detach = attachRouteCollectors(page, bag);
    await ctx.clearCookies();
    await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    let probe = await pageProbe(page);
    results.cleanDefault = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === false,
    };

    await persistAppearance(page, "dark");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    probe = await pageProbe(page);
    results.darkReload = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === true && probe.appearance === "dark",
    };
    await page.screenshot({ path: join(SHOTS, "persist-dark-reload.png"), fullPage: false });

    await persistAppearance(page, "light");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    probe = await pageProbe(page);
    results.lightReload = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === false && probe.appearance === "light",
    };

    await persistAppearance(page, "system");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    probe = await pageProbe(page);
    results.systemOsLight = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === false && probe.appearance === "system",
    };
    detach();
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 120000 });
    await persistAppearance(page, "system");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const probe = await pageProbe(page);
    results.systemOsDark = {
      htmlDark: probe.htmlDark,
      appearance: probe.appearance,
      pass: probe.htmlDark === true && probe.appearance === "system",
    };
    await page.screenshot({ path: join(SHOTS, "persist-system-os-dark.png"), fullPage: false });
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    const after = await pageProbe(page);
    results.systemOsChangeToLight = {
      htmlDark: after.htmlDark,
      appearance: after.appearance,
      pass: after.htmlDark === false && after.appearance === "system",
    };
    await ctx.close();
  }
  return results;
}

async function runMatrix(browser) {
  const matrix = [];
  const allRaw = [];

  for (const width of WIDTHS) {
    const appearances =
      width === 1440 || width === 390 ? ["light", "dark", "system"] : ["light", "dark"];
    for (const appearance of appearances) {
      const colorScheme = appearance === "dark" ? "dark" : "light";
      const ctx = await browser.newContext({
        viewport: { width, height: width <= 430 ? 844 : 900 },
        colorScheme,
      });
      const page = await ctx.newPage();
      const bag = emptyBag();
      const detach = attachRouteCollectors(page, bag);

      await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 120000 });
      await persistAppearance(page, appearance);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);

      for (const route of MATRIX_ROUTES) {
        const entry = await visitRoute(page, route, { appearance, width }, bag);
        matrix.push(entry);
        allRaw.push(...entry.rawEvents.map((e) => ({ ...e, route, appearance, width })));

        if (
          (route === "/dashboard" ||
            route === "/settings" ||
            route === "/action-inbox" ||
            route === "/staffpay?section=overview" ||
            route === "/staffpay?section=adjustments") &&
          (width === 1440 || width === 390) &&
          (appearance === "light" || appearance === "dark")
        ) {
          const slug = `${appearance}-${width}-${route.replace(/[/?=&]/g, "_")}`;
          await page.screenshot({ path: join(SHOTS, `${slug}.png`), fullPage: false }).catch(() => {});
        }
      }
      detach();
      await ctx.close();
    }
  }

  // Section sweep @1440 light + dark
  for (const appearance of ["light", "dark"]) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: appearance === "dark" ? "dark" : "light",
    });
    const page = await ctx.newPage();
    const bag = emptyBag();
    const detach = attachRouteCollectors(page, bag);
    await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 120000 });
    await persistAppearance(page, appearance);
    await page.reload({ waitUntil: "domcontentloaded" });
    for (const route of SECTION_SWEEP) {
      const entry = await visitRoute(page, route, { appearance, width: 1440, sweep: true }, bag);
      matrix.push(entry);
      allRaw.push(...entry.rawEvents.map((e) => ({ ...e, route, appearance, width: 1440, sweep: true })));
    }
    detach();
    await ctx.close();
  }

  return { matrix, allRaw };
}

async function runDevFocusedProbes(browser) {
  /** First Dark 1440 route sequence + M07 overview/adjustments */
  const sequence = [];
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  const bag = emptyBag();
  const detach = attachRouteCollectors(page, bag);
  await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 120000 });
  await persistAppearance(page, "dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);

  for (const route of MATRIX_ROUTES) {
    const entry = await visitRoute(page, route, { appearance: "dark", width: 1440 }, bag);
    sequence.push(entry);
  }
  for (const route of ["/staffpay?section=overview", "/staffpay?section=adjustments"]) {
    const entry = await visitRoute(page, route, { appearance: "dark", width: 1440 }, bag);
    sequence.push({ ...entry, focusedRepeat: true });
  }
  detach();
  await ctx.close();
  return sequence;
}

async function runFirstHitProbes(browser, label) {
  const results = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
    const page = await ctx.newPage();
    const bag = emptyBag();
    const detach = attachRouteCollectors(page, bag);
    const entry = await visitRoute(page, "/staffpay?section=adjustments", { appearance: "dark", width: 1440 }, bag);
    results.push({ label, attempt: i + 1, ...entry });
    detach();
    await ctx.close();
  }
  return results;
}

function summarise(matrix, allRaw, appearanceResults, extras = {}) {
  const fails = matrix.filter((m) => m.fail);
  const unresolved = allRaw.filter((e) => !e.allowlisted);
  const allowlisted = allRaw.filter((e) => e.allowlisted);
  const byClass = {};
  for (const e of allRaw) {
    byClass[e.class || "unknown"] = (byClass[e.class || "unknown"] || 0) + 1;
  }
  const http500 = matrix.flatMap((m) =>
    (m.unallowlistedHttpErrors || [])
      .filter((e) => e.status >= 500 || e.class === "application-http-500")
      .map((e) => ({ route: m.route, appearance: m.appearance, viewport: m.viewport, ...e }))
  );
  const http403 = matrix.flatMap((m) =>
    (m.unallowlistedHttpErrors || [])
      .filter((e) => e.status === 403 || e.class === "application-http-403")
      .map((e) => ({ route: m.route, appearance: m.appearance, viewport: m.viewport, ...e }))
  );
  const jsonParse = matrix.flatMap((m) =>
    [...(m.appPageErrors || []), ...(m.appConsoleErrors || [])]
      .filter((e) => e.class === "application-json-parse" || /Unexpected end of JSON/i.test(e.text || ""))
      .map((e) => ({ route: m.route, appearance: m.appearance, viewport: m.viewport, ...e }))
  );
  return {
    mode: MODE,
    base: BASE,
    appShaEnv: process.env.HCDP_APP_SHA || null,
    matrixEntries: matrix.length,
    matrixFail: fails.length,
    matrixPass: matrix.length - fails.length,
    issueTotals: matrix
      .flatMap((m) => m.visualIssues || [])
      .reduce((acc, i) => {
        acc[i.kind] = (acc[i.kind] || 0) + 1;
        return acc;
      }, {}),
    rawEventCount: allRaw.length,
    unresolvedApplicationEventCount: unresolved.length,
    allowlistedEnvironmentalEventCount: allowlisted.length,
    eventsByClass: byClass,
    hydrationTotal: matrix.reduce((n, m) => n + (m.hydrationSignatures?.length || 0), 0),
    overflowFailCount: matrix.filter((m) => m.horizontalOverflow).length,
    elementClipFailCount: matrix.reduce((n, m) => n + (m.elementClipFails?.length || 0), 0),
    consoleAppErrorCount: matrix.reduce((n, m) => n + (m.appConsoleErrors?.length || 0), 0),
    pageErrorCount: matrix.reduce((n, m) => n + (m.appPageErrors?.length || 0), 0),
    http500,
    http403,
    jsonParse,
    appearanceResults,
    appearanceAllPass: Object.values(appearanceResults || {}).every((r) => r.pass),
    failSamples: fails.slice(0, 40).map((m) => ({
      route: m.route,
      appearance: m.appearance,
      viewport: m.viewport,
      navigationStatus: m.navigationStatus,
      failReasons: m.failReasons,
      unallowlistedHttpErrors: (m.unallowlistedHttpErrors || []).slice(0, 5),
      appPageErrors: (m.appPageErrors || []).slice(0, 3),
      appConsoleErrors: (m.appConsoleErrors || []).slice(0, 3),
    })),
    ...extras,
  };
}

async function main() {
  const profile = process.env.HCDP_PROFILE || "full-matrix";
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const meta = {
    mode: MODE,
    profile,
    base: BASE,
    out: OUT,
    startedAt: nowIso(),
    appSha: process.env.HCDP_APP_SHA || null,
    node: process.version,
  };

  if (profile === "dev-focused") {
    const sequence = await runDevFocusedProbes(browser);
    const firstHitWarm = await runFirstHitProbes(browser, "warm-server-first-request");
    const allRaw = [
      ...sequence.flatMap((e) => (e.rawEvents || []).map((r) => ({ ...r, route: e.route }))),
      ...firstHitWarm.flatMap((e) => (e.rawEvents || []).map((r) => ({ ...r, route: e.route }))),
    ];
    const summary = summarise(sequence, allRaw, {}, { firstHitWarm });
    write("dev-focused-sequence.json", sequence);
    write("dev-focused-first-hit-warm.json", firstHitWarm);
    write("raw-events-full.json", allRaw);
    write("allowlisted-environmental-events.json", allRaw.filter((e) => e.allowlisted));
    write("unresolved-application-events.json", allRaw.filter((e) => !e.allowlisted));
    write("summary.json", summary);
    write("classification-rationale.json", {
      allowlist:
        "HMR WebSocket / HMR status and DevTools install hints are allowlisted. Same-origin net::ERR_ABORTED is allowlisted only when the URL contains _rsc= OR verified Next prefetch headers (next-router-prefetch / Purpose|Sec-Purpose: prefetch). Bare resourceType()==='fetch' or bare /_next/ path alone is NOT sufficient. 403, 500, JSON parse, and unknown resource failures are never allowlisted.",
      failPredicate: [
        "navigation status ≥ 400",
        "unallowlisted resource response ≥ 400",
        "application page error",
        "application console error",
        "hydration mismatch",
        "horizontal page overflow",
        "chrome-scoped element clip / occlusion / unintended truncation",
        "typography / contrast / dark-surface hard-gate failure",
        "unallowlisted requestfailed",
      ],
    });
    write("run-meta.json", { ...meta, endedAt: nowIso(), summary });
    console.log(JSON.stringify(summary, null, 2));
    await browser.close();
    process.exit(summary.matrixFail > 0 || summary.unresolvedApplicationEventCount > 0 ? 2 : 0);
  }

  if (profile === "first-hit-only") {
    const firstHit = await runFirstHitProbes(browser, process.env.HCDP_HIT_LABEL || "first-hit");
    const allRaw = firstHit.flatMap((e) => (e.rawEvents || []).map((r) => ({ ...r, route: e.route })));
    const summary = summarise(firstHit, allRaw, {}, { firstHit });
    write("first-hit.json", firstHit);
    write("raw-events-full.json", allRaw);
    write("allowlisted-environmental-events.json", allRaw.filter((e) => e.allowlisted));
    write("unresolved-application-events.json", allRaw.filter((e) => !e.allowlisted));
    write("summary.json", summary);
    write("run-meta.json", { ...meta, endedAt: nowIso() });
    console.log(JSON.stringify(summary, null, 2));
    await browser.close();
    process.exit(summary.matrixFail > 0 || (summary.http500?.length || 0) > 0 ? 2 : 0);
  }

  // full-matrix (default)
  const appearanceResults = await runAppearancePersistence(browser);
  const { matrix, allRaw } = await runMatrix(browser);
  const summary = summarise(matrix, allRaw, appearanceResults);

  write("browser-validation-report.json", { summary, matrix });
  write("per-route-matrix.json", matrix);
  write("raw-events-full.json", allRaw);
  write("allowlisted-environmental-events.json", allRaw.filter((e) => e.allowlisted));
  write("unresolved-application-events.json", allRaw.filter((e) => !e.allowlisted));
  write("appearance-persistence.json", appearanceResults);
  write("http-500-events.json", summary.http500);
  write("http-403-events.json", summary.http403);
  write("json-parse-events.json", summary.jsonParse);
  write("classification-rationale.json", {
    allowlist:
      "HMR WebSocket / HMR status and DevTools install hints are allowlisted. Same-origin net::ERR_ABORTED is allowlisted only when the URL contains _rsc= OR verified Next prefetch headers (next-router-prefetch / Purpose|Sec-Purpose: prefetch). Bare resourceType()==='fetch' or bare /_next/ path alone is NOT sufficient. 403, 500, JSON parse, and unknown resource failures are never allowlisted. Historical prod-matrix-v3 proof: 6446/6446 environmental-nav-abort events were same-origin _rsc= ERR_ABORTED (see agent-implementation/ABORT_ALLOWLIST_RSC_PROOF.md).",
    failPredicate: [
      "navigation status ≥ 400",
      "unallowlisted resource response ≥ 400",
      "application page error",
      "application console error",
      "hydration mismatch",
      "horizontal page overflow",
      "chrome-scoped element clip / occlusion / unintended truncation",
      "typography / contrast / dark-surface hard-gate failure",
      "unallowlisted requestfailed",
    ],
    priorContradiction:
      "Previous validator used a global console bag, excluded console/page/hydration/overflow from fail, and truncated consoleBag to 100 — it could not support matrixFail:0.",
  });
  write("summary.json", summary);
  write("run-meta.json", { ...meta, endedAt: nowIso(), matrixEntries: matrix.length });

  // Compact issues for quick scan
  write(
    "issue-samples.json",
    {
      fails: summary.failSamples,
      http500: summary.http500.slice(0, 20),
      http403: summary.http403.slice(0, 20),
      jsonParse: summary.jsonParse.slice(0, 20),
    }
  );

  console.log(JSON.stringify(summary, null, 2));
  await browser.close();

  const hard =
    summary.matrixFail > 0 ||
    summary.http500.length > 0 ||
    summary.http403.length > 0 ||
    summary.jsonParse.length > 0;
  process.exit(hard ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  writeFileSync(join(OUT, "fatal-error.json"), JSON.stringify({ error: String(err), stack: err?.stack }, null, 2));
  process.exit(1);
});
