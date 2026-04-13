export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const trackEvent = (
  action: string,
  params: Record<string, string | number | boolean | undefined> = {},
) => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", action, params);
};
