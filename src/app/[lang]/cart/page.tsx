import { CartView } from "@/components/cart/cart-view";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  return { title: getDictionary(lang).cart.title };
}

export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{dict.cart.title}</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </main>
  );
}
