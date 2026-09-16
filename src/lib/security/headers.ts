/**
 * Content-Security-Policy helpers.
 * Default mode is Report-Only; set CSP_ENFORCE=true to emit the enforcing header.
 */
export function buildContentSecurityPolicy(nonce: string) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://connect.facebook.net`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com https://connect.facebook.net https://secure.meshulam.co.il https://sandbox.meshulam.co.il https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://secure.meshulam.co.il https://sandbox.meshulam.co.il",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

export function cspHeaderName() {
  return process.env.CSP_ENFORCE === "true"
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";
}

export function buildHstsHeader() {
  const preload = process.env.HSTS_PRELOAD === "true" ? "; preload" : "";
  return `max-age=31536000; includeSubDomains${preload}`;
}
