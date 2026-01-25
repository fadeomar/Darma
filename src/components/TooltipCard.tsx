"use client"; // Required for client-side interactivity

import { useState } from "react";
// Define the Tooltip type
interface Tooltip {
  id: string;
  css: string;
  html?: string; // Optional since it’s commented out in your code
  text: string;
}

// const TooltipCard = ({ tooltip }) => {
const TooltipCard = ({ tooltip }: { tooltip: Tooltip }) => {
  const [tipPosition, setTipPosition] = useState(50); // Default tip position

  // Function to copy CSS to clipboard
  const copyCSS = () => {
    // Replace --p value in the CSS with the current tipPosition
    const updatedCSS = tooltip.css.replace(
      /--p:\s*\d+%;/,
      `--p: ${tipPosition}%;`
    );
    navigator.clipboard.writeText(updatedCSS.trim()).then(() => {
      alert("CSS copied to clipboard!");
    });
  };

  return (
    <div className="group relative bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow max-w-md mx-auto mb-6">
      {/* Tooltip Preview */}
      <div
        id={tooltip.id} // Use the ID from the JSON
        className="tooltip mb-4"
        style={{ "--p": `${tipPosition}%` } as React.CSSProperties}
        // dangerouslySetInnerHTML={{ __html: tooltip.html }}
      >
        <p style={{ color: "black" }}>{tooltip.text}</p>
      </div>
      {/* Range Input for Tip Position */}
      <div className="mb-4">
        <label
          htmlFor={`tip-position-${tooltip.id}`}
          className="block text-sm font-medium text-gray-700"
        >
          Tip Position
        </label>
        <input
          type="range"
          id={`tip-position-${tooltip.id}`}
          min="0"
          max="100"
          value={tipPosition}
          className="w-full"
          onChange={(e) => setTipPosition(Number(e.target.value))}
        />
      </div>

      {/* Copy Button (Visible on Hover) */}
      <button
        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-md transition-opacity"
        onClick={copyCSS}
      >
        Copy CSS
      </button>

      {/* Inject Dynamic CSS */}
      <style>{tooltip.css.replace(/\\n/g, "\n")}</style>
    </div>
  );
};

export default TooltipCard;
