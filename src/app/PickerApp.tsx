"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useSession, signIn, signOut } from "next-auth/react";
import { APP_SHELL_HTML } from "./appShell";
import { APP_SCRIPT_SOURCE } from "./appScript";
import { BRIDGE_SCRIPT_SOURCE } from "./appBridge";

export default function PickerApp() {
  const { data: session, status } = useSession();
  const [libsLoaded, setLibsLoaded] = useState(0);
  const mounted = useRef(false);

  // Load the app + bridge scripts once, only after the QR/confetti/PDF CDN
  // libraries and the shell markup are both in the DOM.
  useEffect(() => {
    if (libsLoaded < 3) return;
    if ((window as any).__PICKER_APP_LOADED__) return;
    (window as any).__PICKER_APP_LOADED__ = true;

    const appScriptEl = document.createElement("script");
    appScriptEl.textContent = APP_SCRIPT_SOURCE;
    document.body.appendChild(appScriptEl);

    const bridgeScriptEl = document.createElement("script");
    bridgeScriptEl.textContent = BRIDGE_SCRIPT_SOURCE;
    document.body.appendChild(bridgeScriptEl);
  }, [libsLoaded]);

  // Keep window.__pickerAuth in sync with the real Auth.js session, and let
  // the vanilla app react to it (pull data on sign-in, refresh the Settings
  // page if the person is looking at it when status changes).
  useEffect(() => {
    (window as any).__pickerAuth = {
      status,
      name: session?.user?.name ?? null,
      email: session?.user?.email ?? null,
      signIn: (provider: string) => signIn(provider, { callbackUrl: "/" }),
      signOut: () => signOut({ callbackUrl: "/" }),
    };
    (window as any).__pickerRenderAuthSection?.();
    if (status === "authenticated" && !mounted.current) {
      mounted.current = true;
      (window as any).__pickerPullSync?.();
    }
  }, [status, session]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/canvas-confetti/1.9.2/confetti.browser.min.js"
        strategy="afterInteractive"
        onLoad={() => setLibsLoaded((c) => c + 1)}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        strategy="afterInteractive"
        onLoad={() => setLibsLoaded((c) => c + 1)}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setLibsLoaded((c) => c + 1)}
      />
      <div dangerouslySetInnerHTML={{ __html: APP_SHELL_HTML }} />
    </>
  );
}
