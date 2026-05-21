'use client';

import { create } from 'zustand';

interface UIState {
  pageTitle: string;
  pageSubtitle: string | null;
  setPageTitle: (title: string, subtitle?: string | null) => void;
  resetPageTitle: () => void;
}

const DEFAULT_TITLE = 'EstateFlow';

export const useUIStore = create<UIState>((set) => ({
  pageTitle: DEFAULT_TITLE,
  pageSubtitle: null,
  setPageTitle: (title, subtitle = null) => set({ pageTitle: title, pageSubtitle: subtitle }),
  resetPageTitle: () => set({ pageTitle: DEFAULT_TITLE, pageSubtitle: null }),
}));
