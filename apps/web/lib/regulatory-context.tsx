"use client";

import { createContext, useContext, useCallback } from "react";
import type { Lang } from "./i18n";

export interface RegulatoryContextValue {
  regulatoryContext: "saudi" | "india";
  preferredLanguage: Lang;
  setPreferredLanguage: (lang: Lang) => void;
}

export const RegulatoryContext = createContext<RegulatoryContextValue>({
  regulatoryContext: "saudi",
  preferredLanguage: "en",
  setPreferredLanguage: () => {},
});

export function useRegulatoryContext() {
  return useContext(RegulatoryContext);
}
