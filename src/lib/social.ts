export type SocialLink = {
  id: "instagram" | "facebook" | "youtube" | "tiktok";
  label: string;
  href: string;
};

const defaults = {
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  youtube: "https://www.youtube.com/",
  tiktok: "https://www.tiktok.com/",
} as const;

function socialUrl(envValue: string | undefined, fallback: string) {
  const value = envValue?.trim();
  return value || fallback;
}

export function getSocialLinks(): SocialLink[] {
  return [
    {
      id: "instagram",
      label: "Instagram",
      href: socialUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL, defaults.instagram),
    },
    {
      id: "facebook",
      label: "Facebook",
      href: socialUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL, defaults.facebook),
    },
    {
      id: "youtube",
      label: "YouTube",
      href: socialUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL, defaults.youtube),
    },
    {
      id: "tiktok",
      label: "TikTok",
      href: socialUrl(process.env.NEXT_PUBLIC_TIKTOK_URL, defaults.tiktok),
    },
  ];
}
