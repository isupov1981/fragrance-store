import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { ContentPage } from "@/components/ui/content-page";
import { ContactForm } from "@/components/contact/contact-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).contact.title };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return (
    <ContentPage eyebrow={dict.contact.eyebrow} title={dict.contact.heading} intro={dict.contact.intro}>
      <div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr]">
        <aside className="space-y-8">
          <div className="flex gap-4"><Mail className="mt-0.5 text-bronze" aria-hidden="true" size={18} /><div><h2 className="eyebrow">{dict.contact.email}</h2><a className="mt-2 block text-sm" href="mailto:concierge@the-perfume-room.example">concierge@the-perfume-room.example</a></div></div>
          <div className="flex gap-4"><MapPin className="mt-0.5 text-bronze" aria-hidden="true" size={18} /><div><h2 className="eyebrow">{dict.contact.hours}</h2><p className="mt-2 text-sm leading-6 text-ink/65 whitespace-pre-line">{dict.contact.hoursCopy}</p></div></div>
        </aside>
        <ContactForm />
      </div>
    </ContentPage>
  );
}
