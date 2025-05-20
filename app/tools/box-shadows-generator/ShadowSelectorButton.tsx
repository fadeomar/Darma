// components/ShadowSelectorButton.tsx
import React from "react";
import { XCircle } from "lucide-react";

interface ShadowSelectorButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

const ShadowSelectorButton: React.FC<ShadowSelectorButtonProps> = ({
  label,
  isActive,
  onClick,
  onRemove,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-500 text-white shadow-md"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        {label}
      </button>
      <XCircle
        className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
        onClick={onRemove}
      />
    </div>
  );
};

export default ShadowSelectorButton;
