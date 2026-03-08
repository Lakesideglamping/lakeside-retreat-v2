"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en-NZ">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#faf4f5",
          color: "#302e41",
          lineHeight: 1.6,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 520 }}>
          <h1
            style={{
              fontFamily:
                "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              fontSize: "2rem",
              color: "#2d5a5a",
              marginBottom: "0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.05rem", marginBottom: "2rem" }}>
            We&apos;re sorry, an unexpected error has occurred. Please try again
            or return to the homepage.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                marginBottom: "1.5rem",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.75rem",
                backgroundColor: "#2d5a5a",
                color: "#fff",
                border: "none",
                borderRadius: "9999px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: "0.75rem 1.75rem",
                border: "2px solid #2d5a5a",
                color: "#2d5a5a",
                borderRadius: "9999px",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
