"use client";

import { useState, useEffect } from "react";
import InputSection from "./InputSection";
import PreviewSection from "./PreviewSection";
import { ColorShadesParams, ColorShade } from "@/types";
import { generateShades } from "@/utils/color-shades";

export default function ColorShadesClient({
  initialParams,
  initialShades,
}: {
  initialParams: ColorShadesParams;
  initialShades: ColorShade[];
}) {
  const [params, setParams] = useState<ColorShadesParams>(initialParams);
  const [shades, setShades] = useState<ColorShade[]>(initialShades);

  // Handle params change from InputSection
  const handleParamsChange = (newParams: ColorShadesParams) => {
    setParams(newParams);
    setShades(generateShades(newParams));
  };

  // Listen for apply-suggestion event from SuggestionsSection
  useEffect(() => {
    const handleApplySuggestion = (event: Event) => {
      const customEvent = event as CustomEvent<{
        color1: string;
        color2: string;
      }>;
      const newParams = {
        ...params,
        color1: customEvent.detail.color1,
        color2: customEvent.detail.color2,
      };
      setParams(newParams);
      setShades(generateShades(newParams));
    };

    window.addEventListener("apply-suggestion", handleApplySuggestion);
    return () => {
      window.removeEventListener("apply-suggestion", handleApplySuggestion);
    };
  }, [params]);

  // Apply linear gradient to body background when shades change
  useEffect(() => {
    if (shades.length > 0) {
      const gradient = `linear-gradient(to right, ${shades
        .map((shade) => shade.hex)
        .join(", ")})`;
      document.body.style.background = gradient;
    } else {
      // Fallback background when no shades
      document.body.style.background =
        "linear-gradient(to bottom right, #f9fafb, #e5e7eb)";
    }

    // Cleanup: Reset body background on unmount
    return () => {
      document.body.style.background =
        "linear-gradient(to bottom right, #f9fafb, #e5e7eb)";
    };
  }, [shades]);

  return (
    <>
      <div className="lg:col-span-1">
        <InputSection params={params} onParamsChange={handleParamsChange} />
      </div>
      <div className="lg:col-span-2">
        <PreviewSection shades={shades} />
      </div>
    </>
  );
}
