/** True when the client prefers text/markdown over text/html. */
export function prefersMarkdown(acceptHeader: string | null) {
  if (!acceptHeader) return false;
  const accept = acceptHeader.toLowerCase();
  if (!accept.includes("text/markdown")) return false;

  const quality = (type: string) => {
    const re = new RegExp(`${type}\\s*(?:;\\s*q=([0-9.]+))?`);
    const match = re.exec(accept);
    if (!match) return 0;
    return match[1] ? Number(match[1]) : 1;
  };

  const markdownQ = quality("text\\/markdown");
  const htmlQ = quality("text\\/html");
  if (markdownQ <= 0) return false;
  if (htmlQ <= 0) return true;
  return markdownQ >= htmlQ;
}
