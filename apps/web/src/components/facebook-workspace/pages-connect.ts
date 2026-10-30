const pagesConnectKey = "facebook-social-connect";

let pagesConnectLatched = false;
let pagesReturnHandled = false;

export function beginFacebookPagesConnect() {
  pagesConnectLatched = true;
  window.sessionStorage.setItem(pagesConnectKey, "pages");
}

export function latchPagesConnect() {
  if (typeof window !== "undefined" && window.sessionStorage.getItem(pagesConnectKey) === "pages") {
    pagesConnectLatched = true;
    window.sessionStorage.removeItem(pagesConnectKey);
  }
  return pagesConnectLatched;
}

export function takePagesConnectForToast() {
  const pagesConnect = latchPagesConnect();
  if (pagesReturnHandled) return { pagesConnect, alreadyHandled: true as const };
  return { pagesConnect, alreadyHandled: false as const };
}

export function markPagesReturnHandled() {
  pagesReturnHandled = true;
}

export function schedulePagesConnectReset() {
  const timer = window.setTimeout(() => {
    pagesConnectLatched = false;
    pagesReturnHandled = false;
  }, 0);
  return () => window.clearTimeout(timer);
}
