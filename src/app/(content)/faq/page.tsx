import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Frequently asked questions" };

const questions = [
  ["How should I choose a fragrance online?", "Begin with the notes and atmosphere you already enjoy, then consider a sample where available. Our atelier can also offer personal guidance—contact us with a few fragrances you love."],
  ["Are your fragrances authentic?", "Every fragrance is sourced directly from its house or an authorised distributor. We guarantee the provenance of every bottle."],
  ["Do you include samples?", "Yes. Every full-size order includes complimentary samples selected to complement your fragrance."],
  ["How should fragrance be stored?", "Keep your bottle upright, away from direct light, heat and sudden temperature changes. A cool drawer or cabinet is ideal."],
  ["Can I send an order as a gift?", "Yes. Signature wrapping and a handwritten note can be requested during checkout."],
];

export default function FaqPage() {
  return (
    <ContentPage eyebrow="Client care" title="Questions, considered." intro="Everything you may wish to know about choosing, wearing and receiving fragrance from PRIVÉ ATELIER.">
      <div className="mx-auto max-w-3xl divide-y divide-ink/10 border-y border-ink/10">
        {questions.map(([question, answer], index) => (
          <details className="group py-6" key={question} open={index === 0}>
            <summary className="flex items-start justify-between gap-6 font-display text-xl sm:text-2xl">
              {question}<span className="mt-1 shrink-0 font-sans text-xl font-light transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="max-w-2xl pt-4 text-sm leading-7 text-ink/65">{answer}</p>
          </details>
        ))}
      </div>
    </ContentPage>
  );
}
