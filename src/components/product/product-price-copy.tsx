"use client";

import { useCurrency } from "@/components/i18n/currency-provider";
import { FREE_SHIPPING_ILS_CENTS } from "@/lib/currency";
import { interpolate } from "@/lib/i18n/interpolate";

export function ProductFromPrice({ template, cents }: { template: string; cents: number }) {
  const { format } = useCurrency();
  return (
    <p className="mt-4 text-sm" suppressHydrationWarning>
      {interpolate(template, { price: format(cents) })}
    </p>
  );
}

export function ProductVatFx({ children }: { children: string }) {
  const { currency } = useCurrency();
  if (currency === "ILS") return null;
  return <p className="mt-2 max-w-md text-xs leading-5 text-ink/55">{children}</p>;
}

export function ProductDeliveryCopy({ title, template }: { title: string; template: string }) {
  const { format } = useCurrency();
  const copy = interpolate(template, { amount: format(FREE_SHIPPING_ILS_CENTS) });
  return (
    <details className="group py-4">
      <summary className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.13em]">
        {title}
        <span className="text-lg font-light group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <p className="pt-3 text-xs leading-6 text-ink/60">{copy}</p>
    </details>
  );
}
