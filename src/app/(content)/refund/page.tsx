import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ProseSection } from "@/components/ui/content-page";

export const metadata: Metadata = { title: "Returns" };

export default function RefundPage() {
  return (
    <ContentPage eyebrow="Client care" title="Returns, made simple." intro="We hope every selection feels entirely right. If it does not, unopened full-size fragrance may be returned within 14 days of delivery.">
      <div className="mx-auto max-w-4xl">
        <ProseSection title="Return conditions"><p>Items must be unused, unopened and in their original cellophane and presentation packaging. Samples, discovery sizes and personalised items are final sale.</p></ProseSection>
        <ProseSection title="Begin a return"><p>Write to our atelier with your order number and the item you wish to return. We will send instructions appropriate to your location.</p><Link className="text-link mt-2" href="/contact">Contact client care</Link></ProseSection>
        <ProseSection title="Refunds"><p>Once inspected, approved refunds are returned to the original payment method within 5–10 business days. Original delivery charges are not refundable.</p></ProseSection>
        <ProseSection title="Damaged orders"><p>If an item arrives damaged or incorrect, photograph the parcel and contents and contact us within 48 hours. We will make it right.</p></ProseSection>
      </div>
    </ContentPage>
  );
}
