
import React from "react";
import "./style.css";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    if (!disabled) onChange(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (!disabled && onClick) onClick(e);
  };

  return (
    <label className="darma-toggle" onClick={handleClick}>
      {label ? <span className="darma-toggle__label">{label}</span> : null}
      <input
        type="checkbox"
        checked={checked}
        onChange={handleInputChange}
        className="darma-toggle__input"
        disabled={disabled}
      />
      <span className="darma-toggle__track" aria-hidden>
        <span className="darma-toggle__thumb" />
      </span>
    </label>
  );
};

export default ToggleSwitch;
