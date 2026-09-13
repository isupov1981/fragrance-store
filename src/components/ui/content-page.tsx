import type { ReactNode } from "react";

export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main id="main-content">
      <header className="border-b border-ink/10 bg-stone/40">
        <div className="shell py-16 sm:py-24">
          <p className="eyebrow text-bronze">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[.95] sm:text-7xl">{title}</h1>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-ink/65 sm:text-base">{intro}</p>
        </div>
      </header>
      <div className="shell py-14 sm:py-20">{children}</div>
    </main>
  );
}

export function ProseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-ink/10 py-9 first:border-t-0 first:pt-0 md:grid-cols-[.7fr_1.3fr]">
      <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
      <div className="max-w-2xl space-y-4 text-sm leading-7 text-ink/65">{children}</div>
    </section>
  );
}
