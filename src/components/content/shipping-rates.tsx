"use client";

import { WorldwideDeliveries } from "@/components/content/worldwide-deliveries";
import { useCurrency } from "@/components/i18n/currency-provider";
import { ProseSection } from "@/components/ui/content-page";
import { FREE_SHIPPING_ILS_CENTS } from "@/lib/currency";
import type { Dictionary } from "@/lib/i18n/en";
import type { Locale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/interpolate";
import {
  INTL_FREE_SHIPPING_ILS_CENTS,
  INTL_ZONE1_SHIPPING_ILS_CENTS,
  INTL_ZONE2_SHIPPING_ILS_CENTS,
  SHIPPING_CANCELLATION_FEE_CAP_ILS_CENTS,
} from "@/lib/shipping/international";

export function ShippingRates({ dict, locale }: { dict: Dictionary["shipping"]; locale: Locale }) {
  const { format } = useCurrency();
  return (
    <>
      <ProseSection title={dict.us}>
        <p>{interpolate(dict.usCopy, { amount: format(FREE_SHIPPING_ILS_CENTS) })}</p>
      </ProseSection>
      <WorldwideDeliveries
        dict={dict}
        locale={locale}
        zone1Price={format(INTL_ZONE1_SHIPPING_ILS_CENTS)}
        zone2Price={format(INTL_ZONE2_SHIPPING_ILS_CENTS)}
        freeThreshold={format(INTL_FREE_SHIPPING_ILS_CENTS)}
        cancelCap={format(SHIPPING_CANCELLATION_FEE_CAP_ILS_CENTS)}
      />
      <ProseSection title={dict.transit}>
        <p>{dict.transitCopy}</p>
      </ProseSection>
      <ProseSection title={dict.tracking}>
        <p>{dict.trackingCopy}</p>
      </ProseSection>
    </>
  );
}
