import Link from "next/link";

import { NewArrivalBlastForm } from "@/app/admin/(protected)/new-arrival-blast-form";
import { OrdersEnabledForm } from "@/app/admin/(protected)/orders-enabled-form";
import { formatAdminMessage, getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { getAdminDashboard } from "@/lib/admin/queries";
import { getOrdersEnabled } from "@/lib/commerce";
import { requireAdminPage } from "@/lib/auth/server";
import { countUnannouncedNewArrivals } from "@/lib/email/new-arrivals";
import { isSmtpConfigured } from "@/lib/email/mailer";
import { listActiveSubscribers } from "@/lib/newsletter/subscribers";
import {
  getPaymentProvider,
  ordersBlockedByDemoPayments,
} from "@/lib/payments/provider";

export default async function AdminDashboard() {
  await requireAdminPage();
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const [stats, ordersEnabled, pendingProducts, subscribers] = await Promise.all([
    getAdminDashboard(),
    getOrdersEnabled(),
    countUnannouncedNewArrivals(),
    listActiveSubscribers(),
  ]);
  const cards = [
    {
      label: dict.dashboard.products,
      value: String(stats.products),
      note: formatAdminMessage(dict.dashboard.productsNote, { count: stats.drafts }),
      href: "/admin/products",
    },
    {
      label: dict.dashboard.orders,
      value: String(stats.orders),
      note: formatAdminMessage(dict.dashboard.ordersNote, { count: stats.pending }),
      href: "/admin/orders",
    },
    {
      label: dict.dashboard.customers,
      value: String(stats.customers),
      note: dict.dashboard.customersNote,
      href: "/admin/customers",
    },
    {
      label: dict.dashboard.pages,
      value: String(stats.pages),
      note: dict.dashboard.pagesNote,
      href: "/admin/content",
    },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">{dict.dashboard.eyebrow}</p>
        <h1 className="text-3xl font-bold">{dict.dashboard.title}</h1>
      </div>
      <section aria-label={dict.dashboard.metricsAria} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-xl bg-white p-5 shadow-sm focus:ring-2 focus:ring-slate-900">
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className="my-2 text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-slate-500">{card.note}</p>
          </Link>
        ))}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <OrdersEnabledForm
          initialEnabled={ordersEnabled}
          canEnableOrders={!ordersBlockedByDemoPayments()}
          paymentProvider={getPaymentProvider().name}
        />
        <NewArrivalBlastForm
          pendingProducts={pendingProducts}
          subscribers={subscribers.length}
          smtpConfigured={isSmtpConfigured()}
        />
      </section>
    </>
  );
}
