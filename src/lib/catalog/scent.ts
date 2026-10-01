export const OCCASIONS = ["daily", "evening", "signature", "gift"] as const;
export const SEASONS = ["all", "warm", "cool"] as const;
export const SILLAGES = ["intimate", "moderate", "bold"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type Season = (typeof SEASONS)[number];
export type Sillage = (typeof SILLAGES)[number];

export type NotePyramid = {
  top: string[];
  heart: string[];
  base: string[];
};

export type ScentFacts = {
  notes: string[];
  pyramid?: NotePyramid;
  occasion?: Occasion;
  season?: Season;
  sillage?: Sillage;
};

type EditorialScent = {
  pyramid?: NotePyramid;
  notes?: string[];
  occasion?: Occasion;
  season?: Season;
  sillage?: Sillage;
};

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function asNotes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function uniqueNotes(notes: string[]) {
  return [...new Set(notes)];
}

/** Reads a legacy string array or a pyramid object stored in Product.notes. */
export function parseNotesField(value: unknown): ScentFacts {
  if (Array.isArray(value)) return { notes: asNotes(value) };
  if (!value || typeof value !== "object") return { notes: [] };

  const record = value as Record<string, unknown>;
  const top = asNotes(record.top);
  const heart = asNotes(record.heart);
  const base = asNotes(record.base);
  const listed = asNotes(record.notes);
  const pyramid = top.length || heart.length || base.length ? { top, heart, base } : undefined;
  const notes = listed.length ? listed : uniqueNotes([...top, ...heart, ...base]);

  return {
    notes,
    pyramid,
    occasion: isOneOf(record.occasion, OCCASIONS) ? record.occasion : undefined,
    season: isOneOf(record.season, SEASONS) ? record.season : undefined,
    sillage: isOneOf(record.sillage, SILLAGES) ? record.sillage : undefined,
  };
}

/**
 * Labels follow each fragrance's own description.
 * A notes object on the product overrides the matching field.
 */
const scentProfiles: Record<string, EditorialScent> = {
  "notre-dame": { occasion: "evening", season: "all", sillage: "moderate" },
  "amber-veil": { occasion: "evening", season: "cool", sillage: "intimate" },
  "fig-nocturne": { occasion: "evening", season: "warm", sillage: "moderate" },
  "iris-paper": { occasion: "daily", season: "all", sillage: "intimate" },
  "citrus-archive": { occasion: "daily", season: "warm", sillage: "moderate" },
  "salt-rose": { occasion: "daily", season: "warm", sillage: "moderate" },
  "cedar-after-rain": { occasion: "daily", season: "cool", sillage: "intimate" },
  "anfas-ishq": { occasion: "evening", season: "all", sillage: "moderate" },
  "zoologist-rabbit": { occasion: "daily", season: "all", sillage: "intimate" },
  "le-labo-santal-33": {
    occasion: "signature",
    season: "all",
    sillage: "moderate",
    pyramid: {
      top: [],
      heart: ["Sandalwood", "Cedar", "Cardamom", "Iris", "Violet", "Leather"],
      base: [],
    },
  },
  "couleur-primaire": { occasion: "daily", season: "all", sillage: "intimate" },
  "fugazzi-angel-dust": {
    occasion: "evening",
    season: "all",
    sillage: "intimate",
    pyramid: {
      top: [],
      heart: ["Cashmeran", "Bergamot", "Pepper", "Translucent woods", "White amber"],
      base: [],
    },
  },
  "fugazzi-goudh": {
    occasion: "evening",
    season: "cool",
    sillage: "bold",
    notes: ["Oud", "Deep woods", "Leather", "Smoke"],
  },
  "matiere-premiere-vanilla-powder": {
    occasion: "daily",
    season: "all",
    sillage: "moderate",
    pyramid: {
      top: [],
      heart: ["Madagascar vanilla absolute", "Coconut powder", "Palo Santo", "White musk"],
      base: [],
    },
  },
  "thoo-doux-ennui": {
    occasion: "evening",
    season: "all",
    sillage: "moderate",
    pyramid: {
      top: ["Apricot jam", "Mandarin", "Ylang-ylang"],
      heart: ["Peach", "Salted butter", "Ylang-ylang"],
      base: ["Vanilla", "Osmanthus", "Benzoin", "Amber", "Musk"],
    },
  },
  "thoo-lexplicite": {
    occasion: "evening",
    season: "all",
    sillage: "bold",
    pyramid: {
      top: ["Lemon zest", "Ylang-ylang"],
      heart: ["Banana bread", "Peanut butter", "Warm spices"],
      base: ["Violet", "Amber", "Fruity musk"],
    },
  },
  "trussardi-champaca-edizione-millesimata": {
    occasion: "evening",
    season: "all",
    sillage: "moderate",
    pyramid: {
      top: ["Lemon blossom", "Magnolia", "Freesia"],
      heart: ["Praline accord", "Red champaca", "Hazelnut"],
      base: ["Vanilla", "Heliotrope", "White woods"],
    },
  },
  "tiziana-terenzi-halley": {
    occasion: "evening",
    season: "warm",
    sillage: "bold",
    pyramid: {
      top: ["Passionfruit", "Peach", "Lemon", "Blackcurrant"],
      heart: [],
      base: ["Vanilla", "Musk", "Amber"],
    },
  },
  "theodoros-kalotinis-marzipan-gourmand": {
    occasion: "daily",
    season: "cool",
    sillage: "moderate",
    notes: ["Marzipan", "Almonds"],
  },
  "theodoros-kalotinis-tiramisu": {
    occasion: "daily",
    season: "cool",
    sillage: "moderate",
    notes: ["Coffee", "Cocoa", "Sweet cream"],
  },
  "theodoros-kalotinis-creme-brulee": {
    occasion: "daily",
    season: "cool",
    sillage: "moderate",
    notes: ["Vanilla", "Rich cream", "Caramelized sugar"],
  },
  "xerjoff-cruz-del-sur-ii": {
    occasion: "daily",
    season: "warm",
    sillage: "moderate",
    pyramid: {
      top: ["Mango", "Guava", "Pineapple"],
      heart: ["Exotic flowers", "Blackcurrant", "Violet leaf"],
      base: ["Milk", "Dried fruits", "Musk", "Vetiver", "Cedar"],
    },
  },
  "floraiku-one-umbrella-for-two": {
    occasion: "daily",
    season: "cool",
    sillage: "moderate",
    notes: ["Blueberry", "Genmaicha tea", "Rice cookie accord"],
  },
};

export function resolveScent(product: {
  slug: string;
  notes?: string[];
  pyramid?: NotePyramid;
  occasion?: Occasion;
  season?: Season;
  sillage?: Sillage;
}): ScentFacts {
  const editorial = scentProfiles[product.slug];
  const editorialPyramid = editorial?.pyramid;
  const editorialNotes = new Set(
    editorialPyramid ? [...editorialPyramid.top, ...editorialPyramid.heart, ...editorialPyramid.base] : [],
  );
  const storedMatchesPyramid = (product.notes ?? []).every((note) => editorialNotes.has(note));
  const pyramid = product.pyramid ?? (storedMatchesPyramid ? editorialPyramid : undefined);
  const notes = product.notes?.length
    ? product.notes
    : pyramid
      ? uniqueNotes([...pyramid.top, ...pyramid.heart, ...pyramid.base])
      : (editorial?.notes ?? []);

  return {
    notes,
    pyramid,
    occasion: product.occasion ?? editorial?.occasion,
    season: product.season ?? editorial?.season,
    sillage: product.sillage ?? editorial?.sillage,
  };
}
