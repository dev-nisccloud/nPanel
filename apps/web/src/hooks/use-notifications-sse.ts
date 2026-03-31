// Deprecated: real-time SSE notifications have been removed.
// This file is kept as a no-op shim to avoid import errors if any legacy code still references it.
export function useNotificationsSSE() {
  return {
    isConnected: false,
    error: null as Error | null,
    reconnect: () => {},
  };
}
