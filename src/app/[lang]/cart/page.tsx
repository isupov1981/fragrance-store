import { LocaleLink } from "@/components/i18n/locale-link";
import { CartView } from "@/components/cart/cart-view";
import { ordersEnabled } from "@/lib/commerce";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return { title: ordersEnabled ? dict.cart.title : dict.browseOnly.title };
}

export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
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

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{dict.cart.title}</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </main>
  );
}
