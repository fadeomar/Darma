"use client";

import { useState } from "react";
import { copyToClipboard } from "@/utils/color-shades";
import { ColorShade } from "@/types";

interface PreviewSectionProps {
  shades: ColorShade[];
}

export default function PreviewSection({ shades }: PreviewSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  if (shades.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
        Enter valid colors to generate shades
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Color Shades Preview
      </h2>
      <div className="flex h-64 rounded-md overflow-hidden border border-gray-200">
        {shades.map((shade, index) => (
          <div
            key={index}
            className="flex-1 relative group transition-all duration-200 hover:flex-1.5"
            style={{ backgroundColor: shade.hex }}
            onClick={() => handleCopy(shade.hex, index)}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 cursor-pointer">
              <div className="bg-white px-3 py-1 rounded-md text-sm font-medium shadow">
                {copiedIndex === index ? "Copied!" : shade.hex}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {shades.map((shade, index) => (
          <div
            key={index}
            className="border rounded-md p-2 text-xs cursor-pointer hover:bg-gray-50"
            onClick={() => handleCopy(shade.hex, index)}
          >
            <div className="flex items-center mb-1">
              <div
                className="w-4 h-4 rounded-sm mr-2 border border-gray-200"
                style={{ backgroundColor: shade.hex }}
              />
              <span className="font-mono">{shade.hex}</span>
            </div>
            <div className="text-gray-500 font-mono truncate">{shade.rgb}</div>
            <div className="text-gray-500 font-mono truncate">{shade.hsl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
