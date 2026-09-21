export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  eyebrow: string;
  heading: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

export const legalEn: {
  identityNote: string;
  terms: LegalDocument;
  privacy: LegalDocument;
  cookies: LegalDocument;
  accessibility: LegalDocument;
} = {
  identityNote:
    "Full seller identity (legal name, registration number and address) will be published on this site once registration is complete. Until then, contact us at orders@parfums.cloud or via WhatsApp.",
  terms: {
    title: "Terms of use",
    eyebrow: "Legal",
    heading: "Site terms",
    intro:
      "These terms apply to browsing and purchasing on The Perfume Room. Distance sales to consumers in Israel are also governed by the Consumer Protection Law, 1981, which prevails if these terms conflict with it.",
    updated: "Last updated: 21 September 2026.",
    sections: [
      {
        title: "Who we are",
        paragraphs: [
          "The store is operated under the trading name The Perfume Room. Complete legal-entity details will be added to this page when registration is finished.",
          "Questions, complaints and cancellation requests: orders@parfums.cloud or WhatsApp.",
        ],
      },
      {
        title: "The catalogue",
        paragraphs: [
          "We sell niche fragrance and related products. Descriptions, notes and images are for identification; scent develops differently on skin. Concentration (eau de parfum, extrait and similar) is shown on the product page.",
          "Some items are sourced through official Israeli importers and some through lawful parallel import. Parallel-import cosmetics marketed in Israel may carry additional labelling required by the Ministry of Health.",
          "Stock and availability can change. An order is confirmed only after payment is approved.",
        ],
      },
      {
        title: "Prices and VAT",
        paragraphs: [
          "Prices displayed to consumers in Israel include Israeli VAT. Shipping is calculated at checkout and shown before payment. Currency conversion is indicative; the charge is processed according to the payment provider and the selected currency.",
          "An order delivered outside Israel is charged the same Israeli catalogue price. Israeli VAT is not removed, and we do not add a foreign sales tax. Customs duties in the destination country, if charged, are paid by you.",
          "A price is an invitation to treat until we accept the order.",
        ],
      },
      {
        title: "Orders and payment",
        paragraphs: [
          "You must provide accurate contact and delivery details. Payment is processed by a third-party provider (such as Grow or Stripe) on a secure page. We do not store full card numbers.",
          "A tax invoice will be issued in accordance with applicable tax rules once seller registration details are in place.",
        ],
      },
      {
        title: "Delivery",
        paragraphs: [
          "Delivery times and rates are described on the shipping page. Fragrance is a restricted item for some air routes; we will contact you if a destination cannot be served.",
          "Risk in the goods passes on delivery to the address you gave, unless the carrier is our responsibility under mandatory law.",
        ],
      },
      {
        title: "Cancellation of a distance sale",
        paragraphs: [
          "As a consumer in a distance sale, you may cancel without giving a reason within 14 days of the later of: receiving the goods, or receiving the written transaction-disclosure document. Cancellation is made by contacting us with your name, order number and, where reasonably required to identify the purchaser, ID number.",
          "Fragrance and cosmetics that have been opened, unsealed or used cannot usually be returned, because it is then impossible to verify that they were not used. Sealed full-size items in original packaging may be cancelled.",
          "Goods made to your special request may be excluded from cancellation as provided by law. Complimentary samples included with an order should be returned unused if you cancel.",
          "Unless the cancellation is due to a defect, non-conformity or our breach, we may deduct a cancellation fee of 5% of the transaction amount or ₪100, whichever is lower. Return shipping for a change-of-mind cancellation is paid by you. If complimentary shipping was granted, we may deduct the actual outbound shipping cost according to the rates published on the shipping page.",
          "We will refund the amount due to the original payment method within 14 days of receiving the cancellation notice and, where goods must come back, the returned goods.",
        ],
      },
      {
        title: "Defects and non-conformity",
        paragraphs: [
          "If goods arrive damaged, incorrect or not as described, photograph the parcel and contents and contact us promptly. Mandatory rights for defective goods are not limited to a short courtesy window. We will repair, replace or refund as required by law, without a change-of-mind cancellation fee.",
        ],
      },
      {
        title: "Promotional gifts",
        paragraphs: [
          "If a promotional gift was supplied with the order, return it unused and in its original packaging when you cancel. If it is not returned, we may deduct its stated value as shown on the order or at checkout.",
        ],
      },
      {
        title: "Use of the website",
        paragraphs: [
          "You may not misuse the site, scrape it unreasonably, or interfere with its security. Product names and brand marks belong to their owners; we sell genuine goods and do not claim ownership of third-party trademarks.",
        ],
      },
      {
        title: "Governing law",
        paragraphs: [
          "These terms are governed by the laws of the State of Israel. Mandatory consumer protections for Israeli consumers apply regardless of any other choice of law. Courts in Israel have jurisdiction, without limiting rights to approach the Consumer Protection and Fair Trade Authority or other competent bodies.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    eyebrow: "Legal",
    heading: "Privacy policy",
    intro:
      "This notice explains how The Perfume Room processes personal data under the Privacy Protection Law, 1981, including Amendment 13. We provide it when we collect data from you, including at checkout, on the contact form and when you subscribe to notes.",
    updated: "Last updated: 21 September 2026.",
    sections: [
      {
        title: "Who is responsible",
        paragraphs: [
          "The Perfume Room is the controller of personal data collected through this website. Full legal-entity and registration details will be published here when they are available. Contact: orders@parfums.cloud.",
        ],
      },
      {
        title: "What we collect",
        paragraphs: [
          "Depending on how you use the site, we may process:",
        ],
        bullets: [
          "Identity and contact data: name, email, phone, delivery address (orders and enquiries).",
          "Transaction data: products, amounts, shipping method, order status.",
          "Newsletter data: email, language preference, and a record of marketing consent.",
          "Technical data: locale and currency preferences, accessibility settings, cart contents stored on your device.",
          "Usage data from analytics or advertising tools, only after you opt in (Google Analytics, Meta Pixel).",
        ],
      },
      {
        title: "Why we use the data",
        paragraphs: [
          "We use personal data to fulfil orders, communicate about purchases, answer enquiries, send marketing if you asked for it, improve the store, prevent fraud and meet legal duties (tax, consumer disclosures, security).",
          "Providing checkout fields marked as required is needed to complete a purchase. You may refuse analytics and marketing cookies; the store will still function.",
        ],
      },
      {
        title: "Sharing",
        paragraphs: [
          "We share data with service providers who assist the store, only as needed:",
        ],
        bullets: [
          "Payment processors (for example Grow or Stripe).",
          "Carriers (for example UPS) for delivery.",
          "Email delivery (SMTP provider) for order and marketing messages.",
          "Google and Meta, only if you accept analytics or marketing cookies.",
          "Professional advisers or authorities when required by law.",
        ],
      },
      {
        title: "Cookies and similar tools",
        paragraphs: [
          "Essential cookies and local storage keep your language, currency, cart and accessibility choices. Analytics and advertising tools run only after opt-in. Details and controls are on the cookie policy page.",
        ],
      },
      {
        title: "Retention",
        paragraphs: [
          "Order records are kept for as long as needed for accounting, consumer claims and legal duties. Newsletter data is kept until you unsubscribe, then suppressed as needed to honour the opt-out. Enquiry emails are kept long enough to handle the request. Cookie choices are stored on your device.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "Subject to the Privacy Protection Law, you may request access to your personal data, correction of inaccurate data, and deletion in the cases the law allows. You may withdraw marketing consent at any time via the unsubscribe link or by emailing us. You may also complain to the Privacy Protection Authority.",
          "To exercise rights, email orders@parfums.cloud from the address we hold or provide enough detail to identify you.",
        ],
      },
      {
        title: "Security and transfers",
        paragraphs: [
          "We use HTTPS and restrict access to order and subscriber data. Payment card details are handled by the payment provider. Some processors may store data outside Israel; we use providers that offer appropriate contractual and legal safeguards, including where an adequacy finding or other permitted mechanism applies.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie policy",
    eyebrow: "Legal",
    heading: "Cookies and similar technologies",
    intro:
      "This page describes the cookies and local storage used on The Perfume Room and how to change your choice. Analytics and advertising tools are off until you opt in.",
    updated: "Last updated: 21 September 2026.",
    sections: [
      {
        title: "Essential",
        paragraphs: [
          "These are needed for the site to work and do not require opt-in:",
        ],
        bullets: [
          "Language preference cookie (fragrance_locale).",
          "Currency preference cookie (fragrance_currency).",
          "Shopping-cart contents in local storage.",
          "Accessibility-tool preferences in local storage.",
          "Your cookie-choice record itself.",
        ],
      },
      {
        title: "Analytics",
        paragraphs: [
          "If you allow analytics, we load Google Analytics (GA4) with IP anonymisation to understand how the catalogue is used (for example which products are viewed). This is optional.",
        ],
      },
      {
        title: "Marketing",
        paragraphs: [
          "If you allow marketing, we load the Meta (Facebook) Pixel to measure and improve ads. This is optional and separate from analytics.",
        ],
      },
      {
        title: "How to change your choice",
        paragraphs: [
          "Use Cookie settings in the footer, or the banner when it is shown. You can also delete cookies and site data in your browser. Blocking essential storage may prevent checkout or language selection from working.",
        ],
      },
    ],
  },
  accessibility: {
    title: "Accessibility statement",
    eyebrow: "Legal",
    heading: "Accessibility statement",
    intro:
      "The Perfume Room aims to make this website usable by people with disabilities, in line with the Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments), 2013, and Israeli Standard 5568 (WCAG 2.0 Level AA).",
    updated: "Statement date: 21 September 2026.",
    sections: [
      {
        title: "What we have implemented",
        paragraphs: [
          "The storefront supports Hebrew RTL, a skip-to-content link, labelled form fields, and an accessibility toolbar (keyboard emphasis, contrast, text size, reduced motion, link and heading highlights, larger cursor).",
          "Home hero films are silent and played muted, with a text alternative on the page and no captions. They pause when reduced motion is requested.",
          "If a barrier remains, we will try to provide the information or complete the purchase another way — email or WhatsApp.",
        ],
      },
      {
        title: "Known limitations",
        paragraphs: [
          "Checkout payment is completed on a third-party page whose accessibility we do not control. A formal accessibility-audit certificate has not yet been issued. We continue to improve contrast and focus order.",
        ],
      },
      {
        title: "Accessibility coordinator",
        paragraphs: [
          "Coordinator name and direct phone number will be published together with the seller’s registration details. Until then, report accessibility issues via the contact form, orders@parfums.cloud, or WhatsApp, and through the accessibility toolbar.",
        ],
      },
      {
        title: "Exemption",
        paragraphs: [
          "If the business later qualifies for a statutory turnover exemption, that fact will be stated here. This statement will be updated when an accessibility audit is completed or when coordinator details are added.",
        ],
      },
    ],
  },
};

export type LegalCopy = typeof legalEn;
