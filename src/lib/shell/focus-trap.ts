/**
 * Shared focus utilities for shell overlays (Drawer, DetailPanel, mobile Sidebar).
 * P1-B4 — keyboard containment without inventing domain behaviour.
 */

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function listFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (el.closest("[inert]")) return false;
    // offsetParent is null for fixed/sticky in some cases — also allow visibility check
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    return true;
  });
}

/** Keep Tab/Shift+Tab cycling inside `root` while an overlay is open. */
export function handleFocusTrapKeydown(event: KeyboardEvent, root: HTMLElement | null): void {
  if (!root || event.key !== "Tab") return;
  const items = listFocusable(root);
  if (items.length === 0) {
    event.preventDefault();
    root.focus?.();
    return;
  }
  const first = items[0]!;
  const last = items[items.length - 1]!;
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey) {
    if (!active || active === first || !root.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (!active || active === last || !root.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

export function focusFirst(root: HTMLElement | null): void {
  const items = listFocusable(root);
  (items[0] ?? root)?.focus?.();
}
