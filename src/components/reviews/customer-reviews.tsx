import { Star } from "lucide-react";
import { averageRating, reviewQuote, type StoreReview } from "@/lib/content/reviews";
import type { Locale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/interpolate";

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <p className="flex items-center gap-0.5 text-bronze" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          size={14}
          className={index < Math.round(rating) ? "fill-current" : "opacity-25"}
        />
      ))}
    </p>
  );
}

export function CustomerReviews({
  reviews,
  locale,
  eyebrow,
  title,
  countLabel,
  ratingLabel,
}: {
  reviews: StoreReview[];
  locale: Locale;
  eyebrow: string;
  title: string;
  countLabel: string;
  ratingLabel: string;
}) {
  if (!reviews.length) return null;
  const average = averageRating(reviews);

  return (
    <section className="border-t border-ink/10 py-16 sm:py-24" aria-labelledby="customer-reviews-title">
      <div className="shell">
        <header className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="customer-reviews-title" className="mt-3 font-display text-4xl sm:text-5xl">
            {title}
          </h2>
          <div className="mt-5 flex items-center justify-center gap-3 text-sm">
            <Stars rating={average} label={interpolate(ratingLabel, { rating: average })} />
            <p className="text-ink/55">{interpolate(countLabel, { count: reviews.length })}</p>
          </div>
        </header>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 6).map((review) => (
            <li key={review.id} className="border border-ink/10 bg-stone/30 p-6">
              <Stars rating={review.rating} label={interpolate(ratingLabel, { rating: review.rating })} />
              <blockquote className="mt-4 text-sm leading-7 text-ink/75">“{reviewQuote(review, locale)}”</blockquote>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">{review.author}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
