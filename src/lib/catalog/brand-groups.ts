export type StoreBrand = {
  name: string;
  slug: string;
};

export type BrandLetterGroup = {
  letter: string;
  label: string;
  brands: StoreBrand[];
};

export function brandIndexLetter(name: string): string {
  const ch = name.trim().charAt(0).toLocaleUpperCase("en-US");
  if (ch >= "0" && ch <= "9") return "0-9";
  if (ch >= "A" && ch <= "Z") return ch;
  return "#";
}

export function groupBrandsByLetter(brands: StoreBrand[]): BrandLetterGroup[] {
  const groups = new Map<string, StoreBrand[]>();
  for (const brand of brands) {
    const letter = brandIndexLetter(brand.name);
    const bucket = groups.get(letter) ?? [];
    bucket.push(brand);
    groups.set(letter, bucket);
  }

  const order = (letter: string) => {
    if (letter === "0-9") return 0;
    if (letter === "#") return 1000;
    return letter.charCodeAt(0);
  };

  return [...groups.entries()]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([letter, items]) => ({
      letter,
      label: letter === "0-9" || letter === "#" ? letter : `${letter} — Brands`,
      brands: items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    }));
}
