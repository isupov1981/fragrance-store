import Image from "next/image";
import Link from "next/link";

const collections = [
  {
    href: "/collections/all?edit=featured",
    kicker: "The private edit",
    title: "Objects of desire",
    copy: "Signatures selected for craft, character and the way they live on skin.",
    image: "https://images.unsplash.com/photo-1610461888750-10bfc601b874?auto=format&fit=crop&w=1400&q=85",
    alt: "A rose-tinted fragrance bottle",
  },
  {
    href: "/collections/all?edit=new",
    kicker: "Just arrived",
    title: "New in the cabinet",
    copy: "The latest compositions to enter the atelier, still unfolding.",
    image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1400&q=85",
    alt: "A newly arrived perfume bottle",
  },
];

export function CollectionPair() {
  return (
    <section className="shell grid gap-4 py-10 sm:grid-cols-2 sm:py-16">
      {collections.map((collection) => (
        <article key={collection.href}>
          <Link className="group block" href={collection.href} aria-label={collection.title}>
            <div className="relative aspect-square overflow-hidden bg-stone sm:aspect-[4/5]">
              <Image className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]" src={collection.image} alt={collection.alt} fill sizes="(max-width: 640px) 100vw, 50vw" />
            </div>
          </Link>
          <p className="eyebrow mt-6">{collection.kicker}</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">{collection.title}</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink/65">{collection.copy}</p>
          <Link className="text-link mt-6" href={collection.href}>
            View the collection <span aria-hidden="true">↗</span>
          </Link>
        </article>
      ))}
    </section>
  );
}
