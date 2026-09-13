import { redirect } from "next/navigation";

export default async function CollectionsPage({ params }: PageProps<"/[lang]/collections">) {
  const { lang } = await params;
  redirect(`/${lang}/collections/all`);
}
