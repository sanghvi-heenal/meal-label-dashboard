import { toast } from "sonner";

/**
 * Open a URL in a real top-level browser tab.
 *
 * Inside embedded preview iframes (e.g. Lovable preview), some sites like
 * YouTube refuse to load via X-Frame-Options. A normal <a target="_blank">
 * inside the iframe can also be intercepted, leaving users stuck on a
 * "refused to connect" page. This helper:
 *   1. Tries window.open(_blank) first (true new tab when allowed).
 *   2. Falls back to navigating the top-level window (breaks out of iframe).
 *   3. Surfaces a toast if neither works.
 */
export function openExternalUrl(url: string): void {
  if (!url) return;
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      // Defensive: clear opener reference.
      try {
        (win as Window).opener = null;
      } catch {
        /* noop */
      }
      return;
    }
  } catch {
    /* fall through to top-level navigation */
  }

  // Popup blocked or sandboxed: navigate the top-level window so we escape
  // the preview iframe instead of loading inside it.
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch {
    /* cross-origin top access blocked */
  }

  try {
    window.location.href = url;
  } catch {
    toast.error("Couldn't open link", {
      description: "Please copy and paste it manually: " + url,
    });
  }
}

/** React onClick handler that opens a URL externally and stops default nav. */
export const handleExternalClick =
  (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openExternalUrl(url);
  };