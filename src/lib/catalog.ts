import { formatMoney as formatCurrency, isCurrency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n/config";

export type StoreVariant = {
  id: string;
  name: string;
  sku: string;
  /** Price in ILS agorot (minor units). */
  price: number;
  compareAt?: number;
  stock: number;
};

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  descriptionHe?: string;
  category: string;
  /** All category slugs linked to the product (families + merchandising). */
  categorySlugs?: string[];
  concentration?: "edp" | "extrait";
  featured?: boolean;
  newArrival?: boolean;
  /** ISO timestamp used to auto-expire the NEW badge after 30 days. */
  createdAt?: string;
  notes?: string[];
  images: string[];
  variants: StoreVariant[];
};

export type StoreCategory = {
  slug: string;
  name: string;
  description: string;
};

/** Live atelier catalogue — seeded to production and shown when the database is reachable. */
export const atelierProducts: StoreProduct[] = [
  {
    id: "p-notre-dame",
    slug: "notre-dame",
    name: "Notre-Dame",
    brand: "Filippo Sorcinelli",
    description:
      "Memento Extrait — Notre-Dame 15.4.2019. An artistic incense composition inspired by the cathedral after the fire: smoke, wet stone, precious woods and a thread of light.",
    descriptionHe:
      "Notre-Dame 15.4.2019 מבית Filippo Sorcinelli (סדרת Memento, Extrait) הוא ניחוח יוניסקס אמנותי בהשראת קתדרלת נוטרדאם והשריפה מ־15 באפריל 2019. האווירה שאחרי השריפה — עשן וקטורת, עץ, אבן לחה וקרני אור — מתורגמת לניחוח עמוק, מסתורי ומדיטטיבי.",
    category: "woody",
    concentration: "extrait",
    featured: true,
    newArrival: true,
    notes: ["Incense", "Galbanum", "Amber"],
    images: ["/products/notre-dame.jpg"],
    variants: [
      { id: "v-notre-1", name: "1 ml", sku: "FS-ND-1", price: 3200, stock: 40 },
      { id: "v-notre-3", name: "3 ml", sku: "FS-ND-3", price: 7900, stock: 30 },
      { id: "v-notre-5", name: "5 ml", sku: "FS-ND-5", price: 11900, stock: 24 },
      { id: "v-notre-10", name: "10 ml", sku: "FS-ND-10", price: 21900, stock: 18 },
    ],
  },
];

/** Offline / test fixtures. Production seed deletes these if present. */
export const demoProducts: StoreProduct[] = [
  {
    id: "p-amber-veil",
    slug: "amber-veil",
    name: "Amber Veil",
    brand: "Maison Sol",
    description:
      "A warm, enveloping composition of amber resin, vanilla absolute and dry cedar. Elegant, intimate and designed to linger.",
    descriptionHe:
      "קומפוזיציה חמה ועוטפת של שרף אמבר, וניל אבסולוט וארז יבש. אלגנטית, אינטימית ונועדה להישאר.",
    category: "amber",
    featured: true,
    newArrival: true,
    notes: ["Labdanum", "Vanilla absolute", "Dry cedar"],
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1200&q=85",
    ],
    variants: [
      { id: "v-amber-50", name: "50 ml", sku: "MS-AV-50", price: 62496, stock: 12 },
      { id: "v-amber-2", name: "2 ml sample", sku: "MS-AV-2", price: 4464, stock: 40 },
    ],
  },
  {
    id: "p-fig-nocturne",
    slug: "fig-nocturne",
    name: "Fig Nocturne",
    brand: "Atelier Nox",
    description:
      "Green fig leaves meet creamy sandalwood and mineral musk in a modern, understated eau de parfum.",
    descriptionHe:
      "עלי תאנה ירוקים פוגשים סנדלווד קרמי ומאסק מינרלי באו דה פרפיום מודרני ומאופק.",
    category: "woody",
    featured: true,
    notes: ["Fig leaf", "Sandalwood", "Mineral musk"],
    images: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?auto=format&fit=crop&w=1200&q=85",
    ],
    variants: [{ id: "v-fig-75", name: "75 ml", sku: "AN-FN-75", price: 71424, stock: 8 }],
  },
  {
    id: "p-iris-paper",
    slug: "iris-paper",
    name: "Iris Paper",
    brand: "Éditions Sillage",
    description:
      "Powdered iris, clean linen and pale woods. A quiet skin scent with a refined, textural finish.",
    descriptionHe: "איריס אביק, פשתן נקי ועצים בהירים. ניחוח עור שקט עם סיום מרקמי ומדויק.",
    category: "floral",
    newArrival: true,
    notes: ["Iris", "Rose petal", "Ambrette"],
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1200&q=85",
    ],
    variants: [
      { id: "v-iris-50", name: "50 ml", sku: "ES-IP-50", price: 57288, compareAt: 66960, stock: 6 },
    ],
  },
  {
    id: "p-citrus-archive",
    slug: "citrus-archive",
    name: "Citrus Archive",
    brand: "Studio Orangerie",
    description:
      "Bergamot peel, neroli and bitter orange over vetiver. Bright at first, softly smoky as it dries down.",
    descriptionHe:
      "קליפת ברגמוט, נרולי ותפוז מר מעל וטיבר. בהיר בהתחלה, מעושן בעדינות בייבוש.",
    category: "citrus",
    newArrival: true,
    notes: ["Bergamot", "Neroli", "Vetiver"],
    images: [
      "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=1200&q=85",
    ],
    variants: [{ id: "v-citrus-100", name: "100 ml", sku: "SO-CA-100", price: 65472, stock: 15 }],
  },
  {
    id: "p-salt-rose",
    slug: "salt-rose",
    name: "Salt Rose",
    brand: "North Coast",
    description: "A translucent rose carried by sea salt, ambrette and sun-warmed driftwood.",
    descriptionHe: "ורד שקוף הנישא על מלח ים, אמברט ועץ צף שחומם בשמש.",
    category: "floral",
    featured: true,
    notes: ["Iris", "Rose petal", "Ambrette"],
    images: ["https://images.unsplash.com/photo-1610461888750-10bfc601b874?auto=format&fit=crop&w=1200&q=85"],
    variants: [{ id: "v-salt-50", name: "50 ml", sku: "NC-SR-50", price: 53940, stock: 0 }],
  },
  {
    id: "p-cedar-after-rain",
    slug: "cedar-after-rain",
    name: "Cedar After Rain",
    brand: "Maison Sol",
    description: "Wet cedar, black tea and moss: cool, meditative and quietly persistent.",
    descriptionHe: "ארז רטוב, תה שחור וטחב: קריר, מדיטטיבי ומתמיד בשקט.",
    category: "woody",
    notes: ["Fig leaf", "Sandalwood", "Mineral musk"],
    images: ["https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=85"],
    variants: [{ id: "v-cedar-50", name: "50 ml", sku: "MS-CR-50", price: 60264, stock: 10 }],
  },
];

/** @deprecated Use listStoreProducts() — kept as the offline fallback catalogue. */
export const fallbackProducts: StoreProduct[] = [...atelierProducts, ...demoProducts];
export const products = fallbackProducts;

export const categories: StoreCategory[] = [
  { slug: "all", name: "All fragrances", description: "The complete collection." },
  { slug: "amber", name: "Gourmand", description: "Vanilla, cocoa, caramel and rich sweet accords." },
  { slug: "woody", name: "Clean", description: "Soft musk, linen and bright skin-light notes." },
  { slug: "floral", name: "Floral", description: "Modern petals, iris and expressive rose." },
  { slug: "citrus", name: "Dominant", description: "Bold presence, depth and lasting projection." },
  { slug: "back-in-stock", name: "Back In Stock", description: "Recently restocked fragrances." },
  { slug: "testers-refills", name: "Testers / Refills", description: "Testers and refill formats." },
  {
    slug: "additional-products",
    name: "Additional Products",
    description: "Complementary products beyond the core collection.",
  },
];

export function getProduct(slug: string) {
  return fallbackProducts.find((product) => product.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function localizedDescription(product: StoreProduct, locale: Locale) {
  if (locale === "he" && product.descriptionHe) return product.descriptionHe;
  return product.description;
}

export function formatMoney(amount: number, currency = "ILS") {
  const normalized = currency.toUpperCase();
  return formatCurrency(amount, isCurrency(normalized) ? normalized : "ILS");
}
