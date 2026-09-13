import { CartView } from "@/components/cart/cart-view";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Shopping cart</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </main>
  );
}
