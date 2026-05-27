"use client";

import { useState } from "react";
import { Button, Card, Field, Slider } from "@/components/ui";

interface Tooltip {
  id: string;
  css: string;
  html?: string;
  text: string;
}

const TooltipCard = ({ tooltip }: { tooltip: Tooltip }) => {
  const [tipPosition, setTipPosition] = useState(50);

  const copyCSS = () => {
    const updatedCSS = tooltip.css.replace(
      /--p:\s*\d+%;/,
      `--p: ${tipPosition}%;`,
    );
    navigator.clipboard.writeText(updatedCSS.trim()).then(() => {
      alert("CSS copied to clipboard!");
    });
  };

  return (
    <Card className="group relative mx-auto mb-6 max-w-md" padding="md">
      <div
        id={tooltip.id}
        className="tooltip mb-4"
        style={{ "--p": `${tipPosition}%` } as React.CSSProperties}
      >
        <p style={{ color: "black" }}>{tooltip.text}</p>
      </div>

      <Field label="Tip position" valueMeta={`${tipPosition}%`}>
        <Slider
          id={`tip-position-${tooltip.id}`}
          min={0}
          max={100}
          value={tipPosition}
          onChange={(e) => setTipPosition(Number(e.target.value))}
        />
      </Field>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="soft" size="sm" onClick={copyCSS}>
          Copy CSS
        </Button>
      </div>

      <style>{tooltip.css.replace(/\\n/g, "\n")}</style>
    </Card>
  );
};

export default TooltipCard;
