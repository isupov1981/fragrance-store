"use client";

import {
  Ban,
  Contrast,
  Heading,
  Image as ImageIcon,
  Keyboard,
  Link2,
  MousePointer2,
  RotateCcw,
  Sun,
  Type,
  ZoomIn,
} from "lucide-react";
import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { localizedPath } from "@/lib/i18n/path";

const STORAGE_KEY = "the-perfume-room-a11y";
const OPEN_EVENT = "the-perfume-room-a11y-open";

type ContrastMode = "none" | "inverted" | "light" | "mono";
type CursorMode = "none" | "black" | "white";

type A11ySettings = {
  keyboardNav: boolean;
  reduceMotion: boolean;
  contrast: ContrastMode;
  readableFont: boolean;
  fontScale: number;
  imageDescriptions: boolean;
  highlightHeadings: boolean;
  highlightLinks: boolean;
  zoom: boolean;
  cursor: CursorMode;
};

const defaults: A11ySettings = {
  keyboardNav: false,
  reduceMotion: false,
  contrast: "none",
  readableFont: false,
  fontScale: 0,
  imageDescriptions: false,
  highlightHeadings: false,
  highlightLinks: false,
  zoom: false,
  cursor: "none",
};

let cachedSettings: A11ySettings = defaults;
let open = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readSettings(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<A11ySettings>) };
  } catch {
    return defaults;
  }
}

function writeSettings(next: A11ySettings) {
  cachedSettings = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applySettings(next);
  emit();
}

function subscribeSettings(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSettingsSnapshot() {
  return cachedSettings;
}

function getServerSnapshot() {
  return defaults;
}

function subscribeOpen(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(OPEN_EVENT, handler);
  listeners.add(onChange);
  return () => {
    window.removeEventListener(OPEN_EVENT, handler);
    listeners.delete(onChange);
  };
}

function getOpenSnapshot() {
  return open;
}

function setOpen(next: boolean) {
  open = next;
  window.dispatchEvent(new Event(OPEN_EVENT));
  emit();
}

function applyImageDescriptions(enabled: boolean) {
  document.querySelectorAll<HTMLImageElement>("img[alt]").forEach((image) => {
    if (enabled && image.alt.trim()) {
      image.dataset.a11yDesc = image.alt;
      if (!image.title) image.title = image.alt;
    } else if (image.dataset.a11yDesc) {
      if (image.title === image.dataset.a11yDesc) image.removeAttribute("title");
      delete image.dataset.a11yDesc;
    }
  });
}

function applySettings(settings: A11ySettings) {
  const root = document.documentElement;
  root.classList.toggle("a11y-keyboard", settings.keyboardNav);
  root.classList.toggle("a11y-reduce-motion", settings.reduceMotion);
  root.classList.toggle("a11y-readable-font", settings.readableFont);
  root.classList.toggle("a11y-image-descriptions", settings.imageDescriptions);
  root.classList.toggle("a11y-highlight-headings", settings.highlightHeadings);
  root.classList.toggle("a11y-highlight-links", settings.highlightLinks);
  root.classList.toggle("a11y-zoom", settings.zoom);
  root.dataset.a11yContrast = settings.contrast;
  root.dataset.a11yCursor = settings.cursor;
  root.style.setProperty("--a11y-font-scale", String(1 + settings.fontScale * 0.12));
  applyImageDescriptions(settings.imageDescriptions);
}

function flipBoolean(settings: A11ySettings, key: {
  [K in keyof A11ySettings]-?: A11ySettings[K] extends boolean ? K : never;
}[keyof A11ySettings]): A11ySettings {
  return { ...settings, [key]: !settings[key] };
}

function flipExclusive<K extends "contrast" | "cursor">(
  settings: A11ySettings,
  key: K,
  value: A11ySettings[K],
): A11ySettings {
  return { ...settings, [key]: settings[key] === value ? "none" : value };
}

function ToolButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`a11y-tool${active ? " is-active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="a11y-tool-icon" aria-hidden="true">
        {children}
      </span>
      <span className="a11y-tool-label">{label}</span>
    </button>
  );
}

export function AccessibilityWidget() {
  const { locale, dict } = useI18n();
  const t = dict.accessibility;
  const titleId = useId();
  const settings = useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getServerSnapshot);
  const isOpen = useSyncExternalStore(subscribeOpen, getOpenSnapshot, () => false);

  useEffect(() => {
    cachedSettings = readSettings();
    applySettings(cachedSettings);
    emit();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function update(next: A11ySettings) {
    writeSettings(next);
  }

  return (
    <>
      <button
        type="button"
        className="a11y-fab"
        aria-label={t.open}
        aria-expanded={isOpen}
        aria-controls="a11y-panel"
        data-testid="accessibility-button"
        onClick={() => setOpen(!isOpen)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
          <circle cx="12" cy="4.2" r="2.1" fill="currentColor" />
          <path
            fill="currentColor"
            d="M12 7.2c-3.4 0-6.2 1.1-6.2 2.5v1.1h2.2v8.5h2.4v-5.2h2.2v5.2h2.4V10.8h2.2V9.7c0-1.4-2.8-2.5-6.2-2.5Z"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className="a11y-overlay" role="presentation" onClick={() => setOpen(false)}>
          <section
            id="a11y-panel"
            className="a11y-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="a11y-panel-header">
              <h2 id={titleId}>{t.title}</h2>
              <button type="button" className="a11y-close" onClick={() => setOpen(false)}>
                {t.close} — X
              </button>
            </header>

            <div className="a11y-panel-body">
              <div className="a11y-stack">
                <ToolButton
                  active={settings.keyboardNav}
                  label={t.keyboardNav}
                  onClick={() => update(flipBoolean(settings, "keyboardNav"))}
                >
                  <Keyboard size={22} strokeWidth={1.75} />
                </ToolButton>
                <ToolButton
                  active={settings.reduceMotion}
                  label={t.reduceMotion}
                  onClick={() => update(flipBoolean(settings, "reduceMotion"))}
                >
                  <Ban size={22} strokeWidth={1.75} />
                </ToolButton>
              </div>

              <section className="a11y-section">
                <h3>{t.contrast}</h3>
                <div className="a11y-grid">
                  <ToolButton
                    active={settings.contrast === "inverted"}
                    label={t.contrastInverted}
                    onClick={() => update(flipExclusive(settings, "contrast", "inverted"))}
                  >
                    <Contrast size={22} strokeWidth={1.75} />
                  </ToolButton>
                  <ToolButton
                    active={settings.contrast === "light"}
                    label={t.contrastLight}
                    onClick={() => update(flipExclusive(settings, "contrast", "light"))}
                  >
                    <Sun size={22} strokeWidth={1.75} />
                  </ToolButton>
                  <ToolButton
                    active={settings.contrast === "mono"}
                    label={t.contrastMono}
                    onClick={() => update(flipExclusive(settings, "contrast", "mono"))}
                  >
                    <Contrast size={22} strokeWidth={1.75} className="opacity-70" />
                  </ToolButton>
                </div>
              </section>

              <section className="a11y-section">
                <h3>{t.textSize}</h3>
                <div className="a11y-grid">
                  <ToolButton
                    active={settings.readableFont}
                    label={t.readableFont}
                    onClick={() => update(flipBoolean(settings, "readableFont"))}
                  >
                    <Type size={22} strokeWidth={1.75} />
                  </ToolButton>
                  <ToolButton
                    label={t.decreaseFont}
                    onClick={() => update({ ...settings, fontScale: Math.max(-3, settings.fontScale - 1) })}
                  >
                    <span className="a11y-font-glyph">A−</span>
                  </ToolButton>
                  <ToolButton
                    label={t.increaseFont}
                    onClick={() => update({ ...settings, fontScale: Math.min(5, settings.fontScale + 1) })}
                  >
                    <span className="a11y-font-glyph">A+</span>
                  </ToolButton>
                </div>
              </section>

              <section className="a11y-section">
                <h3>{t.content}</h3>
                <div className="a11y-grid">
                  <ToolButton
                    active={settings.imageDescriptions}
                    label={t.imageDescriptions}
                    onClick={() => update(flipBoolean(settings, "imageDescriptions"))}
                  >
                    <ImageIcon size={22} strokeWidth={1.75} />
                  </ToolButton>
                  <ToolButton
                    active={settings.highlightHeadings}
                    label={t.highlightHeadings}
                    onClick={() => update(flipBoolean(settings, "highlightHeadings"))}
                  >
                    <Heading size={22} strokeWidth={1.75} />
                  </ToolButton>
                  <ToolButton
                    active={settings.highlightLinks}
                    label={t.highlightLinks}
                    onClick={() => update(flipBoolean(settings, "highlightLinks"))}
                  >
                    <Link2 size={22} strokeWidth={1.75} />
                  </ToolButton>
                </div>
              </section>

              <section className="a11y-section">
                <h3>{t.display}</h3>
                <div className="a11y-grid">
                  <ToolButton
                    active={settings.zoom}
                    label={t.zoom}
                    onClick={() => update(flipBoolean(settings, "zoom"))}
                  >
                    <ZoomIn size={22} strokeWidth={1.75} />
                  </ToolButton>
                  <ToolButton
                    active={settings.cursor === "black"}
                    label={t.cursorBlack}
                    onClick={() => update(flipExclusive(settings, "cursor", "black"))}
                  >
                    <MousePointer2 size={22} strokeWidth={1.75} />
                  </ToolButton>
                  <ToolButton
                    active={settings.cursor === "white"}
                    label={t.cursorWhite}
                    onClick={() => update(flipExclusive(settings, "cursor", "white"))}
                  >
                    <MousePointer2 size={22} strokeWidth={1.75} className="opacity-60" />
                  </ToolButton>
                </div>
              </section>

              <div className="a11y-stack">
                <a className="a11y-footer-link" href={localizedPath(locale, "/contact")}>
                  {t.report}
                </a>
                <button type="button" className="a11y-reset" onClick={() => update(defaults)}>
                  <RotateCcw size={16} aria-hidden="true" />
                  {t.reset}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
