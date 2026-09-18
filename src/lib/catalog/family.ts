import { toSlug } from "@/lib/catalog/slug";

/** Storefront olfactive family slugs (labels: Gourmand / Clean / Floral / Dominant). */
export const FAMILY_CATEGORY_SLUGS = ["amber", "woody", "floral", "citrus"] as const;

export type FamilyCategorySlug = (typeof FAMILY_CATEGORY_SLUGS)[number];

const ALIASES: Record<string, FamilyCategorySlug> = {
  amber: "amber",
  gourmand: "amber",
  gourmani: "amber",
  "גורמני": "amber",
  woody: "woody",
  clean: "woody",
  naki: "woody",
  "נקי": "woody",
  floral: "floral",
  flower: "floral",
  "פרחוני": "floral",
  citrus: "citrus",
  dominant: "citrus",
  "דומיננטי": "citrus",
};

const SCORE_WORDS: Record<FamilyCategorySlug, string[]> = {
  amber: [
    "gourmand",
    "vanilla",
    "caramel",
    "cocoa",
    "chocolate",
    "cream",
    "creamy",
    "biscuit",
    "pastry",
    "sweet",
    "raspberry",
    "strawberry",
    "tonka",
    "גורמני",
    "וניל",
    "קרמי",
    "מתוק",
    "מתקתק",
    "ביסקוויט",
    "פטל",
    "שוקולד",
    "קרמל",
  ],
  woody: [
    "clean",
    "musk",
    "linen",
    "cotton",
    "fresh",
    "airy",
    "skin",
    "soft",
    "powder",
    "powdery",
    "נקי",
    "מוסק",
    "מאסק",
    "פשתן",
    "רענן",
    "רעננות",
    "אבקתי",
  ],
  floral: [
    "floral",
    "flower",
    "rose",
    "jasmine",
    "iris",
    "violet",
    "lily",
    "petal",
    "blossom",
    "פרחוני",
    "פרח",
    "ורד",
    "יסמין",
    "איריס",
    "סיגלית",
  ],
  citrus: [
    "dominant",
    "bold",
    "powerful",
    "projection",
    "intense",
    "oud",
    "incense",
    "leather",
    "spicy",
    "spice",
    "smoky",
    "citrus",
    "bergamot",
    "דומיננטי",
    "חזק",
    "עוצמתי",
    "עוד",
    "קטורת",
    "עור",
    "מתובל",
    "הדרי",
  ],
};

export function normalizeFamilyCategorySlug(value?: string | null): FamilyCategorySlug | null {
  if (!value?.trim()) return null;
  const raw = value.trim().toLowerCase();
  if (ALIASES[raw]) return ALIASES[raw];
  const slug = toSlug(value);
  if ((FAMILY_CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    return slug as FamilyCategorySlug;
  }
  if (ALIASES[slug]) return ALIASES[slug];
  return null;
}

export function inferFamilyCategory(input: {
  category?: string | null;
  name?: string | null;
  description?: string | null;
  descriptionHe?: string | null;
  notes?: string[] | null;
}): FamilyCategorySlug {
  const explicit = normalizeFamilyCategorySlug(input.category);
  if (explicit) return explicit;

  const haystack = [
    input.name,
    input.description,
    input.descriptionHe,
    ...(input.notes ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const scores: Record<FamilyCategorySlug, number> = {
    amber: 0,
    woody: 0,
    floral: 0,
    citrus: 0,
  };

  for (const family of FAMILY_CATEGORY_SLUGS) {
    for (const word of SCORE_WORDS[family]) {
      if (haystack.includes(word.toLowerCase())) scores[family] += 1;
    }
  }

  let best: FamilyCategorySlug = "amber";
  let bestScore = -1;
  for (const family of FAMILY_CATEGORY_SLUGS) {
    if (scores[family] > bestScore) {
      best = family;
      bestScore = scores[family];
    }
  }
  return bestScore > 0 ? best : "amber";
}
