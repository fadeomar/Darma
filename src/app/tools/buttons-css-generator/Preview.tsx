import React from "react";
import { handleStyle } from "./styles";
import { State } from "@/types/buttonGeneratorTypes";

interface PreviewProps {
  state: State;
}

const Preview: React.FC<PreviewProps> = ({ state }) => {
  const styleContent = handleStyle(state);
  return (
    <div className="preview">
      <div className="soft-element soft-shadow max-w-[200px] md:max-w-none max-h-[200px] md:max-h-none">
        <style>{styleContent}</style>
        <button className="darma-button">{state.textPlaceholder}</button>
      </div>
    </div>
  );
};

export default Preview;
