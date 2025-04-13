"use client";
import React, { Dispatch, SetStateAction } from "react";
import { _ColorsOptions, buttonGradients } from "./data";
import { State } from "./Inputs";
interface _OptionsProps {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
}
export function GradientsOptions({ state, setState }: _OptionsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mt-2 mb-5">
      {buttonGradients.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            setState((old: State) => ({
              ...old,
              color1: item.color1,
              p1: item.p1,
              p2: item.p2,
              color2: item.color2,
              degree: item.degree,
            }));
          }}
          className={`w-14 h-14 rounded-full transition-all duration-300 transform 
            ${
              state.color1 === item.color1 && state.color2 === item.color2
                ? "ring-4 ring-yellow-500 scale-110"
                : ""
            }
          `}
          style={{
            backgroundImage: `linear-gradient(${item.degree}, ${item.color1} ${item.p1}, ${item.color2} ${item.p2})`,
          }}
        />
      ))}
    </div>
  );
}

export function ShadowOptions({ setState, state }: _OptionsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mt-2 mb-5">
      {_ColorsOptions.map((item, index) => (
        <React.Fragment key={item.bgColor}>
          <style>
            {`
          .shadow-button-${index} {
            background: ${item.bgColor};
            padding: 20px;
            color: white;
            transition: background 0.3s ease;
            box-shadow: 0 3px ${item.shadowColor};
          }
          .shadow-button-${index}:hover {
            background: ${item.hoverBgColor};
          }

          .darma-button:active {
            box-shadow: 0 0 ${item.shadowColor};
          }     
        `}
          </style>
          <button
            key={index}
            onClick={() => {
              setState((old) => ({
                ...old,
                ...item,
              }));
            }}
            className={`w-14 h-14 rounded-full transition-all duration-300 transform shadow-button-${index}
            ${
              state.bgColor === item.bgColor &&
              state.hoverBgColor === item.hoverBgColor &&
              state.shadowColor === item.shadowColor
                ? "border-2 border-green-700 scale-110"
                : ""
            }
            `}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
