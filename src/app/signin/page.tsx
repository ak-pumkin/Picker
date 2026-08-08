"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");

  return (
    <main style={{ padding: 40, maxWidth: 420 }}>
      <h1 style={{ fontSize: 22 }}>Sign in to Picker</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={btnStyle}
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          style={btnStyle}
        >
          Continue with GitHub
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...btnStyle, flex: 1 }}
          />
          <button
            onClick={() => signIn("nodemailer", { email, callbackUrl: "/" })}
            style={btnStyle}
          >
            Email me a link
          </button>
        </div>
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "#f3f3f6",
};
