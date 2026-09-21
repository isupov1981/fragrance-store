"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32, background: "#fff", color: "#111" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>This page couldn’t load</h1>
        <p style={{ marginBottom: 16 }}>Reload to try again, or go back.</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "#f5f5f5",
            padding: 16,
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.45,
            maxWidth: 900,
          }}
        >
          {error?.message || "Unknown error"}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
          {error?.stack ? `\n\n${error.stack}` : ""}
        </pre>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: "#111", color: "#fff", border: 0, padding: "10px 18px", cursor: "pointer" }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.href = "/";
            }}
            style={{ background: "#fff", color: "#111", border: "1px solid #ccc", padding: "10px 18px", cursor: "pointer" }}
          >
            Back
          </button>
        </div>
      </body>
    </html>
  );
}
