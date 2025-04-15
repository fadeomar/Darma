import React, { ChangeEvent } from "react";
import { camelize } from "@/utils";

interface ConfigurationRowProps {
  label: string;
  type: string;
  value: number;
  min: string | number;
  max: string | number;
  step?: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ConfigurationRow: React.FC<ConfigurationRowProps> = ({
  label,
  type,
  value,
  min,
  max,
  step = "1",
  onChange,
}) => {
  return (
    <div className="row">
      <label htmlFor={camelize(label)} className="opacity-60 text-ms">
        {label}{" "}
      </label>
      <input
        type={type}
        name={camelize(label)}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        id={camelize(label)}
      />
    </div>
  );
};

export default ConfigurationRow;
