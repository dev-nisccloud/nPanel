/**
 * One top bar for the whole site. The element lives outside #root, so React
 * never recreates it. A load that is already running is left alone.
 */
const LOADER_ID = "app-loader";

function loaderElement() {
  return document.getElementById(LOADER_ID);
}

export function startPageLoader() {
  const el = loaderElement();
  if (!el || el.classList.contains("is-running")) return;
  el.classList.remove("is-done", "is-leaving");
  void el.offsetWidth;
  el.classList.add("is-running");
}

export function finishPageLoader() {
  const el = loaderElement();
  if (!el || !el.classList.contains("is-running") || el.classList.contains("is-done")) return;
  // A page that was ready before the bar faded in should not flash one at the end.
  if (getComputedStyle(el).opacity === "0") {
    el.classList.remove("is-running");
    return;
  }
  el.classList.add("is-done");
  window.setTimeout(() => {
    el.classList.add("is-leaving");
    window.setTimeout(() => {
      el.classList.remove("is-running", "is-done", "is-leaving");
    }, 180);
  }, 160);
}
