"use client";

import { Globe } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/lib/language";

export function LanguageSelector({
  value,
  onChange,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-2 mb-1.5 text-[var(--fg-secondary)]">
        <Globe className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Response language</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        className="w-full px-3 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md text-[var(--fg-primary)] hover:border-cyan-500/40 focus:border-cyan-500/60 focus:outline-none transition cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native}
            {lang.code !== "en" ? ` · ${lang.name}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}