const WHATSAPP_NUMBER = "972535324510";

type WhatsAppButtonProps = {
  label: string;
  message: string;
};

export function WhatsAppButton({ label, message }: WhatsAppButtonProps) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      className="whatsapp-fab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      data-testid="whatsapp-button"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.99.59 3.84 1.61 5.4L2 22l4.93-1.61a9.9 9.9 0 0 0 5.11 1.41h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2Zm5.48 13.98c-.23.65-1.34 1.2-1.86 1.27-.48.07-1.08.1-1.74-.11-.4-.12-.91-.28-1.57-.55-2.76-1.19-4.55-3.97-4.69-4.15-.14-.18-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.36.26-.29.57-.36.76-.36h.55c.17 0 .41-.07.64.49.23.58.79 2 .86 2.14.07.15.12.32.02.51-.1.19-.15.32-.3.49-.15.18-.31.39-.44.53-.15.15-.3.32-.13.62.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.14.46.12.63-.07.17-.19.74-.86.94-1.16.2-.29.4-.24.67-.14.27.1 1.71.81 2.01.95.29.15.49.22.56.34.08.13.08.74-.15 1.39Z"
        />
      </svg>
    </a>
  );
}
