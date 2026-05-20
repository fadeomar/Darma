"use client";

import { useEffect, useState } from "react";
import InputSection from "./InputSection";
import PreviewSection from "./PreviewSection";
import type { ColorShade, ColorShadesParams } from "@/types";
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

  const handleParamsChange = (newParams: ColorShadesParams) => {
    setParams(newParams);
    setShades(generateShades(newParams));
  };

  useEffect(() => {
    const handleApplySuggestion = (event: Event) => {
      const customEvent = event as CustomEvent<{ color1: string; color2: string }>;
      const newParams = {
        ...params,
        color1: customEvent.detail.color1,
        color2: customEvent.detail.color2,
      };
      setParams(newParams);
      setShades(generateShades(newParams));
    };

    window.addEventListener("apply-suggestion", handleApplySuggestion);
    return () => window.removeEventListener("apply-suggestion", handleApplySuggestion);
  }, [params]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <PreviewSection shades={shades} />
      <InputSection params={params} onParamsChange={handleParamsChange} />
    </div>
  );
}
