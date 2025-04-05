export function colorLuminance(hex: string, lum: number = 0): string {
  // validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, "");
  if (hex.length < 6) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // convert to decimal and change luminosity
  let rgb = "#";
  for (let i = 0; i < 3; i++) {
    const c = parseInt(hex.substr(i * 2, 2), 16);
    const adjusted = Math.round(
      Math.min(Math.max(0, c + c * lum), 255)
    ).toString(16);
    rgb += ("00" + adjusted).substr(adjusted.length);
  }

  return rgb;
}

export function getContrast(hex: string): string {
  const r = parseInt(hex.substr(1, 2), 16),
    g = parseInt(hex.substr(3, 2), 16),
    b = parseInt(hex.substr(5, 2), 16),
    yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#001f3f" : "#F6F5F7";
}

export const isValidColor = (hex: string): boolean =>
  /^#[0-9A-F]{6}$/i.test(hex);

export const getColorFromRoute = (): string | undefined => {
  if (window.location.hash) {
    if (/^#[0-9A-F]{6}$/i.test(window.location.hash)) {
      return window.location.hash;
    }
  }
  return undefined;
};

interface Size {
  maxSize: number;
  size: number;
}

export const getSizes = (): Size => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  if (
    (windowWidth < 1000 || windowHeight < 860) &&
    window.navigator.userAgent !== "ReactSnap"
  ) {
    if (windowWidth < 800) {
      return windowWidth < 680
        ? { maxSize: 180, size: 150 }
        : { maxSize: 250, size: 200 };
    }
    return { maxSize: 350, size: 250 };
  }
  return { maxSize: 410, size: 300 };
};

export const camelize = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
};
