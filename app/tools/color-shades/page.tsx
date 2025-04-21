import ColorShadesArticle from "./ColorShadesArticle";
import { ColorShadesParams } from "@/types";
import { generateShades } from "@/utils/color-shades";
import dynamic from "next/dynamic";

const DEFAULT_PARAMS: ColorShadesParams = {
  color1: "#ffffff",
  color2: "#000000",
  steps: 5,
};

const ColorShadesClient = dynamic(() => import("./ColorShadesClient"), {
  loading: () => (
    <div className="animate-pulse h-64 bg-gray-200 rounded-xl shadow-md" />
  ),
});

const SuggestionsSection = dynamic(() => import("./SuggestionsSection"), {
  loading: () => (
    <div className="animate-pulse h-48 bg-gray-200 rounded-xl shadow-md mt-8" />
  ),
});

export default function ColorShadesGenerator() {
  const initialShades = generateShades(DEFAULT_PARAMS);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12  bg-transparent min-h-screen">
      {/* Header with enhanced styling */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Color Shades Generator
        </h1>
        <p className="text-xl text-gray-600 mt-2 max-w-2xl mx-auto bg-yellow-300">
          Craft stunning color gradients effortlessly between any two colors for
          your next design project.
        </p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ColorShadesClient
          initialParams={DEFAULT_PARAMS}
          initialShades={initialShades}
        />
      </div>

      {/* Suggestions Section */}
      <section className="mt-12">
        <SuggestionsSection />
      </section>

      {/* Article Section */}
      <section className="mt-16">
        <ColorShadesArticle />
      </section>
    </div>
  );
}
