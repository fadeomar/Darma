// components/ToggleSwitch.tsx
import React from "react";
import "./ToggleSwitch.css";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLLabelElement>) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  onClick,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div className="toggle-container">
      {label && <span className="toggle-label">{label}</span>}
      <label className="switch" onClick={handleClick}>
        <input
          type="checkbox"
          checked={checked}
          onChange={handleInputChange}
          className="toggle"
          disabled={disabled}
        />
        <span className="slider" />
        <span className="card-side" />
      </label>
    </div>
  );
};

export default ToggleSwitch;
