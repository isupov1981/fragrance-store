export function toSlug(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `item-${Array.from(value, (char) => char.codePointAt(0)?.toString(16)).join("-")}`;
}
