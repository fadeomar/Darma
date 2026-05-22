import React from "react";
import { handleBackgroundStyle } from "./styles";
import { State } from "@/types/animatedBackgroundTypes";

interface PreviewProps {
  state: State;
}

const Preview: React.FC<PreviewProps> = ({ state }) => {
  const styleContent = handleBackgroundStyle(state);

  const renderParticles = () => {
    const elements = [];
    for (let i = 0; i < state.particleCount; i++) {
      if (state.variant === "particles" || state.variant === "custom") {
        elements.push(<span key={i} />);
      } else {
        elements.push(<li key={i} />);
      }
    }
    return elements;
  };

  return (
    <div
      className="preview-container w-full h-64 sm:h-80 md:h-96 relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
      style={{
        background:
          state.backgroundColor === "transparent"
            ? "#f3f4f6"
            : state.backgroundColor,
      }}
    >
      <style>{styleContent}</style>
      <div className="animated-background absolute inset-0">
        {renderParticles()}
      </div>
    </div>
  );
};

export default Preview;
