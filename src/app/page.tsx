import { CinematicBand } from "@/components/home/cinematic-band";
import { CollectionPair } from "@/components/home/collection-pair";
import { EditorialTrio } from "@/components/home/editorial-trio";
import { FeaturedStory } from "@/components/home/featured-story";
import { HomeHero } from "@/components/home/home-hero";
import { PerfumerSpotlight } from "@/components/home/perfumer-spotlight";
import { ProductCarousel } from "@/components/home/product-carousel";
import { Reveal } from "@/components/home/reveal";
import { products } from "@/lib/catalog";

export default function Home() {
  const arrivals = products.filter((product) => product.newArrival);
  const cabinet = [...products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  return (
    <main id="main-content">
      <HomeHero />

      <Reveal>
        <ProductCarousel
          eyebrow="New in the atelier"
          title="What's new"
          description="The latest compositions to enter the cabinet — still unfolding on skin."
          href="/collections/all?edit=new"
          linkLabel="All new arrivals"
          products={cabinet}
        />
      </Reveal>

      <Reveal>
        <EditorialTrio />
      </Reveal>

      <Reveal>
        <ProductCarousel
          eyebrow="Returned to the cabinet"
          title="The curator's edit"
          description="Distinctive signatures, selected for their craft, character and beautiful evolution on skin."
          href="/collections/all?edit=featured"
          linkLabel="View the edit"
          products={arrivals}
        />
      </Reveal>

      <Reveal>
        <CollectionPair />
      </Reveal>

      <Reveal>
        <FeaturedStory />
      </Reveal>

      <Reveal>
        <PerfumerSpotlight />
      </Reveal>

      <CinematicBand />

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
