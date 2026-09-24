"use client";

import { Heart } from "lucide-react";
import { LocaleLink } from "@/components/i18n/locale-link";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useHydratedFavorites } from "@/lib/favorites/use-hydrated-favorites";

export function FavoritesLink() {
  const { dict } = useI18n();
  const { productIds, hydrated } = useHydratedFavorites();
  const count = productIds.length;
  const label = hydrated
    ? `${dict.favorites.open}, ${count} ${count === 1 ? dict.favorites.item : dict.favorites.items}`
    : dict.favorites.open;

  return (
    <LocaleLink className="icon-button relative" href="/saved" aria-label={label} data-testid="open-favorites">
      <Heart aria-hidden="true" size={20} />
      {hydrated && count > 0 ? (
        <span
          className="absolute end-0 top-0 grid size-4 place-items-center rounded-full bg-bronze text-[9px] text-white"
          aria-hidden="true"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </LocaleLink>
  );
}
