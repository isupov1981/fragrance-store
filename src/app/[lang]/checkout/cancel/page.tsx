import { LocaleLink } from "@/components/i18n/locale-link";
import { ordersEnabled } from "@/lib/commerce";
import { getDictionary, hasLocale } from "@/lib/i18n/get-dictionary";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout/cancel">) {
  const { lang } = await params;
  return { title: getDictionary(hasLocale(lang) ? lang : "en").checkout.cancelledTitle };
}

export default async function CheckoutCancelPage({ params }: PageProps<"/[lang]/checkout/cancel">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  if (!ordersEnabled) {
    return (
      <main className="mx-auto w-full max-w-xl px-6 py-24 text-center">
        <h1 className="mt-4 text-4xl font-semibold">{dict.browseOnly.title}</h1>
        <p className="mt-5 text-zinc-600">{dict.browseOnly.notice}</p>
        <LocaleLink href="/collections/all" className="mt-8 inline-block rounded-full bg-zinc-950 px-6 py-3 text-white">
          {dict.browseOnly.browse}
        </LocaleLink>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">{dict.checkout.title}</p>
      <h1 className="mt-4 text-4xl font-semibold">{dict.checkout.cancelledTitle}</h1>
      <p className="mt-5 text-zinc-600">{dict.checkout.cancelledCopy}</p>
      <LocaleLink href="/checkout" className="mt-8 inline-block rounded-full bg-zinc-950 px-6 py-3 text-white">
        {dict.checkout.returnToCheckout}
      </LocaleLink>
    </main>
  );
}
