import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatMoney, getProduct, products } from "@/lib/catalog";
import { productJsonLd } from "@/lib/seo/product-json-ld";

export const revalidate = 3600;

const notes: Record<string, string[]> = {
  amber: ["Labdanum", "Vanilla absolute", "Dry cedar"],
  woody: ["Fig leaf", "Sandalwood", "Mineral musk"],
  floral: ["Iris", "Rose petal", "Ambrette"],
  citrus: ["Bergamot", "Neroli", "Vetiver"],
};

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Fragrance not found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — ${product.brand}`,
      description: product.description,
      url: `/products/${product.slug}`,
      images: [{ url: product.images[0], alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = products.filter((item) => item.id !== product.id && (item.category === product.category || item.featured)).slice(0, 3);
  const startingPrice = Math.min(...product.variants.map((variant) => variant.price));

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)).replaceAll("<", "\\u003c"),
        }}
      />
      <div className="shell py-5">
        <nav className="text-[10px] uppercase tracking-[0.14em] text-ink/50" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/">Home</Link></li><li aria-hidden="true">/</li>
            <li><Link href={`/collections/${product.category}`}>{product.category}</Link></li><li aria-hidden="true">/</li>
            <li className="text-ink" aria-current="page">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="shell grid gap-10 pb-20 lg:grid-cols-[1.4fr_.8fr] lg:gap-16 lg:pb-28">
        <div className="grid gap-3 sm:grid-cols-2">
          {product.images.map((image, index) => (
            <div className={`relative aspect-[4/5] overflow-hidden bg-stone ${product.images.length === 1 ? "sm:col-span-2" : ""}`} key={image}>
              <Image
                className="object-cover transition duration-700 hover:scale-[1.015]"
                src={image}
                alt={`${product.name} bottle, view ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 36vw"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-36 lg:self-start">
          <p className="eyebrow text-bronze">{product.brand}</p>
          <h1 className="mt-4 font-display text-5xl leading-none sm:text-6xl">{product.name}</h1>
          <p className="mt-4 text-sm">From {formatMoney(startingPrice)}</p>
          <p className="mt-7 text-sm leading-7 text-ink/70">{product.description}</p>

          <div className="mt-8 border-y border-ink/10 py-6">
            <p className="eyebrow mb-4">The composition</p>
            <div className="grid grid-cols-3 gap-4">
              {(notes[product.category] ?? []).map((note, index) => (
                <div key={note}>
                  <span className="font-display text-lg text-bronze">0{index + 1}</span>
                  <p className="mt-1 text-xs">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <ProductPurchase product={product} />

          <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {[
              ["Wear", "Eau de parfum · A lasting, close-to-skin concentration."],
              ["Delivery", "Complimentary delivery over $250. Presented in our signature wrapping."],
              ["Returns", "Unopened full-size fragrance may be returned within 14 days."],
            ].map(([title, copy]) => (
              <details className="group py-4" key={title}>
                <summary className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.13em]">
                  {title}<span className="text-lg font-light group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="pt-3 text-xs leading-6 text-ink/60">{copy}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <section className="border-t border-ink/10 bg-stone/35 py-20 sm:py-28">
        <div className="shell">
          <SectionHeading eyebrow="Continue exploring" title="You may also enjoy" href={`/collections/${product.category}`} linkLabel={`View ${product.category}`} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
