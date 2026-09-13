import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { products } from "@/lib/catalog";

export default function Home() {
  const featured = products.filter((product) => product.featured);
  const arrivals = products.filter((product) => product.newArrival);

  return (
    <main id="main-content">
      <section className="relative min-h-[620px] overflow-hidden bg-ink sm:min-h-[700px] lg:min-h-[calc(100svh-128px)]">
        <Image className="object-cover object-[58%_center] opacity-75" src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=2000&q=90" alt="" fill sizes="100vw" priority />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,21,17,.72)_0%,rgba(25,21,17,.25)_55%,rgba(25,21,17,.08)_100%)]" />
        <div className="shell relative flex min-h-[620px] items-end py-16 text-ivory sm:min-h-[700px] sm:py-24 lg:min-h-[calc(100svh-128px)] lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 text-ivory/75">The private collection · 2026</p>
            <h1 className="font-display text-[3.5rem] leading-[.9] tracking-[-0.035em] sm:text-7xl lg:text-[6.5rem]">
              Rare fragrance,<br /><em className="font-normal">intimately</em> chosen.
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-ivory/80 sm:text-base">Singular compositions for those who prefer to be remembered, never announced.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="inline-flex h-13 items-center bg-ivory px-7 text-[11px] font-semibold uppercase tracking-[0.17em] text-ink transition hover:bg-sand" href="/collections/all">Explore the collection</Link>
              <Link className="inline-flex h-13 items-center border border-ivory/50 px-7 text-[11px] font-semibold uppercase tracking-[0.17em] transition hover:bg-ivory hover:text-ink" href="/about">Our point of view</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-20 sm:py-28 lg:py-36" aria-labelledby="featured-heading">
        <div id="featured-heading">
          <SectionHeading eyebrow="The curator's edit" title="Objects of desire" description="Distinctive signatures, selected for their craft, character and beautiful evolution on skin." href="/collections/all?edit=featured" />
        </div>
        <div className="grid snap-x auto-cols-[82%] grid-flow-col gap-4 overflow-x-auto pb-5 sm:auto-cols-[46%] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible">
          {featured.map((product, index) => <div className="snap-start" key={product.id}><ProductCard product={product} priority={index === 0} /></div>)}
        </div>
      </section>

      <section className="grid min-h-[680px] bg-sand/50 lg:grid-cols-2">
        <div className="relative min-h-[430px] lg:min-h-full">
          <Image className="object-cover" src="https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=1400&q=88" alt="Perfume flacon in warm atelier light" fill sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="flex items-center px-6 py-16 sm:px-12 lg:px-20 xl:px-28">
          <div className="max-w-lg">
            <p className="eyebrow text-bronze">The art of selection</p>
            <h2 className="mt-5 font-display text-5xl leading-[.98] sm:text-6xl">Nothing ordinary enters the atelier.</h2>
            <p className="mt-7 text-sm leading-7 text-ink/70">We seek independent perfumers, exceptional raw materials and ideas with the courage to unfold slowly. Each fragrance is worn, revisited and considered before joining our collection.</p>
            <Link className="text-link mt-9" href="/about">Step inside the atelier <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="shell py-20 sm:py-28 lg:py-36" aria-labelledby="arrivals-heading">
        <div id="arrivals-heading"><SectionHeading eyebrow="Just arrived" title="New in the cabinet" href="/collections/all?edit=new" /></div>
        <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {arrivals.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-stone/55">
        <div className="shell grid gap-px py-14 sm:grid-cols-3 sm:py-20">
          {[
            ["01", "Curated with intention", "Every composition is worn and evaluated by our atelier."],
            ["02", "The ritual, complete", "Each order includes samples chosen to complement your selection."],
            ["03", "A quieter luxury", "Considered packaging, personal service and worldwide delivery."],
          ].map(([number, title, copy]) => (
            <article className="border-ink/10 py-7 sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0" key={number}>
              <span className="font-display text-lg text-bronze">{number}</span>
              <h2 className="mt-4 font-display text-2xl">{title}</h2>
              <p className="mt-3 text-xs leading-6 text-ink/60">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
