import type { Metadata } from "next";
import Image from "next/image";
import { ContentPage, ProseSection } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Our atelier" };

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Our point of view"
      title="A private edit of modern perfumery."
      intro="PRIVÉ ATELIER was founded on a simple belief: the most compelling fragrance is discovered through attention, not abundance."
    >
      <div className="mb-16 grid gap-4 sm:grid-cols-[1.25fr_.75fr]">
        <div className="relative aspect-[16/11] overflow-hidden bg-stone">
          <Image className="object-cover" src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1400&q=85" alt="A fragrance bottle in the atelier" fill sizes="70vw" />
        </div>
        <div className="relative hidden overflow-hidden bg-stone sm:block">
          <Image className="object-cover" src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=900&q=85" alt="Fragrance details and natural materials" fill sizes="30vw" />
        </div>
      </div>
      <ProseSection title="Chosen slowly">
        <p>Our collection is deliberately concise. We live with each composition before it enters the atelier, observing its opening, its evolution and the trace it leaves hours later.</p>
        <p>We look for clarity of idea, quality of material and an unmistakable point of view—fragrances with presence, never noise.</p>
      </ProseSection>
      <ProseSection title="Shared personally">
        <p>Fragrance is intimate. Our service is designed to be the same: considered recommendations, thoughtful sampling and honest guidance without pressure.</p>
      </ProseSection>
    </ContentPage>
  );
}
