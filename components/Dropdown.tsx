/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Dropdown.tsx
import React from "react";
import Select, { MultiValue, SingleValue, ActionMeta } from "react-select";

// Define the type for dropdown options
export interface DropdownOption {
  value: string;
  label: string;
}

// Define the props for the Dropdown component
interface DropdownProps {
  options: DropdownOption[];
  value: MultiValue<DropdownOption> | SingleValue<DropdownOption>; // Updated to support both
  onChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>, // Updated parameter name and type
    actionMeta: ActionMeta<DropdownOption>
  ) => void;
  placeholder?: string;
  isMulti?: boolean;
  isDisabled?: boolean;
}

const customStyles = {
  control: (provided: any) => ({
    ...provided,
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#888",
    },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#007bff" : "white",
    color: state.isSelected ? "white" : "black",
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  }),
};

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isMulti = true,
  isDisabled = false,
}) => {
  return (
    <Select
      styles={customStyles}
      isMulti={isMulti}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      className="w-full"
      classNamePrefix="react-select"
    />
  );
};

export default Dropdown;
