import { CheckoutSuccess } from "@/components/checkout/checkout-success";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <main className="px-6">
      <CheckoutSuccess orderId={order} />
    </main>
  );
}
