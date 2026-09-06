const DEFAULT_PROGRESS_BAR_COLOR = "#0a2540";

const owners = new Set<symbol>();

function paint(color: string) {
  document.documentElement.style.setProperty("--bprogress-color", color);
}

/** Keep the top progress bar in sync with the active storefront accent. */
export function applyProgressBarAccent(owner: symbol, accent: string) {
  owners.add(owner);
  paint(accent.trim() || DEFAULT_PROGRESS_BAR_COLOR);
}

export function releaseProgressBarAccent(owner: symbol) {
  owners.delete(owner);
  if (owners.size === 0) {
    document.documentElement.style.removeProperty("--bprogress-color");
  }
}
