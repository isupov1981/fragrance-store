import { CinematicBand } from "@/components/home/cinematic-band";
import { CollectionPair } from "@/components/home/collection-pair";
import { EditorialTrio } from "@/components/home/editorial-trio";
import { FeaturedStory } from "@/components/home/featured-story";
import { HomeHero } from "@/components/home/home-hero";
import { HomeTrust } from "@/components/home/home-trust";
import { PerfumerSpotlight } from "@/components/home/perfumer-spotlight";
import { ProductCarousel } from "@/components/home/product-carousel";
import { Reveal } from "@/components/home/reveal";
import type { Metadata } from "next";
import { products } from "@/lib/catalog";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: { absolute: dict.meta.title },
    description: dict.meta.description,
    alternates: {
      canonical: localizedPath(lang, "/"),
      languages: {
        en: localizedPath("en", "/"),
        he: localizedPath("he", "/"),
        "x-default": localizedPath("en", "/"),
      },
    },
  };
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  const arrivals = products.filter((product) => product.newArrival);
  const cabinet = [...products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  return (
    <main id="main-content">
      <HomeHero />

      <Reveal>
        <ProductCarousel
          eyebrow={dict.home.newEyebrow}
          title={dict.home.newTitle}
          description={dict.home.newCopy}
          href="/collections/all?edit=new"
          linkLabel={dict.home.newLink}
          products={cabinet}
        />
      </Reveal>

      <Reveal>
        <EditorialTrio />
      </Reveal>

      <Reveal>
        <ProductCarousel
          eyebrow={dict.home.curatorEyebrow}
          title={dict.home.curatorTitle}
          description={dict.home.curatorCopy}
          href="/collections/all?edit=featured"
          linkLabel={dict.home.curatorLink}
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
      <HomeTrust />
    </main>
  );
}
