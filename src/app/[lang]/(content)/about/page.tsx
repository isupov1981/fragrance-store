import type { Metadata } from "next";
import Image from "next/image";
import { ContentPage, ProseSection } from "@/components/ui/content-page";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).about.title };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return (
    <ContentPage eyebrow={dict.about.eyebrow} title={dict.about.heading} intro={dict.about.intro}>
      <div className="mb-16 grid gap-4 sm:grid-cols-[1.25fr_.75fr]">
        <div className="relative aspect-[16/11] overflow-hidden bg-stone">
          <Image className="object-cover" src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1400&q=85" alt={dict.about.image1} fill sizes="70vw" />
        </div>
        <div className="relative hidden overflow-hidden bg-stone sm:block">
          <Image className="object-cover" src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=900&q=85" alt={dict.about.image2} fill sizes="30vw" />
        </div>
      </div>
      <ProseSection title={dict.about.slow}>
        <p>{dict.about.slow1}</p>
        <p>{dict.about.slow2}</p>
      </ProseSection>
      <ProseSection title={dict.about.shared}>
        <p>{dict.about.shared1}</p>
      </ProseSection>
    </ContentPage>
  );
}
