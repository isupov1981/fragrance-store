import { CheckoutForm } from "@/components/checkout/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Checkout</h1>
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </main>
  );
}
