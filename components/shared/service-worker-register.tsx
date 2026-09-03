"use client";

import * as React from "react";

// Registers public/sw.js. Standard §7: "MUST register the service worker only on intended
// production origins and environments" and "MUST handle registration failure without breaking
// the web application" — guarded behind NODE_ENV so local dev/preview never gets a stale cached
// service worker fighting the dev server's hot reload, and every failure path is caught and
// swallowed (a missing/broken service worker must never throw into the app itself, it's a pure
// enhancement).
export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[ServiceWorkerRegister] registration failed:", err);
    });
  }, []);

  return null;
}
