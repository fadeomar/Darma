"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import ConfigurationRow from "@/components/ConfigurationRow";
import ToggleSwitch from "@/components/ToggleSwitch";
import RainbowButton from "@/components/RainbowButton";
import ShadowSelectorButton from "./ShadowSelectorButton";
import { BoxShadowState, Shadow } from "@/types";
import BoxShadows from "./BoxShadows";

interface ConfigurationProps {
  state: BoxShadowState;
  setState: React.Dispatch<React.SetStateAction<BoxShadowState>>;
}

const Configuration: React.FC<ConfigurationProps> = ({ state, setState }) => {
  const [activeShadowId, setActiveShadowId] = useState<string>(
    state.shadows[0].id
  );

  // Renumber shadows sequentially with string IDs
  const getRenumberedShadows = (shadows: Shadow[]): Shadow[] => {
    return shadows.map((shadow, index) => ({
      ...shadow,
      id: `${index + 1}`, // Convert number to string
    }));
  };

  const addShadow = () => {
    const newShadow: Shadow = {
      id: `${state.shadows.length + 1}`, // Use string ID
      offsetX: 0,
      offsetY: 0,
      blur: 10,
      spread: 0,
      opacity: 0.5,
      color: "#000000",
      inset: false,
      distance: 10,
    };
    setState((prev) => ({
      ...prev,
      shadows: [...prev.shadows, newShadow],
    }));
    setActiveShadowId(newShadow.id);
  };

  const removeShadow = (id: string) => {
    const newShadows = state.shadows.filter((s) => s.id !== id);
    const renumberedShadows = getRenumberedShadows(newShadows);
    setState((prev) => ({
      ...prev,
      shadows: renumberedShadows,
    }));
    if (activeShadowId === id && renumberedShadows.length > 0) {
      setActiveShadowId(renumberedShadows[0].id);
    }
  };

  const updateShadow = (id: string, updates: Partial<Shadow>) => {
    setState((prev) => ({
      ...prev,
      shadows: prev.shadows.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  };

  const updateBox = (updates: Partial<BoxShadowState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const activeShadow =
    state.shadows.find((s) => s.id === activeShadowId) || state.shadows[0];

  useEffect(() => {
    if (
      state.shadows.length > 0 &&
      !state.shadows.some((s) => s.id === activeShadowId)
    ) {
      setActiveShadowId(state.shadows[0].id);
    }
  }, [state.shadows, activeShadowId]);

  const handleShadowSelect = (newState: BoxShadowState) => {
    setState(newState);
    if (newState.shadows.length > 0) {
      setActiveShadowId(newState.shadows[0].id);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Settings</h2>
      <BoxShadows
        onShadowSelect={handleShadowSelect}
        activeLightSource={state.activeLightSource}
      />

      {/* Shadow Selection */}
      <div className="mb-4 mt-10">
        <h3 className="text-base font-semibold mb-2">Shadows</h3>
        <div className="flex flex-wrap gap-2">
          {state.shadows.map((shadow, index) => (
            <ShadowSelectorButton
              key={shadow.id}
              label={`Shadow ${index + 1}`}
              isActive={activeShadowId === shadow.id}
              onClick={() => setActiveShadowId(shadow.id)}
              onRemove={() => removeShadow(shadow.id)}
            />
          ))}
          <div className="mt-8 w-full">
            <RainbowButton
              label="Add Shadow"
              isActive={false}
              handleClick={addShadow}
            />
          </div>
        </div>
      </div>

      {/* Active Shadow Controls */}
      {activeShadow && (
        <div className="space-y-2 text-sm">
          <h3 className="text-base font-semibold">Active Shadow Controls</h3>
          <ConfigurationRow
            label="Offset X"
            type="range"
            value={activeShadow.offsetX}
            min={-50}
            max={50}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateShadow(activeShadow.id, {
                offsetX: parseInt(e.target.value),
              })
            }
          />
          <ConfigurationRow
            label="Offset Y"
            type="range"
            value={activeShadow.offsetY}
            min={-50}
            max={50}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateShadow(activeShadow.id, {
                offsetY: parseInt(e.target.value),
              })
            }
          />
          <ConfigurationRow
            label="Blur Radius"
            type="range"
            value={activeShadow.blur}
            min={0}
            max={100}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateShadow(activeShadow.id, { blur: parseInt(e.target.value) })
            }
          />
          <ConfigurationRow
            label="Spread Radius"
            type="range"
            value={activeShadow.spread}
            min={-50}
            max={50}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateShadow(activeShadow.id, {
                spread: parseInt(e.target.value),
              })
            }
          />
          <ConfigurationRow
            label="Opacity"
            type="range"
            value={activeShadow.opacity * 100}
            min={0}
            max={100}
            step={1}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateShadow(activeShadow.id, {
                opacity: parseInt(e.target.value) / 100,
              })
            }
          />
          <ConfigurationRow
            label="Distance"
            type="range"
            value={activeShadow.distance}
            min={0}
            max={100}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateShadow(activeShadow.id, {
                distance: parseInt(e.target.value),
              })
            }
          />
          <div className="flex items-center gap-2">
            <label className="opacity-60 text-sm">Color</label>
            <input
              type="color"
              value={activeShadow.color}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateShadow(activeShadow.id, { color: e.target.value })
              }
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          <ToggleSwitch
            label="Inset"
            checked={activeShadow.inset}
            onChange={() =>
              updateShadow(activeShadow.id, { inset: !activeShadow.inset })
            }
          />
        </div>
      )}

      {/* Box Controls */}
      <div className="mt-4 space-y-2 text-sm">
        <h3 className="text-base font-semibold">Box Properties</h3>
        <ConfigurationRow
          label="Box Size"
          type="range"
          value={state.boxSize}
          min={50}
          max={400}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateBox({ boxSize: parseInt(e.target.value) })
          }
        />
        <ConfigurationRow
          label="Border Radius"
          type="range"
          value={state.borderRadius}
          min={0}
          max={100}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateBox({ borderRadius: parseInt(e.target.value) })
          }
        />
        <div className="flex items-center gap-2">
          <label className="opacity-60 text-sm">Background Color</label>
          <input
            type="color"
            value={state.backgroundColor}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateBox({ backgroundColor: e.target.value })
            }
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default Configuration;
