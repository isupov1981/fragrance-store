import type { Metadata } from "next";
import { ContentPage, ProseSection } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Delivery" };

export default function ShippingPage() {
  return (
    <ContentPage eyebrow="Client care" title="Delivery, handled with care." intro="Every order is prepared by hand and presented in our signature, recyclable packaging.">
      <div className="mx-auto max-w-4xl">
        <ProseSection title="United States"><p>Standard delivery takes 3–5 business days and is complimentary on orders over $250. Express options are shown at checkout where available.</p></ProseSection>
        <ProseSection title="International"><p>We deliver to selected international destinations. Available services, timing and cost are calculated at checkout. Duties and local taxes may be due on arrival.</p></ProseSection>
        <ProseSection title="Fragrance in transit"><p>Because fragrance is classed as a restricted item, certain destinations and expedited air services may be unavailable. We will contact you promptly if your order is affected.</p></ProseSection>
        <ProseSection title="Order tracking"><p>Once your parcel leaves the atelier, you will receive an email with its tracking details. Please allow one business day for the carrier status to update.</p></ProseSection>
      </div>
    </ContentPage>
  );
}
