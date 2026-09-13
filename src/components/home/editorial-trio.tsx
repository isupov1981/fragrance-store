import Image from "next/image";
import Link from "next/link";

const studies = [
  {
    href: "/products/citrus-archive",
    title: "Citrus Archive",
    note: "Bergamot peel, bright then smoky",
    image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=85",
  },
  {
    href: "/products/iris-paper",
    title: "Iris Paper",
    note: "Powdered iris and pale linen",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=85",
  },
  {
    href: "/products/cedar-after-rain",
    title: "Cedar After Rain",
    note: "Wet woods and black tea",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=85",
  },
];

export function EditorialTrio() {
  return (
    <section className="shell py-6 sm:py-10">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow">The atelier edit</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">Three studies in light</h2>
        <p className="mt-4 text-sm leading-6 text-ink/65">A citrus opening, a powdery interlude, a forest dry-down — wear them as a conversation.</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-3">
        {studies.map((study) => (
          <li key={study.href}>
            <Link className="group block" href={study.href}>
              <div className="relative aspect-square overflow-hidden bg-stone">
                <Image className="object-cover transition duration-700 ease-out group-hover:scale-[1.06]" src={study.image} alt={study.title} fill sizes="(max-width: 640px) 100vw, 33vw" />
              </div>
              <h3 className="mt-4 font-display text-2xl">{study.title}</h3>
              <p className="mt-1 text-xs text-ink/60">{study.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
