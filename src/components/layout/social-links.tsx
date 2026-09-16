import { getSocialLinks, type SocialLink } from "@/lib/social";

function SocialIcon({ id }: { id: SocialLink["id"] }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const };
  switch (id) {
    case "instagram":
      return (
        <svg {...common}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 8h2.5V5.5A18 18 0 0 0 13.8 5C11 5 9 6.8 9 10v2H6.5v3H9v7h3.5v-7H15l.5-3H12.5v-1.5c0-.9.3-1.5 1.5-1.5z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M23 12.2s0-3.4-.4-5a2.9 2.9 0 0 0-2-2C18.7 4.7 12 4.7 12 4.7s-6.7 0-8.6.5a2.9 2.9 0 0 0-2 2c-.4 1.6-.4 5-.4 5s0 3.4.4 5a2.9 2.9 0 0 0 2 2c1.9.5 8.6.5 8.6.5s6.7 0 8.6-.5a2.9 2.9 0 0 0 2-2c.4-1.6.4-5 .4-5zM9.8 15.5v-6.8L16 12l-6.2 3.5z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.14 15.8a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.77 1.52V6.84a4.85 4.85 0 0 1-1-.15Z" />
        </svg>
      );
  }
}

export function SocialLinks({ className = "" }: { className?: string }) {
  const links = getSocialLinks();
  return (
    <ul className={`flex items-center gap-5 ${className}`.trim()} aria-label="Social media">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label}
            className="grid size-9 place-items-center text-ivory/70 transition hover:text-white"
          >
            <SocialIcon id={link.id} />
          </a>
        </li>
      ))}
    </ul>
  );
}
