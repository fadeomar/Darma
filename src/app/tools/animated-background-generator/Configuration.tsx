"use client";

import React, { Dispatch, SetStateAction } from "react";
import { State } from "@/types/animatedBackgroundTypes";
import Title from "@/components/Title";

interface ConfigurationProps {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
}

const Configuration: React.FC<ConfigurationProps> = ({ state, setState }) => {
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...state.colors];
    newColors[index] = color;
    setState({ ...state, colors: newColors });
  };

  const addColor = () => {
    if (state.colors.length < 5) {
      setState({
        ...state,
        colors: [
          ...state.colors,
          `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`,
        ],
      });
    }
  };

  const removeColor = (index: number) => {
    if (state.colors.length > 1) {
      const newColors = [...state.colors];
      newColors.splice(index, 1);
      setState({ ...state, colors: newColors });
    }
  };

  return (
    <div className="configuration p-8 w-full bg-white bg-opacity-90 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <Title
        variant="h4"
        label="Background Settings"
        className="mb-6 text-lg font-semibold text-gray-900"
      />

      {/* Background Color */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Background Color
        </label>
        <input
          type="color"
          value={state.backgroundColor}
          onChange={(e) =>
            setState({ ...state, backgroundColor: e.target.value })
          }
          className="w-full h-10 rounded-md cursor-pointer"
        />
      </div>

      {/* Particle Count */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Particle Count: {state.particleCount}
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={state.particleCount}
          onChange={(e) =>
            setState({ ...state, particleCount: parseInt(e.target.value) })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Particle Size */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Particle Size
        </label>
        <select
          value={state.particleSize}
          onChange={(e) => setState({ ...state, particleSize: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10px">Small (10px)</option>
          <option value="20px">Medium (20px)</option>
          <option value="30px">Large (30px)</option>
          <option value="10vmin">Responsive Small (10vmin)</option>
          <option value="20vmin">Responsive Medium (20vmin)</option>
          <option value="30vmin">Responsive Large (30vmin)</option>
        </select>
      </div>

      {/* Particle Shape */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Particle Shape
        </label>
        <select
          value={state.particleShape}
          onChange={(e) =>
            setState({
              ...state,
              particleShape: e.target.value as "circle" | "square" | "triangle",
            })
          }
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
        </select>
      </div>

      {/* Animation Duration */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Animation Duration: {parseInt(state.animationDuration)} seconds
        </label>
        <input
          type="range"
          min="5"
          max="60"
          value={parseInt(state.animationDuration)}
          onChange={(e) =>
            setState({ ...state, animationDuration: `${e.target.value}s` })
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Animation Timing */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Animation Timing
        </label>
        <select
          value={state.animationTiming}
          onChange={(e) =>
            setState({ ...state, animationTiming: e.target.value })
          }
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="linear">Linear</option>
          <option value="ease">Ease</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In Out</option>
        </select>
      </div>

      {/* Particle Colors */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Particle Colors
        </label>
        <div className="space-y-3">
          {state.colors.map((color, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                className="h-8 w-8 rounded-md cursor-pointer"
              />
              <span className="text-sm text-gray-600">{color}</span>
              {state.colors.length > 1 && (
                <button
                  onClick={() => removeColor(index)}
                  className="ml-auto px-3 py-1 bg-red-100 text-red-600 rounded-md text-sm hover:bg-red-200 transition"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {state.colors.length < 5 && (
            <button
              onClick={addColor}
              className="mt-3 px-4 py-2 bg-blue-100 text-blue-600 rounded-md text-sm hover:bg-blue-200 transition"
            >
              + Add Color
            </button>
          )}
        </div>
      </div>

      {/* Variant-specific options */}
      {state.variant === "bubbles" && (
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="morphToCircle"
            checked={state.morphToCircle ?? true}
            onChange={(e) =>
              setState({ ...state, morphToCircle: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="morphToCircle"
            className="ml-2 block text-sm text-gray-700"
          >
            Morph to Circle
          </label>
        </div>
      )}

      {state.variant === "explosion" && (
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Max Scale: {state.maxScale ?? 20}x
          </label>
          <input
            type="range"
            min="5"
            max="30"
            value={state.maxScale ?? 20}
            onChange={(e) =>
              setState({ ...state, maxScale: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export default Configuration;
