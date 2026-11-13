export const OPEN_COOKIE_SETTINGS_EVENT = "nisc:open-cookie-settings";

/** Reopens the existing cookie banner so a saved choice can be changed. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
