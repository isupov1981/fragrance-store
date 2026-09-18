/** Catalogue photos that should skip next/image optimization (CDN / local media). */
export function isUnoptimizedCatalogImage(url?: string | null) {
  if (!url) return false;
  return (
    url.includes("/api/media/") ||
    url.includes("parfums.cloud/") ||
    url.includes("raw.githubusercontent.com/") ||
    url.includes("cdn.jsdelivr.net/")
  );
}
