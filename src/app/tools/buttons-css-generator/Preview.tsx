import React from "react";
import { handleStyle } from "./styles";
import { State } from "@/types/buttonGeneratorTypes";

interface PreviewProps {
  state: State;
}

const Preview: React.FC<PreviewProps> = ({ state }) => {
  const styleContent = handleStyle(state);
  return (
    <div className="relative flex min-h-[280px] w-full items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="soft-element soft-shadow">
        <style>{styleContent}</style>
        <button className="darma-button">{state.textPlaceholder}</button>
      </div>
    </div>
  );
};

export default Preview;
