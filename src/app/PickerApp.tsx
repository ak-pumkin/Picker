"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useSession, signIn, signOut } from "next-auth/react";
import { APP_SHELL_HTML } from "./appShell";
import { APP_SCRIPT_SOURCE } from "./appScript";
import { BRIDGE_SCRIPT_SOURCE } from "./appBridge";

export default function PickerApp() {
  const { data: session, status } = useSession();
  const mounted = useRef(false);

  useEffect(() => {
    if ((window as any).__PICKER_APP_LOADED__) return;
    (window as any).__PICKER_APP_LOADED__ = true;

    const appScriptEl = document.createElement("script");
    appScriptEl.textContent = APP_SCRIPT_SOURCE;
    document.body.appendChild(appScriptEl);

    const bridgeScriptEl = document.createElement("script");
    bridgeScriptEl.textContent = BRIDGE_SCRIPT_SOURCE;
    document.body.appendChild(bridgeScriptEl);
  }, []);

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
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        strategy="afterInteractive"
      />
      <div dangerouslySetInnerHTML={{ __html: APP_SHELL_HTML }} />
    </>
  );
}