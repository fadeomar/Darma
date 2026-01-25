import { CheckCircle } from "lucide-react";
import "./style.css";

interface RainbowButtonProps {
  handleClick: () => void;
  isActive: boolean;
  label: string;
}

const RainbowButton = ({
  handleClick,
  isActive,
  label,
}: RainbowButtonProps) => {
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`self-center mb-2 w-full flex items-center justify-center group relative p-3 rounded-lg transition duration-300 font-bold shadow-md hover:shadow-lg hover:scale-105 focus:outline-none text-xs uppercase ${
        isActive
          ? "rainbow-border-active text-green-700"
          : "rainbow-border bg-white hover:bg-gray-100 text-gray-800"
      } max-h-fit`}
    >
      <span className={isActive ? "selected-content" : ""}>{label}</span>
      {isActive && (
        <CheckCircle
          className="absolute -top-2 -left-2 w-5 h-5 text-green-500 bg-white rounded-full"
          fill="black"
        />
      )}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition z-50">
        {label}
      </span>
    </button>
  );
};

export default RainbowButton;
