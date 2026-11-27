"use client";

import { useEffect, useRef, useState } from "react";

export type ThemeId =
  | "dark" | "jade" | "dodger" | "vanilla" | "crimson"
  | "tw-ink" | "tw-midnight" | "tw-pine" | "tw-plum" | "tw-wine"
  | "tw-ember" | "tw-abyss" | "tw-royal" | "tw-lime" | "tw-orchid"
  | "tw-paper" | "tw-mist" | "tw-sage" | "tw-blush" | "tw-sky"
  | "tw-lilac" | "tw-sand" | "tw-mint" | "tw-peach" | "tw-stone";

type ThemeOption = {
  id: ThemeId;
  name: string;
  badge: string;
  swatch: string;
  accent: string;
  dark: boolean;
};

const THEMES: ThemeOption[] = [
  {
    id: "dark",
    name: "Dark Mode",
    badge: "Onyx",
    swatch: "linear-gradient(135deg, #0a0c10 50%, #181c24 50%)",
    accent: "#3b82f6",
    dark: true,
  },
  {
    id: "jade",
    name: "Jade Green",
    badge: "Jade",
    swatch: "linear-gradient(135deg, #081410 50%, #10b981 50%)",
    accent: "#10b981",
    dark: true,
  },
  {
    id: "dodger",
    name: "Dodger Blue",
    badge: "Dodger",
    swatch: "linear-gradient(135deg, #081020 50%, #0284c7 50%)",
    accent: "#0284c7",
    dark: true,
  },
  {
    id: "vanilla",
    name: "Vanilla",
    badge: "Cream",
    swatch: "linear-gradient(135deg, #f5f0e6 50%, #ca8a04 50%)",
    accent: "#ca8a04",
    dark: false,
  },
  {
    id: "crimson",
    name: "Black Red",
    badge: "Crimson",
    swatch: "linear-gradient(135deg, #12090c 50%, #e11d48 50%)",
    accent: "#e11d48",
    dark: true,
  },
  // tweakcn style palettes: ten dark, ten bright
  { id: "tw-ink", name: "Ink Indigo", badge: "Ink", swatch: "linear-gradient(135deg, #0a0b10 50%, #818cf8 50%)", accent: "#818cf8", dark: true },
  { id: "tw-midnight", name: "Midnight", badge: "Midnight", swatch: "linear-gradient(135deg, #070b14 50%, #38bdf8 50%)", accent: "#38bdf8", dark: true },
  { id: "tw-pine", name: "Pine", badge: "Pine", swatch: "linear-gradient(135deg, #07100b 50%, #34d399 50%)", accent: "#34d399", dark: true },
  { id: "tw-plum", name: "Plum", badge: "Plum", swatch: "linear-gradient(135deg, #0c0812 50%, #a78bfa 50%)", accent: "#a78bfa", dark: true },
  { id: "tw-wine", name: "Wine", badge: "Wine", swatch: "linear-gradient(135deg, #120a0d 50%, #fb7185 50%)", accent: "#fb7185", dark: true },
  { id: "tw-ember", name: "Ember", badge: "Ember", swatch: "linear-gradient(135deg, #0f0b08 50%, #fbbf24 50%)", accent: "#fbbf24", dark: true },
  { id: "tw-abyss", name: "Abyss", badge: "Abyss", swatch: "linear-gradient(135deg, #061014 50%, #22d3ee 50%)", accent: "#22d3ee", dark: true },
  { id: "tw-royal", name: "Royal", badge: "Royal", swatch: "linear-gradient(135deg, #080d1c 50%, #60a5fa 50%)", accent: "#60a5fa", dark: true },
  { id: "tw-lime", name: "Lime", badge: "Lime", swatch: "linear-gradient(135deg, #0b0e07 50%, #a3e635 50%)", accent: "#a3e635", dark: true },
  { id: "tw-orchid", name: "Orchid", badge: "Orchid", swatch: "linear-gradient(135deg, #120812 50%, #e879f9 50%)", accent: "#e879f9", dark: true },
  { id: "tw-paper", name: "Paper", badge: "Paper", swatch: "linear-gradient(135deg, #f6f4ee 50%, #1d4ed8 50%)", accent: "#1d4ed8", dark: false },
  { id: "tw-mist", name: "Mist", badge: "Mist", swatch: "linear-gradient(135deg, #f4f6f9 50%, #2563eb 50%)", accent: "#2563eb", dark: false },
  { id: "tw-sage", name: "Sage", badge: "Sage", swatch: "linear-gradient(135deg, #f3f6f1 50%, #059669 50%)", accent: "#059669", dark: false },
  { id: "tw-blush", name: "Blush", badge: "Blush", swatch: "linear-gradient(135deg, #faf3f1 50%, #be185d 50%)", accent: "#be185d", dark: false },
  { id: "tw-sky", name: "Sky", badge: "Sky", swatch: "linear-gradient(135deg, #f2f7fb 50%, #0284c7 50%)", accent: "#0284c7", dark: false },
  { id: "tw-lilac", name: "Lilac", badge: "Lilac", swatch: "linear-gradient(135deg, #f6f4fa 50%, #7c3aed 50%)", accent: "#7c3aed", dark: false },
  { id: "tw-sand", name: "Sand", badge: "Sand", swatch: "linear-gradient(135deg, #f2f1ec 50%, #0d9488 50%)", accent: "#0d9488", dark: false },
  { id: "tw-mint", name: "Mint", badge: "Mint", swatch: "linear-gradient(135deg, #f1f8f5 50%, #0f766e 50%)", accent: "#0f766e", dark: false },
  { id: "tw-peach", name: "Peach", badge: "Peach", swatch: "linear-gradient(135deg, #fdf4ef 50%, #ea580c 50%)", accent: "#ea580c", dark: false },
  { id: "tw-stone", name: "Stone", badge: "Stone", swatch: "linear-gradient(135deg, #f5f4f1 50%, #4f46e5 50%)", accent: "#4f46e5", dark: false },
];

const STORAGE_KEY = "li_x_analyzer_theme";

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("dark");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize theme from localStorage or document attribute
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        setCurrentTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        const existing = document.documentElement.getAttribute("data-theme") as ThemeId | null;
        if (existing && THEMES.some((t) => t.id === existing)) {
          setCurrentTheme(existing);
        }
      }
    } catch {
      // localStorage unavailable in private sandbox
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectTheme = (id: ThemeId) => {
    setCurrentTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    // Collapse back immediately after selection
    setIsOpen(false);
  };

  const activeOption = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div
      ref={containerRef}
      className={`theme-switcher-wrapper ${isOpen ? "open" : "collapsed"}`}
      style={{
        position: "fixed",
        top: 14,
        right: 18,
        zIndex: 1000,
      }}
    >
      {!isOpen ? (
        // Collapsed state: Compact pill taking very little space
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="theme-trigger-btn"
          aria-label="Change color theme"
          title={`Theme: ${activeOption.name} (click to expand color palette)`}
        >
          <span
            className="theme-swatch-dot"
            style={{
              background: activeOption.accent,
              boxShadow: `0 0 8px ${activeOption.accent}80`,
            }}
          />
          <span className="theme-trigger-label">{activeOption.badge}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="theme-chevron"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      ) : (
        // Expanded horizontal palette section
        <div className="theme-palette-bar" role="radiogroup" aria-label="Color Palette">
          <div className="theme-palette-header">
            <span className="theme-palette-icon">🎨</span>
            <span className="theme-palette-title">Palette</span>
          </div>

          <div className="theme-options-row">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => selectTheme(theme.id)}
                  className={`theme-option-pill ${isSelected ? "selected" : ""}`}
                  title={`${theme.name}${isSelected ? " (Active)" : ""}`}
                >
                  <span
                    className="theme-option-swatch"
                    style={{
                      background: theme.swatch,
                      borderColor: isSelected ? theme.accent : "rgba(158,178,214,.3)",
                    }}
                  />
                  <span className="theme-option-name">{theme.name}</span>
                  {isSelected && (
                    <span
                      className="theme-active-dot"
                      style={{ background: theme.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="theme-close-btn"
            aria-label="Close palette"
            title="Collapse"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
