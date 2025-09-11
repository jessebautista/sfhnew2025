/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface Window {
    Funraise?: {
      popup: (options?: any) => void;
      init: (config: any) => void;
    };
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export {};
