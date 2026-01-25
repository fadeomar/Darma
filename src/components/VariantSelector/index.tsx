// VariantSelector.tsx
import React, { CSSProperties } from "react";
import "./style.css";
import RainbowButton from "../RainbowButton";
import Title from "../Title";

interface VariantSelectorProps {
  label: string;
  variants: string[];
  selected: string;
  handleSelect: (variant: string) => void;
}

const VariantSelector = ({
  label,
  variants,
  selected,
  handleSelect,
}: VariantSelectorProps) => {
  return (
    <div className="variant-selector-container">
      <Title
        variant="h4"
        as="h2"
        label={label}
        className="custom-class"
        style={{ "--angle": "90deg" } as CSSProperties}
      />
      <div className="checkbox-group">
        {variants.map((v) => (
          <RainbowButton
            key={v}
            label={v}
            isActive={selected === v}
            handleClick={() => handleSelect(v)}
          />
        ))}
      </div>
    </div>
  );
};

export default VariantSelector;
