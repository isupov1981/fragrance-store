import { redirect } from "next/navigation";

export default async function ProductsIndexPage({ params }: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  redirect(`/${lang}/collections/all`);
}
