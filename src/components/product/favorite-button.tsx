"use client";

import { Heart } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useFavoritesStore } from "@/lib/favorites/store";
import { useHydratedFavorites } from "@/lib/favorites/use-hydrated-favorites";
import { interpolate } from "@/lib/i18n/interpolate";

export function FavoriteButton({
  productId,
  productName,
  className = "",
  variant = "icon",
}: {
  productId: string;
  productName: string;
  className?: string;
  variant?: "icon" | "text";
}) {
  const { dict } = useI18n();
  const { hydrated } = useHydratedFavorites();
  const saved = useFavoritesStore((state) => state.productIds.includes(productId));
  const toggle = useFavoritesStore((state) => state.toggle);
  const active = hydrated && saved;
  const label = active
    ? interpolate(dict.favorites.unsave, { name: productName })
    : interpolate(dict.favorites.save, { name: productName });

  return (
    <button
      type="button"
      className={
        variant === "text"
          ? `inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
              active ? "text-bronze" : "text-ink/55 hover:text-ink"
            } ${className}`
          : `icon-button ${className}`
      }
      aria-label={label}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(productId);
      }}
    >
      <Heart
        aria-hidden="true"
        size={variant === "text" ? 15 : 18}
        className={active ? "fill-current text-bronze" : undefined}
        strokeWidth={active ? 1.75 : 1.5}
      />
      {variant === "text" ? <span>{active ? dict.favorites.saved : dict.favorites.saveShort}</span> : null}
    </button>
  );
}
