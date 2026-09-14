import { formatMoney as formatCurrency, isCurrency } from "@/lib/currency";

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
  category: string;
  concentration?: "edp" | "extrait";
  featured?: boolean;
  newArrival?: boolean;
  images: string[];
  variants: StoreVariant[];
};

export const products: StoreProduct[] = [
  {
    id: "p-amber-veil",
    slug: "amber-veil",
    name: "Amber Veil",
    brand: "Maison Sol",
    description:
      "A warm, enveloping composition of amber resin, vanilla absolute and dry cedar. Elegant, intimate and designed to linger.",
    category: "amber",
    featured: true,
    newArrival: true,
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
    category: "woody",
    featured: true,
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
    category: "floral",
    newArrival: true,
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
    category: "citrus",
    newArrival: true,
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
    description:
      "A translucent rose carried by sea salt, ambrette and sun-warmed driftwood.",
    category: "floral",
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1610461888750-10bfc601b874?auto=format&fit=crop&w=1200&q=85",
    ],
    variants: [{ id: "v-salt-50", name: "50 ml", sku: "NC-SR-50", price: 53940, stock: 0 }],
  },
  {
    id: "p-cedar-after-rain",
    slug: "cedar-after-rain",
    name: "Cedar After Rain",
    brand: "Maison Sol",
    description:
      "Wet cedar, black tea and moss: cool, meditative and quietly persistent.",
    category: "woody",
    images: [
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=85",
    ],
    variants: [{ id: "v-cedar-50", name: "50 ml", sku: "MS-CR-50", price: 60264, stock: 10 }],
  },
  {
    id: "p-notre-dame",
    slug: "notre-dame",
    name: "Notre-Dame",
    brand: "Filippo Sorcinelli",
    description:
      "Memento Extrait — Notre-Dame 15.4.2019. An artistic incense composition inspired by the cathedral after the fire: smoke, wet stone, precious woods and a thread of light.",
    category: "woody",
    concentration: "extrait",
    featured: true,
    newArrival: true,
    images: ["/products/notre-dame.jpg"],
    variants: [
      { id: "v-notre-1", name: "1 ml", sku: "FS-ND-1", price: 3200, stock: 40 },
      { id: "v-notre-3", name: "3 ml", sku: "FS-ND-3", price: 7900, stock: 30 },
      { id: "v-notre-5", name: "5 ml", sku: "FS-ND-5", price: 11900, stock: 24 },
      { id: "v-notre-10", name: "10 ml", sku: "FS-ND-10", price: 21900, stock: 18 },
    ],
  },
];

export const categories = [
  { slug: "all", name: "All fragrances", description: "The complete Privé collection." },
  { slug: "amber", name: "Amber", description: "Warm resins, woods and golden vanilla." },
  { slug: "woody", name: "Woody", description: "Cedar, sandalwood and atmospheric forest notes." },
  { slug: "floral", name: "Floral", description: "Modern petals, iris and expressive rose." },
  { slug: "citrus", name: "Citrus", description: "Luminous bergamot, neroli and bitter orange." },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function formatMoney(amount: number, currency = "ILS") {
  const normalized = currency.toUpperCase();
  return formatCurrency(amount, isCurrency(normalized) ? normalized : "ILS");
}
