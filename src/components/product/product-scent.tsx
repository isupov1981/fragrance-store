import type { ScentFacts } from "@/lib/catalog/scent";

type Labels = {
  composition: string;
  notes: string;
  top: string;
  heart: string;
  base: string;
  occasion: string;
  season: string;
  sillage: string;
  family: string;
  occasions: Record<string, string>;
  seasons: Record<string, string>;
  sillages: Record<string, string>;
};

export function ProductScent({
  scent,
  family,
  labels,
  noteLabel,
}: {
  scent: ScentFacts;
  family?: string;
  labels: Labels;
  noteLabel: (note: string) => string;
}) {
  const attributes = [
    family ? [labels.family, family] : null,
    scent.occasion ? [labels.occasion, labels.occasions[scent.occasion] ?? scent.occasion] : null,
    scent.season ? [labels.season, labels.seasons[scent.season] ?? scent.season] : null,
    scent.sillage ? [labels.sillage, labels.sillages[scent.sillage] ?? scent.sillage] : null,
  ].filter((item): item is [string, string] => item != null);

  const layers: Array<[string, string[]]> = scent.pyramid
    ? (
        [
          [labels.top, scent.pyramid.top],
          [labels.heart, scent.pyramid.heart],
          [labels.base, scent.pyramid.base],
        ] as Array<[string, string[]]>
      ).filter(([, notes]) => notes.length > 0)
    : [];

  if (!attributes.length && !layers.length && !scent.notes.length) return null;

  return (
    <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
      {attributes.length ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:grid-cols-4">
          {attributes.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">{label}</dt>
              <dd className="mt-1.5 text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {layers.length ? (
        <div className="py-6">
          <p className="eyebrow mb-5">{labels.composition}</p>
          <div className="grid gap-5">
            {layers.map(([label, notes]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-bronze">{label}</p>
                <p className="mt-1.5 text-sm leading-6">{notes.map((note) => noteLabel(note)).join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      ) : scent.notes.length ? (
        <div className="py-6">
          <p className="eyebrow mb-4">{labels.notes}</p>
          <p className="text-sm leading-6">{scent.notes.map((note) => noteLabel(note)).join(" · ")}</p>
        </div>
      ) : null}
    </div>
  );
}
