import type { Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/interpolate";
import {
  europeZone1Destinations,
  europeZone2Destinations,
  localizedPlaces,
  unitedStatesDestinations,
} from "@/lib/shipping/international";

type ShippingCopy = Dictionary["shipping"];

export function WorldwideDeliveries({
  dict,
  locale,
  zone1Price,
  zone2Price,
  freeThreshold,
  cancelCap,
}: {
  dict: ShippingCopy;
  locale: Locale;
  zone1Price: string;
  zone2Price: string;
  freeThreshold: string;
  cancelCap: string;
}) {
  const unitedStates = localizedPlaces(unitedStatesDestinations, locale);
  const zone2 = localizedPlaces(europeZone2Destinations, locale);
  const zone1 = localizedPlaces(europeZone1Destinations, locale);
  const rowCount = Math.max(unitedStates.length, zone2.length, zone1.length);
  const freeOver = interpolate(dict.freeOver, { amount: freeThreshold });
  const columns = [
    { title: dict.unitedStates, rate: zone1Price, places: unitedStates },
    { title: dict.zone2, rate: zone2Price, places: zone2 },
    { title: dict.zone1, rate: zone1Price, places: zone1 },
  ];

  return (
    <section className="border-t border-ink/10 py-9 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl sm:text-3xl">{dict.worldwide}</h2>
      <div className="mt-5 max-w-3xl space-y-4 text-sm leading-7 text-ink/65">
        <p>{dict.worldwideIntro}</p>
        <p>{dict.worldwideTransit}</p>
        <p>{dict.duties}</p>
      </div>

      <h3 className="mt-10 font-display text-xl">{dict.ratesHeading}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {columns.map((column) => (
          <article key={column.title} className="border border-ink/10 bg-stone/30 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">{column.title}</p>
            <p className="mt-3 font-display text-3xl text-ink">{column.rate}</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">{freeOver}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 md:hidden">
        <h3 className="font-display text-xl">{dict.destinations}</h3>
        <div className="mt-5 space-y-8">
          {columns.map((column) => (
            <div key={`${column.title}-mobile`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">{column.title}</p>
              <ul className="mt-3 columns-2 gap-x-6 text-sm leading-7 text-ink/70">
                {column.places.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] border-collapse text-center text-sm">
          <caption className="sr-only">{dict.destinations}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.title} className="border border-ink/15 px-3 py-3 font-medium">
                  {column.title}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((column) => (
                <th key={`${column.title}-rate`} className="border border-ink/15 px-3 py-3 font-display text-base font-normal">
                  {column.rate}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((column) => (
                <th key={`${column.title}-free`} className="border border-ink/15 px-3 py-3 text-xs font-normal leading-6 text-ink/65">
                  {freeOver}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={`${column.title}-${index}`} className="border border-ink/15 px-3 py-2.5 text-ink/70">
                    {column.places[index] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 max-w-3xl space-y-4 text-sm leading-7 text-ink/65">
        <h3 className="font-display text-xl text-ink">{dict.pleaseNote}</h3>
        <p>{dict.noteAttempts}</p>
        <p>{dict.noteReturn}</p>
        <p>{dict.noteResend}</p>
        <p>{interpolate(dict.noteCancel, { cap: cancelCap })}</p>
        <p>{dict.noteDeductionsIntro}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>{dict.noteOriginalShipping}</li>
          <li>{dict.noteReturnShipping}</li>
        </ul>
      </div>
    </section>
  );
}
