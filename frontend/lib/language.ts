"use client";

import { useEffect, useState } from "react";

export type LanguageCode =
  | "en" | "ur" | "ar" | "hi" | "es" | "fr" | "de" | "it" | "pt" | "ru"
  | "zh" | "ja" | "ko" | "tr" | "nl" | "pl" | "sv" | "id" | "th" | "vi"
  | "bn" | "ta" | "te" | "mr" | "ml" | "gu" | "kn" | "fa" | "he" | "el"
  | "cs" | "ro" | "hu" | "uk" | "fil" | "ms" | "sw";

export interface LanguageOption {
  code: LanguageCode;
  name: string;     // English name
  native: string;   // Native name in its own script
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en",  name: "English",     native: "English" },
  { code: "ur",  name: "Urdu",        native: "اردو" },
  { code: "ar",  name: "Arabic",      native: "العربية" },
  { code: "hi",  name: "Hindi",       native: "हिन्दी" },
  { code: "es",  name: "Spanish",     native: "Español" },
  { code: "fr",  name: "French",      native: "Français" },
  { code: "de",  name: "German",      native: "Deutsch" },
  { code: "it",  name: "Italian",     native: "Italiano" },
  { code: "pt",  name: "Portuguese",  native: "Português" },
  { code: "ru",  name: "Russian",     native: "Русский" },
  { code: "zh",  name: "Chinese",     native: "中文" },
  { code: "ja",  name: "Japanese",    native: "日本語" },
  { code: "ko",  name: "Korean",      native: "한국어" },
  { code: "tr",  name: "Turkish",     native: "Türkçe" },
  { code: "nl",  name: "Dutch",       native: "Nederlands" },
  { code: "pl",  name: "Polish",      native: "Polski" },
  { code: "sv",  name: "Swedish",     native: "Svenska" },
  { code: "id",  name: "Indonesian",  native: "Bahasa Indonesia" },
  { code: "th",  name: "Thai",        native: "ไทย" },
  { code: "vi",  name: "Vietnamese",  native: "Tiếng Việt" },
  { code: "bn",  name: "Bengali",     native: "বাংলা" },
  { code: "ta",  name: "Tamil",       native: "தமிழ்" },
  { code: "te",  name: "Telugu",      native: "తెలుగు" },
  { code: "mr",  name: "Marathi",     native: "मराठी" },
  { code: "ml",  name: "Malayalam",   native: "മലയാളം" },
  { code: "gu",  name: "Gujarati",    native: "ગુજરાતી" },
  { code: "kn",  name: "Kannada",     native: "ಕನ್ನಡ" },
  { code: "fa",  name: "Persian",     native: "فارسی" },
  { code: "he",  name: "Hebrew",      native: "עברית" },
  { code: "el",  name: "Greek",       native: "Ελληνικά" },
  { code: "cs",  name: "Czech",       native: "Čeština" },
  { code: "ro",  name: "Romanian",    native: "Română" },
  { code: "hu",  name: "Hungarian",   native: "Magyar" },
  { code: "uk",  name: "Ukrainian",   native: "Українська" },
  { code: "fil", name: "Filipino",    native: "Filipino" },
  { code: "ms",  name: "Malay",       native: "Bahasa Melayu" },
  { code: "sw",  name: "Swahili",     native: "Kiswahili" },
];

const STORAGE_KEY = "genai-agent-language";

export function useLanguage() {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGES.some((l) => l.code === stored)) {
        setLanguageState(stored as LanguageCode);
      }
    } catch {
      /* localStorage unavailable */
    }
    setReady(true);
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* noop */
    }
  };

  return { language, setLanguage, ready };
}