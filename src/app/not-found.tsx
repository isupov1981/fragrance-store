import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="shell grid min-h-[65vh] place-items-center py-20 text-center">
      <div>
        <p className="font-display text-8xl leading-none text-sand sm:text-9xl">404</p>
        <p className="eyebrow mt-7 text-bronze">A vanished trace</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">This page has left no sillage.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-ink/60">The address may have changed, or the fragrance you seek may no longer be in the collection.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link className="button-primary h-13" href="/">Return home</Link>
          <Link className="button-secondary h-13" href="/collections/all">Explore fragrances</Link>
        </div>
      </div>
    </main>
  );
}
