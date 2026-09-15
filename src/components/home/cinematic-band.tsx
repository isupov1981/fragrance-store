import Image from "next/image";

export function CinematicBand() {
  return (
    <section className="relative isolate min-h-[280px] overflow-hidden bg-ink sm:min-h-[380px] lg:min-h-[450px]" aria-label="The Perfume Room">
      <Image
        className="home-hero-frame is-active object-cover object-center"
        src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=2000&q=88"
        alt=""
        fill
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-ink/45" />
      <div className="relative flex min-h-[280px] items-end justify-center px-6 py-12 text-center text-ivory sm:min-h-[380px] lg:min-h-[450px]">
        <h2 className="font-display text-3xl tracking-[0.12em] sm:text-5xl lg:text-6xl">THE PERFUME ROOM</h2>
      </div>
    </section>
  );
}
