import { LocaleLink } from "@/components/i18n/locale-link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { ordersEnabled } from "@/lib/commerce";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return { title: ordersEnabled ? dict.checkout.title : dict.browseOnly.title };
}

export default async function CheckoutPage({ params, searchParams }: PageProps<"/[lang]/checkout">) {
  const { lang } = await params;
  const query = await searchParams;
  const dict = getDictionary(lang);

  if (!ordersEnabled) {
    return (
      <main className="mx-auto w-full max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl">{dict.browseOnly.title}</h1>
        <p className="mt-5 text-ink/65">{dict.browseOnly.notice}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
          <LocaleLink className="underline underline-offset-4" href="/collections/all">
            {dict.browseOnly.browse}
          </LocaleLink>
          <LocaleLink className="underline underline-offset-4" href="/contact">
            {dict.browseOnly.contact}
          </LocaleLink>
        </div>
      </main>
    );
  }

  const cancelled = query.cancelled === "1";
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{dict.checkout.title}</h1>
      {cancelled ? <p role="status" className="mt-4 text-sm text-ink/70">{dict.checkout.cancelledNotice}</p> : null}
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </main>
  );
}
