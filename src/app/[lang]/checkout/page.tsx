import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout">) {
  const { lang } = await params;
  return { title: getDictionary(lang).checkout.title };
}

export default async function CheckoutPage({ params, searchParams }: PageProps<"/[lang]/checkout">) {
  const { lang } = await params;
  const query = await searchParams;
  const dict = getDictionary(lang);
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
