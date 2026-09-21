import { ContentPage, ProseSection } from "@/components/ui/content-page";
import type { Dictionary } from "@/lib/i18n/en";

type LegalKind = "terms" | "privacy" | "cookies" | "accessibility";

export function LegalDocument({ dict, kind }: { dict: Dictionary; kind: LegalKind }) {
  const doc = dict.legal[kind];
  return (
    <ContentPage eyebrow={doc.eyebrow} title={doc.heading} intro={doc.intro}>
      <div className="mx-auto max-w-4xl">
        <p className="mb-10 max-w-2xl border border-dashed border-ink/20 bg-stone/40 px-4 py-3 text-sm leading-7 text-ink/70">
          {dict.legal.identityNote}
        </p>
        {doc.sections.map((section) => (
          <ProseSection key={section.title} title={section.title}>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets?.length ? (
              <ul className="list-disc space-y-2 ps-5">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </ProseSection>
        ))}
        <p className="mt-6 text-xs text-ink/50">{doc.updated}</p>
      </div>
    </ContentPage>
  );
}
