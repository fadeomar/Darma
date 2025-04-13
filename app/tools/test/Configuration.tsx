"use client";
import React, { Dispatch, SetStateAction } from "react";

import { GradientsOptions, ShadowOptions } from "./Options";
import { GradientsDInputs, ShadowsDInputs } from "./Inputs";
import Title from "@/components/Title";
import { State } from "@/types/buttonGeneratorTypes";
interface ConfigurationProps {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
}

const Configuration: React.FC<ConfigurationProps> = ({ state, setState }) => {
  return (
    <div className="configuration soft-shadow">
      <Title variant="h4" label="Settings" />
      <div className="row">
        {state.variant === "gradients" ? (
          <GradientsOptions state={state} setState={setState} />
        ) : (
          <ShadowOptions setState={setState} state={state} />
        )}
      </div>
      {(state.variant === "sliding" ||
        state.variant === "transition-on-hover") && (
        <div className="row">
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

      <div className="row">
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
