import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/content-page";
import { OrderLookupForm } from "@/components/account/order-lookup-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/account">): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).account.title };
}

export default async function AccountPage({ params }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  return (
    <ContentPage eyebrow={dict.account.eyebrow} title={dict.account.heading} intro={dict.account.intro}>
      <OrderLookupForm />
    </ContentPage>
  );
}
