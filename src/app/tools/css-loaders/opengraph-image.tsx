import { atlasOgContentType, atlasOgSize, createAtlasOgImage } from "@/features/visuals/og/createAtlasOgImage";
import { getTotalLoaderCount } from "./loader-hubs";

export const alt = "Darma CSS loaders gallery";
export const size = atlasOgSize;
export const contentType = atlasOgContentType;

export default function Image() {
  return createAtlasOgImage({
    eyebrow: "CSS gallery",
    title: "CSS Loaders, Spinners & Skeletons",
    description: `${getTotalLoaderCount()} free CSS loading animations. Customize color, size and speed, then copy CSS, React or Tailwind.`,
    labels: ["Spinners", "Skeletons", "Button loaders", "Tailwind"],
    symbol: "◐",
    accent: "teal",
  });
}
