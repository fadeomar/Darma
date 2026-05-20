"use client";
import React, { Dispatch, SetStateAction } from "react";

import { GradientsOptions, ShadowOptions } from "./Options";
import { GradientsDInputs, ShadowsDInputs } from "./Inputs";
import { State } from "@/types/buttonGeneratorTypes";
interface ConfigurationProps {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
}

const Configuration: React.FC<ConfigurationProps> = ({ state, setState }) => {
  return (
    <div className="soft-shadow flex flex-col rounded-[30px] p-5 text-left">
      <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-black/40">Settings</p>
      <div className="flex items-center gap-3 mb-5 font-bold text-[var(--textColor)]">
        {state.variant === "gradients" ? (
          <GradientsOptions state={state} setState={setState} />
        ) : (
          <ShadowOptions setState={setState} state={state} />
        )}
      </div>
      {(state.variant === "sliding" ||
        state.variant === "transition-on-hover") && (
        <div className="flex items-center gap-3 mb-5 font-bold text-[var(--textColor)]">
          <label>Slide Direction:</label>
          <select
            value={state.slideDirection}
            onChange={(e) =>
              setState((old) => ({ ...old, slideDirection: e.target.value }))
            }
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5 font-bold text-[var(--textColor)]">
        <label>Transition Easing:</label>
        <select
          value={state.easing}
          onChange={(e) =>
            setState((old) => ({ ...old, easing: e.target.value }))
          }
        >
          <option value="ease">Ease</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In Out</option>
          <option value="linear">Linear</option>
        </select>
      </div>

      {state.variant === "gradients" ? (
        <GradientsDInputs setState={setState} state={state} />
      ) : (
        <ShadowsDInputs setState={setState} state={state} />
      )}
    </div>
  );
};

export default Configuration;
