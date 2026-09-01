"use client";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f3f7f4", color: "#0c1913", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: 24 }}>
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 32,
              background: "white",
              padding: 32,
              textAlign: "center",
              boxShadow: "0 24px 80px rgba(7,20,15,0.12)",
            }}
          >
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#00b369" }}>
              LBPay
            </p>
            <h1 style={{ margin: "12px 0 0", fontSize: 24, fontWeight: 900 }}>Could not open LBPay</h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "#5a6b63" }}>
              Reload this screen. Your wallet is still there.
            </p>
            <button
              type="button"
              onClick={() => retry()}
              style={{
                marginTop: 24,
                width: "100%",
                height: 44,
                border: 0,
                borderRadius: 999,
                background: "#00b369",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
