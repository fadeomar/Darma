export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

export const isGoogleAnalyticsEnabled = /^G-[A-Z0-9]+$/.test(
  GA_MEASUREMENT_ID,
);

type GtagCommand = [command: string, ...args: unknown[]];

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: GtagCommand) => void;
  }
}

function ensureGtagQueue() {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: GtagCommand) {
      window.dataLayer.push(args);
    };
}

export const pageview = (url: string) => {
  if (!isGoogleAnalyticsEnabled || typeof window === "undefined") {
    return;
  }

  ensureGtagQueue();

  window.gtag("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const trackEvent = (
  action: string,
  params: Record<string, string | number | boolean | undefined> = {},
) => {
  if (!isGoogleAnalyticsEnabled || typeof window === "undefined") {
    return;
  }

  ensureGtagQueue();
  window.gtag("event", action, {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  });
};
